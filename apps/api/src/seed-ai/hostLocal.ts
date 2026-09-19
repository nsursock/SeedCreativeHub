import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";

export type HostedFile = {
  localUrl: string;
  filename: string;
  mimeType: string;
  bytes: number;
};

function sniffExt(buf: Buffer, url: string, mimeHint?: string): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50) return ".png";
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "RIFF") {
    if (buf.length >= 12 && buf.toString("ascii", 8, 12) === "WEBP") return ".webp";
    return ".wav";
  }
  if (buf.length >= 3 && buf.toString("ascii", 0, 3) === "ID3") return ".mp3";
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0) return ".mp3";
  if (buf.length >= 8 && buf.toString("ascii", 4, 8) === "ftyp") return ".mp4";
  const fromMime = mimeHint?.includes("png")
    ? ".png"
    : mimeHint?.includes("webp")
      ? ".webp"
      : mimeHint?.includes("jpeg") || mimeHint?.includes("jpg")
        ? ".jpg"
        : mimeHint?.includes("mp4")
          ? ".mp4"
          : mimeHint?.includes("mpeg") || mimeHint?.includes("mp3")
            ? ".mp3"
            : mimeHint?.includes("wav")
              ? ".wav"
              : "";
  if (fromMime) return fromMime;
  const pathExt = extname(new URL(url, "http://local").pathname).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".mp3", ".wav", ".mp4", ".gif"].includes(pathExt)) {
    return pathExt === ".jpeg" ? ".jpg" : pathExt;
  }
  return ".bin";
}

function mimeForExt(ext: string): string {
  switch (ext) {
    case ".jpg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

/** True when URL is already served from our /seed-media cache. */
export function isSeedHosted(url: string | null | undefined, publicApiUrl: string): boolean {
  if (!url) return false;
  const base = publicApiUrl.replace(/\/$/, "");
  return url.startsWith(`${base}/seed-media/`) || url.includes("/seed-media/");
}

/**
 * Download a remote (or already-local) media URL into seed-cache and return a
 * public URL under PUBLIC_API_URL/seed-media/*.
 */
export async function hostMediaLocally(opts: {
  url: string;
  cacheDir: string;
  publicApiUrl: string;
  prefix?: string;
  timeoutMs?: number;
}): Promise<HostedFile> {
  const publicBase = opts.publicApiUrl.replace(/\/$/, "");
  if (isSeedHosted(opts.url, publicBase)) {
    const filename = opts.url.split("/seed-media/")[1]?.split("?")[0] ?? "";
    return {
      localUrl: opts.url.split("?")[0],
      filename,
      mimeType: mimeForExt(extname(filename)),
      bytes: 0,
    };
  }

  mkdirSync(opts.cacheDir, { recursive: true });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120_000);
  try {
    const res = await fetch(opts.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { Accept: "*/*", "User-Agent": "CreativeHubSeed/1.0" },
    });
    if (!res.ok) {
      throw new Error(`hostMediaLocally failed ${res.status} for ${opts.url.slice(0, 120)}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) throw new Error("hostMediaLocally: empty body");
    const ct = res.headers.get("content-type") ?? undefined;
    const ext = sniffExt(buf, opts.url, ct);
    const hash = createHash("sha1").update(buf).digest("hex").slice(0, 12);
    const prefix = (opts.prefix ?? "media").replace(/[^a-z0-9_-]/gi, "").slice(0, 24) || "media";
    const filename = `${prefix}-${hash}${ext}`;
    const path = join(opts.cacheDir, filename);
    if (!existsSync(path)) writeFileSync(path, buf);
    return {
      localUrl: `${publicBase}/seed-media/${filename}`,
      filename,
      mimeType: mimeForExt(ext),
      bytes: buf.length,
    };
  } finally {
    clearTimeout(timer);
  }
}
