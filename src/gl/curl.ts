import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { Vector3 } from "three";

const noise = new ImprovedNoise();

/** Sample the divergence-free curl of a 3D Perlin field at p. */
export function curl(p: Vector3, target = new Vector3()): Vector3 {
  const eps = 0.0001;
  const n = (x: number, y: number, z: number) => noise.noise(x, y, z);

  // ∂/∂y and ∂/∂z of each field component → curl
  const x1 = n(p.x, p.y + eps, p.z) - n(p.x, p.y - eps, p.z);
  const x2 = n(p.x, p.y, p.z + eps) - n(p.x, p.y, p.z - eps);
  const y1 = n(p.x, p.y, p.z + eps) - n(p.x, p.y, p.z - eps);
  const y2 = n(p.x + eps, p.y, p.z) - n(p.x - eps, p.y, p.z);
  const z1 = n(p.x + eps, p.y, p.z) - n(p.x - eps, p.y, p.z);
  const z2 = n(p.x, p.y + eps, p.z) - n(p.x, p.y - eps, p.z);

  target.set((x1 - x2), (y1 - y2), (z1 - z2));
  return target.multiplyScalar(1 / (2 * eps)).normalize();
}

/** Walk a streamline through the curl field to produce a flowing path. */
export function curlPath(start: Vector3, steps: number, stepSize: number): Vector3[] {
  const points: Vector3[] = [];
  const p = start.clone();
  const v = new Vector3();
  for (let i = 0; i < steps; i++) {
    points.push(p.clone());
    curl(p.clone().multiplyScalar(0.18), v);
    p.addScaledVector(v, stepSize);
  }
  return points;
}
