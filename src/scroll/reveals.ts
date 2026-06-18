import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import { prefersReducedMotion } from "../utils/device";

/**
 * Registers all scroll-driven reveals:
 *  - [data-reveal]  fade/translate in on enter
 *  - [data-split]   line-by-line clip reveal (SplitType)
 *  - [data-words]   per-word opacity tied to scroll progress
 */
export function initReveals(): void {
  const reduced = prefersReducedMotion();

  // Simple reveals (with stagger for grouped siblings). Trigger ~15% of the
  // viewport height BEFORE the element enters view ("top 115%") so the fade
  // finishes off-screen and you never catch it mid-load.
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 115%",
    onEnter: (els) =>
      els.forEach((el, i) =>
        gsap.delayedCall(reduced ? 0 : i * 0.06, () => el.classList.add("is-in"))
      ),
  });

  // Line reveals
  document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
    if (!reduced) {
      SplitType.create(el, { types: "lines", lineClass: "line" });
      // wrap each line's content so the child can translate within overflow:hidden
      el.querySelectorAll<HTMLElement>(".line").forEach((line) => {
        const inner = document.createElement("span");
        inner.append(...Array.from(line.childNodes));
        line.appendChild(inner);
      });
    }
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => el.classList.add("is-in"),
    });
  });

  // Per-word opacity scrub
  document.querySelectorAll<HTMLElement>("[data-words]").forEach((el) => {
    if (reduced) {
      el.querySelectorAll<HTMLElement>(".word").forEach((w) => (w.style.opacity = "1"));
      return;
    }
    const words = el.querySelectorAll<HTMLElement>(".word");
    gsap.to(words, {
      opacity: 1,
      stagger: 0.5,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        end: "bottom 60%",
        scrub: true,
      },
    });
  });
}

/** Splits [data-words] text into spans. Run before initReveals. */
export function splitWords(): void {
  document.querySelectorAll<HTMLElement>("[data-words]").forEach((el) => {
    const text = el.textContent ?? "";
    el.innerHTML = text
      .split(/\s+/)
      .map((w) => `<span class="word">${w}</span>`)
      .join(" ");
  });
}
