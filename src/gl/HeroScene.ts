import {
  ACESFilmicToneMapping,
  Group,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { createTubes } from "./Tubes";
import { dpr, perfTier, type PerfTier } from "../utils/device";
import { clamp, damp, lerp } from "../utils/math";

// How much faster the flow runs while the user presses/holds.
const BOOST_TIME_SCALE = 3.5;
// Tilt range (degrees) that maps to the full -1..1 parallax extent.
const TILT_RANGE = 28;

// Hold-by-side tint colors (normalized RGB) and how long the fade takes.
const TINT_BLUE = new Vector3(0.15, 0.45, 1.0); // left side
const TINT_RED = new Vector3(1.0, 0.18, 0.22); // right side
const TINT_PURPLE = new Vector3(0.62, 0.2, 1.0); // both sides
const TINT_FADE_SECONDS = 5;

interface HeroSceneOpts {
  canvas: HTMLCanvasElement;
  accent: string;
  glow: string;
}

const TIER_CONFIG: Record<PerfTier, { count: number; segments: number; bloom: boolean }> = {
  low: { count: 9, segments: 60, bloom: false },
  mid: { count: 16, segments: 90, bloom: true },
  high: { count: 22, segments: 120, bloom: true },
};

export class HeroScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private composer?: EffectComposer;
  private group: Group;
  private material: ShaderMaterial;

  private mouse = new Vector2(0, 0);
  private targetMouse = new Vector2(0, 0);
  private scroll = 0;
  private clock = 0;
  private running = false;
  private lastTime = 0;
  private useBloom: boolean;

  // Active pressing pointers → clientX, so we know which side(s) are held.
  // Supports multi-touch (e.g. both sides at once on mobile = purple).
  private pointers = new Map<number, number>();
  private timeScale = 1;

  // Side-hold color tint, ramped over TINT_FADE_SECONDS.
  private tintAmount = 0;
  private tintColor = TINT_BLUE.clone();

  // Device-tilt parallax (mobile) — calibrated to the first reading so the
  // phone's resting angle becomes the neutral center.
  private orientationEnabled = false;
  private orientationReceived = false;
  private beta0: number | null = null;
  private gamma0: number | null = null;

  constructor(opts: HeroSceneOpts) {
    const tier = perfTier();
    const cfg = TIER_CONFIG[tier];
    this.useBloom = cfg.bloom;

    this.renderer = new WebGLRenderer({
      canvas: opts.canvas,
      antialias: tier === "high",
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(dpr(tier === "low" ? 1.5 : 2));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.camera = new PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0, 9);

    const tubes = createTubes({
      count: cfg.count,
      segments: cfg.segments,
      accent: opts.accent,
      glow: opts.glow,
    });
    this.group = tubes.group;
    this.material = tubes.material;
    this.scene.add(this.group);

    this.resize();

    if (this.useBloom) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const bloom = new UnrealBloomPass(
        new Vector2(window.innerWidth, window.innerHeight),
        0.55, // strength
        0.6, // radius
        0.28 // threshold
      );
      this.composer.addPass(bloom);
      this.composer.addPass(new OutputPass());
    }

    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", () => {
      document.hidden ? this.stop() : this.start();
    });

    // Non-iOS exposes orientation without permission; iOS (13+) requires a
    // user gesture, so we request it lazily on the first press (onPointerDown).
    const DOE = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
      | undefined;
    if (DOE && typeof DOE.requestPermission !== "function") {
      this.enableOrientation();
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    // Track the live X of any held pointer (so dragging across the midline
    // switches sides).
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, e.clientX);

    // Mouse hover (desktop). Touch devices drive parallax via tilt instead.
    if (e.pointerType === "touch") return;
    this.targetMouse.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1)
    );
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.pointers.set(e.pointerId, e.clientX);
    void this.requestOrientationPermission();
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
  };

  /** iOS: ask for motion permission on a user gesture, then start listening. */
  private async requestOrientationPermission(): Promise<void> {
    if (this.orientationEnabled) return;
    const DOE = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
      | undefined;
    if (DOE && typeof DOE.requestPermission === "function") {
      try {
        if ((await DOE.requestPermission()) === "granted") this.enableOrientation();
      } catch {
        /* user declined — desktop mouse / no parallax on this device */
      }
    }
  }

  private enableOrientation(): void {
    if (this.orientationEnabled) return;
    this.orientationEnabled = true;
    window.addEventListener("deviceorientation", this.onOrientation);

    // Diagnose the common failure: sensors are blocked outside a secure
    // context, so over plain HTTP on a phone no events ever arrive.
    window.setTimeout(() => {
      if (!this.orientationReceived) {
        const reason = window.isSecureContext
          ? "no deviceorientation events (device/browser may not report tilt)"
          : "deviceorientation blocked — page is not a secure context (use HTTPS)";
        console.warn(`[hero] tilt parallax inactive: ${reason}`);
      }
    }, 3000);
  }

  private onOrientation = (e: DeviceOrientationEvent): void => {
    if (e.beta === null || e.gamma === null) return;
    this.orientationReceived = true;
    // Calibrate neutral position from the first reading.
    if (this.beta0 === null || this.gamma0 === null) {
      this.beta0 = e.beta;
      this.gamma0 = e.gamma;
      return;
    }
    const x = clamp((e.gamma - this.gamma0) / TILT_RANGE, -1, 1); // tilt L/R
    const y = clamp((e.beta - this.beta0) / TILT_RANGE, -1, 1); // tilt F/B
    this.targetMouse.set(x, -y);
  };

  /** Normalized hero scroll progress (0 at top → 1 when hero is scrolled away). */
  setScroll(progress: number): void {
    this.scroll = progress;
  }

  private resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer?.setSize(w, h);
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    // Which side(s) are being held? Only counts while the hero is on screen.
    let leftActive = false;
    let rightActive = false;
    if (this.scroll < 0.95 && this.pointers.size > 0) {
      const mid = window.innerWidth / 2;
      for (const x of this.pointers.values()) {
        if (x < mid) leftActive = true;
        else rightActive = true;
      }
    }
    const anySide = leftActive || rightActive;

    // Press-and-hold speeds the flow up; release eases it back to normal.
    const targetScale = anySide ? BOOST_TIME_SCALE : 1;
    this.timeScale = lerp(this.timeScale, targetScale, damp(5, dt));
    this.clock += dt * this.timeScale;

    // Side-hold tint: left → blue, right → red, both → purple. Amount fades
    // in/out over ~5s; the hue eases toward whichever side is active.
    const targetTint =
      leftActive && rightActive
        ? TINT_PURPLE
        : leftActive
          ? TINT_BLUE
          : rightActive
            ? TINT_RED
            : null;
    this.tintAmount = clamp(
      this.tintAmount + ((targetTint ? 1 : -1) * dt) / TINT_FADE_SECONDS,
      0,
      1
    );
    if (targetTint) {
      const c = damp(3, dt);
      this.tintColor.x = lerp(this.tintColor.x, targetTint.x, c);
      this.tintColor.y = lerp(this.tintColor.y, targetTint.y, c);
      this.tintColor.z = lerp(this.tintColor.z, targetTint.z, c);
    }

    // Eased pointer follow (frame-rate independent)
    const k = damp(6, dt);
    this.mouse.x = lerp(this.mouse.x, this.targetMouse.x, k);
    this.mouse.y = lerp(this.mouse.y, this.targetMouse.y, k);

    const u = this.material.uniforms;
    u.uTime.value = this.clock;
    u.uMouse.value.copy(this.mouse);
    u.uScroll.value = this.scroll;
    u.uTint.value = this.tintAmount;
    u.uTintColor.value.copy(this.tintColor);

    // Idle rotation + parallax (rotation also scales with the boost)
    this.group.rotation.y += dt * 0.05 * this.timeScale;
    this.group.rotation.x = this.mouse.y * 0.15;
    this.camera.position.x = lerp(this.camera.position.x, this.mouse.x * 0.8, k);
    this.camera.lookAt(0, 0, 0);

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.loop);
  };

  dispose(): void {
    this.stop();
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("deviceorientation", this.onOrientation);
    this.renderer.dispose();
  }
}
