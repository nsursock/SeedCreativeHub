/** IntersectionObserver-based scroll reveal. Respects perf-lite + reduced motion. */
export function reveal(node: HTMLElement, delay = 0) {
  const disabled =
    document.documentElement.classList.contains("perf-lite") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (delay) node.style.setProperty("--reveal-delay", `${delay}ms`);

  if (disabled) {
    node.classList.add("reveal", "reveal-in");
    return { destroy() {} };
  }

  node.classList.add("reveal");
  const show = () => {
    node.classList.add("reveal-in");
  };

  // Avoid stuck opacity:0 when the block is already on-screen (common on work pages)
  const rect = node.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (rect.top < vh * 0.92 && rect.bottom > 0) {
    requestAnimationFrame(show);
    return { destroy() {} };
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
  );
  io.observe(node);

  return {
    destroy() {
      io.disconnect();
    },
  };
}

/** Deterministic hue from a string — for gradient avatars / thumbs. */
export function hueOf(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 360;
  return h;
}

/** Initials for avatar discs (RTL-safe: uses first letters of first two words). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] ?? "") + (parts[1][0] ?? "");
}

/** True when a media URL is safe to use as an <img> src. */
export function isImageMediaUrl(url?: string | null, kind?: string | null, mimeType?: string | null): boolean {
  if (kind === "image") return Boolean(url);
  if (kind === "audio" || kind === "video" || kind === "file" || kind === "embed") return false;
  if (mimeType?.startsWith("image/")) return Boolean(url);
  if (!url) return false;
  try {
    const path = new URL(url, "http://local").pathname.toLowerCase();
    if (/\.(avif|bmp|gif|jpe?g|png|svg|webp)(\?|$)/i.test(path)) return true;
    if (/\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm|mov|m4v)(\?|$)/i.test(path)) return false;
  } catch {
    /* ignore */
  }
  // Hosted picsum / pravatar / common CDNs without extension
  if (/picsum\.photos|pravatar|images\.unsplash|imagedelivery/i.test(url)) return true;
  return false;
}

/** First usable *image* URL for thumbnails / featured art (never audio/video files). */
export function workCoverUrl(work: {
  type?: string;
  media?: Array<{
    kind?: string | null;
    mimeType?: string | null;
    publicUrl?: string | null;
    externalUrl?: string | null;
  }> | null;
}): string | null {
  for (const m of work.media ?? []) {
    const url = m.publicUrl || m.externalUrl || null;
    if (url && isImageMediaUrl(url, m.kind, m.mimeType)) return url;
  }
  return null;
}

/** Prefer media matching work type (audio/video/image); cover images via workCoverUrl. */
export function workMediaUrl(
  work: {
    type?: string;
    media?: Array<{
      kind?: string | null;
      mimeType?: string | null;
      publicUrl?: string | null;
      externalUrl?: string | null;
    }> | null;
  },
  preferKind?: string,
): string | null {
  const rows = work.media ?? [];
  const kind =
    preferKind ??
    (work.type === "image" ? "image" : work.type === "video" ? "video" : work.type === "audio" ? "audio" : undefined);
  if (kind) {
    const match = rows.find((m) => m.kind === kind && (m.publicUrl || m.externalUrl));
    if (match) return match.publicUrl || match.externalUrl || null;
  }
  if (work.type === "image") return workCoverUrl(work);
  const first = rows[0];
  return first?.publicUrl || first?.externalUrl || null;
}
