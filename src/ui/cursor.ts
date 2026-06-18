import { gsap } from "gsap";
import { isTouch } from "../utils/device";

/**
 * Custom magnetic cursor. Desktop only — disabled on touch. Elements marked
 * [data-magnetic] gently pull toward the pointer; the ring grows on hover.
 */
export function initCursor(enabled: boolean): void {
  if (!enabled || isTouch()) return;

  const cursor = document.querySelector<HTMLElement>("[data-cursor]");
  if (!cursor) return;
  document.body.classList.add("has-cursor");

  const dotX = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3" });
  const dotY = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3" });

  window.addEventListener("pointermove", (e) => {
    cursor.classList.add("is-active");
    dotX(e.clientX);
    dotY(e.clientY);
  });

  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const strength = 0.35;
    el.addEventListener("pointerenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-hover");
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      gsap.to(el, { x, y, duration: 0.4, ease: "power3" });
    });
  });
}
