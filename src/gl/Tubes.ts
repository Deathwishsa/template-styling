import {
  AdditiveBlending,
  CatmullRomCurve3,
  Group,
  Mesh,
  ShaderMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import vertexShader from "./shaders/tube.vert";
import fragmentShader from "./shaders/tube.frag";
import { curlPath } from "./curl";
import { hexToRgb } from "../config/applyBrand";

export interface TubesOptions {
  count: number;
  segments: number;
  accent: string;
  glow: string;
}

/**
 * Builds a flock of glowing tubes whose paths follow streamlines through a
 * curl-noise field — the signature flowing-ribbon look. Returns the group plus
 * the shared material so uniforms can be driven from the render loop.
 */
export function createTubes(opts: TubesOptions): {
  group: Group;
  material: ShaderMaterial;
} {
  const group = new Group();

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
      uScroll: { value: 0 },
      uAmp: { value: 0.25 },
      uAccent: { value: hexToRgb(opts.accent) },
      uGlow: { value: hexToRgb(opts.glow) },
      uTintColor: { value: new Vector3(0.15, 0.45, 1.0) },
      uTint: { value: 0 },
    },
  });

  for (let i = 0; i < opts.count; i++) {
    const start = new Vector3(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 8
    );
    const points = curlPath(start, opts.segments, 0.35);
    const curve = new CatmullRomCurve3(points, false, "catmullrom", 0.5);
    const geometry = new TubeGeometry(curve, opts.segments * 2, 0.025 + Math.random() * 0.03, 8, false);
    const mesh = new Mesh(geometry, material);
    group.add(mesh);
  }

  return { group, material };
}
