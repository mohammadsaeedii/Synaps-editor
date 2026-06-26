/* =========================================================================
   synapse · shared helpers
   The non-DOM utilities from the original core.js, ported to TypeScript. The
   hyperscript `n()` builder is gone (React replaces it); everything else —
   ids, time formatting, text helpers, clipboard, download — is preserved.
   ========================================================================= */

/** Join truthy class names. The `className` ergonomic for CSS Modules. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Collision-resistant id, identical scheme to the original store. */
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms = 120) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...a: A) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, a), ms);
  };
}

export function throttle<A extends unknown[]>(fn: (...a: A) => void, ms = 60) {
  let last = 0;
  let t: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...a: A) {
    const now = Date.now();
    const rem = ms - (now - last);
    if (rem <= 0) {
      last = now;
      fn.apply(this, a);
    } else {
      clearTimeout(t);
      t = setTimeout(() => {
        last = Date.now();
        fn.apply(this, a);
      }, rem);
    }
  };
}

export function fmtRelative(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 7) return d + "d ago";
  const w = Math.floor(d / 7);
  if (w < 5) return w + "w ago";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const fmtDate = (ts: number): string =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export const fmtTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function deriveTitle(text: string, fallback = "Untitled"): string {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return fallback;
  return t.length <= 42 ? t : t.slice(0, 42).replace(/\s\S*$/, "") + "…";
}

export function initials(name: string): string {
  return (
    (name || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "U"
  );
}

/** HTML-escape; used by the markdown renderer (which emits trusted HTML). */
export function esc(s: unknown): string {
  return String(s).replace(
    /[&<>"']/g,
    (c) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<string, string>)[c],
  );
}

export const pluralize = (nn: number, one: string, many?: string): string =>
  nn === 1 ? one : many || one + "s";

/* ---------- clipboard / download (client-only) ------------------------- */
export function copyText(t: string, ok?: () => void): void {
  const done = () => ok?.();
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(t).then(done).catch(() => fallbackCopy(t, done));
  } else {
    fallbackCopy(t, done);
  }
}

function fallbackCopy(t: string, done?: () => void): void {
  const ta = document.createElement("textarea");
  ta.value = t;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.append(ta);
  ta.select();
  try {
    document.execCommand("copy");
    done?.();
  } catch {
    /* ignore */
  }
  ta.remove();
}

export function downloadText(filename: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
