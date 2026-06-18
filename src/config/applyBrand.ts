import type { SiteConfig } from "./site.config";

/**
 * Writes brand colors from site.config onto :root as CSS custom properties so
 * SCSS, the DOM, and the WebGL hero all read a single source of truth.
 */
export function applyBrand(site: SiteConfig): void {
  const root = document.documentElement;
  const { bg, fg, accent, glow } = site.brand.colors;
  root.style.setProperty("--c-bg", bg);
  root.style.setProperty("--c-fg", fg);
  root.style.setProperty("--c-accent", accent);
  root.style.setProperty("--c-glow", glow);

  if (!site.options.grain) document.body.classList.add("no-grain");
}

/** Parse a hex string into normalized RGB for shader uniforms. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(v, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
