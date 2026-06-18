import "./styles/main.scss";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { site } from "./config/site.config";
import { applyBrand } from "./config/applyBrand";
import { populateDom } from "./dom/populate";

import { initSmoothScroll } from "./scroll/smoothScroll";
import { initReveals, resetReveals, splitWords } from "./scroll/reveals";

import { initHeader } from "./ui/header";
import { initMenu } from "./ui/menu";
import { initCursor } from "./ui/cursor";
import { initMarquee } from "./ui/marquee";
import { initCounters, resetCounters } from "./ui/counters";
import { runPreloader } from "./ui/preloader";

import { HeroScene } from "./gl/HeroScene";
import { prefersReducedMotion, supportsWebGL } from "./utils/device";

gsap.registerPlugin(ScrollTrigger);

// Run as early as possible (module eval, before DOMContentLoaded) so the browser
// never restores the previous scroll position on refresh — every load starts at
// the top and animates in like a first visit.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

function boot(): void {
  document.body.classList.add("is-loading");

  // Belt-and-braces: ensure we're at the top before measuring/animating.
  window.scrollTo(0, 0);

  // Dev-only: expose gsap + a manual reset for console inspection.
  if (import.meta.env.DEV) {
    const w = window as unknown as { __gsap?: typeof gsap; __reset?: () => void };
    w.__gsap = gsap;
    w.__reset = () => {
      resetReveals();
      resetCounters();
    };
  }

  // 1. Brand + content from the single config source of truth
  applyBrand(site);
  populateDom(site);

  // 2. Split text for word-level reveals before measuring/animating
  splitWords();

  // 3. Smooth scroll (Lenis) + GSAP sync. Make sure Lenis also starts pinned
  //    to the top (independent of the browser's restored scroll position).
  const scroll = initSmoothScroll(site.options.smoothScroll);
  scroll.scrollTo(0, { immediate: true });

  // 4. UI + scroll choreography
  initHeader();
  initMenu(scroll);
  initCursor(site.options.customCursor);
  initReveals();
  initMarquee();
  initCounters();

  // "Back to top" soft-resets the scroll animations (no preloader): scroll up,
  // then reset reveals + counters so they replay on the way back down.
  document.querySelector<HTMLElement>("[data-scroll-top]")?.addEventListener("click", () => {
    scroll.scrollTo(0, {
      onComplete: () => {
        resetReveals();
        resetCounters();
      },
    });
  });

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
