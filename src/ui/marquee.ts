import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/device";

/**
 * Seamless infinite marquee. The track holds the items twice; we animate it by
 * half its width and loop. Scroll velocity nudges the speed for a live feel.
 */
export function initMarquee(): void {
  const track = document.querySelector<HTMLElement>("[data-marquee]");
  if (!track || prefersReducedMotion()) return;

  const half = track.scrollWidth / 2;
  const baseDuration = half / 80; // px per second

  const tween = gsap.to(track, {
    x: -half,
    duration: baseDuration,
    ease: "none",
    repeat: -1,
    modifiers: {
      x: (x) => `${parseFloat(x) % half}px`,
    },
  });

  // React to scroll velocity
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = 1 + Math.min(Math.abs(self.getVelocity()) / 1000, 4);
      tween.timeScale(v * (self.direction || 1));
    },
  });
}
