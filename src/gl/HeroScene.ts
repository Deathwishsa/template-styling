import {
  ACESFilmicToneMapping,
  Group,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Vector2,
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

  // Press-and-hold speed boost (mouse click on desktop / touch on mobile)
  private pressed = false;
  private timeScale = 1;

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
    // Mouse hover (desktop). Touch devices drive parallax via tilt instead.
    if (e.pointerType === "touch") return;
    this.targetMouse.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1)
    );
  };

  private onPointerDown = (): void => {
    this.pressed = true;
    void this.requestOrientationPermission();
  };

  private onPointerUp = (): void => {
    this.pressed = false;
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

    // Press-and-hold speeds the flow up; release eases it back to normal.
    // Only boosts while the hero is on screen so taps lower down don't.
    const targetScale = this.pressed && this.scroll < 0.95 ? BOOST_TIME_SCALE : 1;
    this.timeScale = lerp(this.timeScale, targetScale, damp(5, dt));
    this.clock += dt * this.timeScale;

    // Eased pointer follow (frame-rate independent)
    const k = damp(6, dt);
    this.mouse.x = lerp(this.mouse.x, this.targetMouse.x, k);
    this.mouse.y = lerp(this.mouse.y, this.targetMouse.y, k);

    const u = this.material.uniforms;
    u.uTime.value = this.clock;
    u.uMouse.value.copy(this.mouse);
    u.uScroll.value = this.scroll;

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
