export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const map = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin);

/** Frame-rate independent damping factor for lerp smoothing. */
export const damp = (lambda: number, dt: number): number => 1 - Math.exp(-lambda * dt);
