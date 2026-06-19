import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/device";

/**
 * Scroll-scrubbed stat counters: each number counts up from 0 to its target as
 * the row scrolls into place, and counts back down when you scroll up — fully
 * reversible (same feel as the About word-highlight). Suffixes (+, yrs, …) are
 * preserved.
 */
export function initCounters(): void {
  const values = Array.from(
    document.querySelectorAll<HTMLElement>(".about__stat-value")
  );
  if (!values.length) return;

  const reduced = prefersReducedMotion();

  values.forEach((el) => {
    const raw = (el.textContent ?? "").trim();
    const match = raw.match(/^(\d+)(.*)$/); // leading number + suffix
    if (!match) return;

    const digits = match[1];
    const target = parseInt(digits, 10);
    const suffix = match[2] ?? "";
    el.style.setProperty("--n", digits.length.toString());
    el.dataset.final = digits;
    el.dataset.suffix = suffix;

    if (reduced) {
      el.textContent = digits + suffix;
      el.classList.add("is-counted");
      return;
    }

    el.textContent = "0" + suffix;

    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      end: "top 48%",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        el.textContent = Math.round(p * target) + suffix;
        el.classList.toggle("is-counting", p > 0.001 && p < 0.999);
        el.classList.toggle("is-counted", p >= 0.999);
      },
    });
  });
}

/**
 * Resets the counters to zero (used by "back to top"). The scrubbed triggers
 * then re-drive the values from scroll position as the user moves again.
 */
export function resetCounters(): void {
  const reduced = prefersReducedMotion();
  Array.from(document.querySelectorAll<HTMLElement>(".about__stat-value")).forEach(
    (el) => {
      const digits = el.dataset.final;
      if (!digits) return;
      const suffix = el.dataset.suffix ?? "";
      if (reduced) {
        el.textContent = digits + suffix;
        return;
      }
      el.classList.remove("is-counting", "is-counted");
      el.textContent = "0" + suffix;
    }
  );
}
