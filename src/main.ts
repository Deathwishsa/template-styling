import "./styles/main.scss";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { site } from "./config/site.config";
import { applyBrand } from "./config/applyBrand";
import { populateDom } from "./dom/populate";

import { initSmoothScroll } from "./scroll/smoothScroll";
import { initReveals, splitWords } from "./scroll/reveals";

import { initHeader } from "./ui/header";
import { initMenu } from "./ui/menu";
import { initCursor } from "./ui/cursor";
import { initMarquee } from "./ui/marquee";
import { initCounters } from "./ui/counters";
import { runPreloader } from "./ui/preloader";

import { HeroScene } from "./gl/HeroScene";
import { prefersReducedMotion, supportsWebGL } from "./utils/device";

gsap.registerPlugin(ScrollTrigger);

function boot(): void {
  document.body.classList.add("is-loading");

  // 1. Brand + content from the single config source of truth
  applyBrand(site);
  populateDom(site);

  // 2. Split text for word-level reveals before measuring/animating
  splitWords();

  // 3. Smooth scroll (Lenis) + GSAP sync
  const scroll = initSmoothScroll(site.options.smoothScroll);

  // 4. UI + scroll choreography
  initHeader();
  initMenu(scroll);
  initCursor(site.options.customCursor);
  initReveals();
  initMarquee();
  initCounters();

  // 5. WebGL hero (with graceful fallbacks)
  const canvas = document.querySelector<HTMLCanvasElement>("[data-gl-canvas]");
  const hero = document.querySelector<HTMLElement>("#hero");
  let scene: HeroScene | null = null;

  const canRun3D = canvas && supportsWebGL() && !prefersReducedMotion();
  if (canRun3D && canvas && hero) {
    try {
      scene = new HeroScene({
        canvas,
        accent: site.brand.colors.accent,
        glow: site.brand.colors.glow,
      });
      // Map hero scroll progress → scene uniforms
      ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => scene?.setScroll(self.progress),
      });
      // Dev-only handle for inspection/tuning in the console.
      if (import.meta.env.DEV) (window as unknown as { __hero?: HeroScene }).__hero = scene;
    } catch (err) {
      console.warn("WebGL hero failed, using fallback:", err);
      hero.classList.add("is-fallback");
    }
  } else if (hero) {
    hero.classList.add("is-fallback");
  }

  // 6. Preloader → reveal hero → settle layout
  runPreloader().then(() => {
    scene?.start();
    ScrollTrigger.refresh();
  });

  // Refresh triggers once fonts have loaded (line measurements depend on them)
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
