import Lenis from "@studio-freight/lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/device";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollToOpts {
  /** Fired when the scroll animation finishes. */
  onComplete?: () => void;
  /** Jump instantly instead of animating. */
  immediate?: boolean;
}

export interface ScrollContext {
  lenis: Lenis | null;
  scrollTo: (target: string | number, opts?: ScrollToOpts) => void;
}

/**
 * Initializes Lenis smooth scrolling and binds it to a single GSAP ticker,
 * keeping ScrollTrigger in sync. Falls back to native scroll when reduced
 * motion is requested or smoothScroll is disabled.
 */
export function initSmoothScroll(enabled: boolean): ScrollContext {
  if (!enabled || prefersReducedMotion()) {
    // Native scroll; ScrollTrigger still works against the window.
    ScrollTrigger.refresh();
    return {
      lenis: null,
      scrollTo: (t, opts) => {
        const behavior: ScrollBehavior = opts?.immediate ? "auto" : "smooth";
        const el = typeof t === "string" ? document.querySelector(t) : null;
        if (el) el.scrollIntoView({ behavior });
        else if (typeof t === "number") window.scrollTo({ top: t, behavior });
        if (opts?.onComplete) window.setTimeout(opts.onComplete, opts?.immediate ? 0 : 650);
      },
    };
  }

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.documentElement.classList.add("lenis");

  return {
    lenis,
    scrollTo: (t, opts) =>
      lenis.scrollTo(t, {
        offset: 0,
        immediate: opts?.immediate,
        onComplete: opts?.onComplete,
      }),
  };
}
