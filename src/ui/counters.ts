import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/device";

/**
 * "Decode" counters for the stats row: on scroll-in, each value rapidly cycles
 * random digits and locks them left-to-right until the real number settles —
 * a flip-board / decrypting effect. Suffixes (+, yrs, …) are preserved.
 */
export function initCounters(): void {
  const values = Array.from(
    document.querySelectorAll<HTMLElement>(".about__stat-value")
  );
  if (!values.length) return;

  const reduced = prefersReducedMotion();

  values.forEach((el, i) => {
    const raw = (el.textContent ?? "").trim();
    const match = raw.match(/^(\d+)(.*)$/); // leading number + suffix
    if (!match) return;

    const digits = match[1];
    const suffix = match[2] ?? "";
    el.style.setProperty("--n", digits.length.toString());

    if (reduced) {
      el.textContent = raw;
      return;
    }

    // Placeholder so layout doesn't jump before it animates in.
    el.textContent = "0".repeat(digits.length) + suffix;

    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => decode(el, digits, suffix, 1100, i * 160),
    });
  });
}

function decode(
  el: HTMLElement,
  digits: string,
  suffix: string,
  duration: number,
  delay: number
): void {
  const n = digits.length;
  const rand = () => Math.floor(Math.random() * 10).toString();

  window.setTimeout(() => {
    el.classList.add("is-counting");
    const start = performance.now();

    const frame = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const locked = Math.floor(eased * n);

      let out = "";
      for (let i = 0; i < n; i++) out += i < locked ? digits[i] : rand();
      el.textContent = out + suffix;

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = digits + suffix;
        el.classList.remove("is-counting");
        el.classList.add("is-counted");
      }
    };
    requestAnimationFrame(frame);
  }, delay);
}
