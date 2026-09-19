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

/** First usable media URL on a work (Picsum / upload / sample). */
export function workCoverUrl(work: {
  media?: Array<{ publicUrl?: string | null; externalUrl?: string | null }> | null;
}): string | null {
  const m = work.media?.[0];
  return m?.publicUrl || m?.externalUrl || null;
}

/** Prefer image-like assets for thumbnails; otherwise first URL. */
export function workMediaUrl(
  work: {
    type?: string;
    media?: Array<{
      kind?: string | null;
      publicUrl?: string | null;
      externalUrl?: string | null;
    }> | null;
  },
  preferKind?: string,
): string | null {
  const rows = work.media ?? [];
  const kind = preferKind ?? (work.type === "image" ? "image" : work.type === "video" ? "video" : work.type === "audio" ? "audio" : undefined);
  if (kind) {
    const match = rows.find((m) => m.kind === kind && (m.publicUrl || m.externalUrl));
    if (match) return match.publicUrl || match.externalUrl || null;
  }
  return workCoverUrl(work);
}
