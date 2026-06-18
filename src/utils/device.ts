/** Device + capability detection used to scale fidelity and fallbacks. */

export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isTouch = (): boolean =>
  window.matchMedia("(hover: none), (pointer: coarse)").matches;

export const supportsWebGL = (): boolean => {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
};

export type PerfTier = "low" | "mid" | "high";

/** Coarse perf tier from cores, memory, touch and screen size. */
export const perfTier = (): PerfTier => {
  const cores = navigator.hardwareConcurrency ?? 4;
  // @ts-expect-error deviceMemory is non-standard but widely available
  const mem = (navigator.deviceMemory as number | undefined) ?? 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;

  if (isTouch() && (cores <= 4 || mem <= 4 || small)) return "low";
  if (cores <= 4 || mem <= 4) return "mid";
  return "high";
};

export const dpr = (max = 2): number => Math.min(window.devicePixelRatio || 1, max);
