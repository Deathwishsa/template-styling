import { gsap } from "gsap";
import type { ScrollContext } from "../scroll/smoothScroll";
import { prefersReducedMotion } from "../utils/device";

/**
 * Click-to-expand for the Services tiles. Clicking a tile flies it to the
 * centre of the viewport and scales it up into an overlay while the other three
 * scatter outward like shooting stars. Clicking again (or the backdrop / Esc)
 * rewinds everything back into the grid.
 */

let section: HTMLElement | null = null;
let backdrop: HTMLDivElement | null = null;
let scrollCtx: ScrollContext | null = null;
let expanded: HTMLElement | null = null;
let busy = false;

export function initServices(scroll: ScrollContext): void {
  scrollCtx = scroll;
  section = document.querySelector<HTMLElement>("#services");
  const items = section
    ? Array.from(section.querySelectorAll<HTMLElement>(".services__item"))
    : [];
  if (!section || !items.length) return;

  backdrop = document.createElement("div");
  backdrop.className = "svc-backdrop";
  document.body.appendChild(backdrop);
  backdrop.addEventListener("click", () => collapse());

  items.forEach((item) => {
    item.addEventListener("click", () => {
      if (busy) return;
      if (expanded === item) collapse();
      else if (!expanded) expand(item);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") collapse();
  });
}

function others(active: HTMLElement): HTMLElement[] {
  return Array.from(section!.querySelectorAll<HTMLElement>(".services__item")).filter(
    (i) => i !== active
  );
}

function expand(item: HTMLElement): void {
  if (!section) return;
  const reduced = prefersReducedMotion();
  expanded = item;
  busy = true;

  scrollCtx?.lenis?.stop();
  section.classList.add("is-stage");
  item.classList.add("is-active");
  document.body.classList.add("svc-open");

  const head = section.querySelector<HTMLElement>(".section__head");
  const sibs = others(item);
  gsap.killTweensOf([item, ...sibs, backdrop, head].filter(Boolean) as object[]);

  gsap.to(backdrop, { autoAlpha: 1, duration: 0.4, ease: "power2.out" });
  if (head) gsap.to(head, { opacity: 0.12, duration: 0.4 });

  // Centre + scale the active tile (transform-only, so the grid never reflows).
  const r = item.getBoundingClientRect();
  const targetW = Math.min(window.innerWidth * 0.86, 600);
  let scale = targetW / r.width;
  const maxH = window.innerHeight * 0.8;
  if (r.height * scale > maxH) scale = maxH / r.height;
  scale = gsap.utils.clamp(1.05, 2.4, scale);
  const dx = window.innerWidth / 2 - (r.left + r.width / 2);
  const dy = window.innerHeight / 2 - (r.top + r.height / 2);

  gsap.to(item, {
    x: dx,
    y: dy,
    scale,
    duration: reduced ? 0.25 : 0.7,
    ease: "power3.out",
    onComplete: () => (busy = false),
  });

  // Scatter the rest outward (shooting stars), staggered for a trailing feel.
  const dist = Math.max(window.innerWidth, window.innerHeight) * 1.1;
  sibs.forEach((sib, i) => {
    sib.style.pointerEvents = "none";
    const sr = sib.getBoundingClientRect();
    const vx = sr.left + sr.width / 2 - window.innerWidth / 2;
    const vy = sr.top + sr.height / 2 - window.innerHeight / 2;
    const len = Math.hypot(vx, vy) || 1;
    gsap.to(sib, {
      x: reduced ? 0 : (vx / len) * dist,
      y: reduced ? 0 : (vy / len) * dist,
      rotation: reduced ? 0 : gsap.utils.random(-60, 60),
      scale: reduced ? 1 : 0.55,
      autoAlpha: 0,
      duration: reduced ? 0.2 : 0.7,
      ease: "power2.in",
      delay: reduced ? 0 : i * 0.05,
    });
  });
}

function collapse(): void {
  if (!expanded || !section) return;
  const reduced = prefersReducedMotion();
  const item = expanded;
  expanded = null;
  busy = true;

  const head = section.querySelector<HTMLElement>(".section__head");
  const sibs = others(item);
  gsap.killTweensOf([item, ...sibs, backdrop, head].filter(Boolean) as object[]);

  gsap.to(backdrop, { autoAlpha: 0, duration: 0.4, ease: "power2.in" });
  if (head) gsap.to(head, { opacity: 1, duration: 0.4 });

  gsap.to(item, {
    x: 0,
    y: 0,
    scale: 1,
    duration: reduced ? 0.2 : 0.6,
    ease: "power3.inOut",
    onComplete: () => {
      gsap.set(item, { clearProps: "transform,zIndex" });
      item.classList.remove("is-active");
    },
  });

  // Rewind the scattered tiles back into place (reverse stagger).
  sibs.forEach((sib, i) => {
    gsap.to(sib, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      autoAlpha: 1,
      duration: reduced ? 0.2 : 0.7,
      ease: "power3.out",
      delay: reduced ? 0 : (sibs.length - 1 - i) * 0.05,
      onComplete: () => {
        sib.style.pointerEvents = "";
        gsap.set(sib, { clearProps: "transform,opacity,visibility" });
      },
    });
  });

  gsap.delayedCall(reduced ? 0.25 : 0.8, () => {
    section?.classList.remove("is-stage");
    document.body.classList.remove("svc-open");
    scrollCtx?.lenis?.start();
    busy = false;
  });
}

/** Instantly collapse an expanded tile — used by the global reset. */
export function resetServices(): void {
  if (!section) return;
  const items = Array.from(section.querySelectorAll<HTMLElement>(".services__item"));
  const head = section.querySelector<HTMLElement>(".section__head");
  gsap.killTweensOf([...items, backdrop, head].filter(Boolean) as object[]);

  items.forEach((i) => {
    i.classList.remove("is-active");
    i.style.pointerEvents = "";
    gsap.set(i, { clearProps: "transform,opacity,visibility,zIndex" });
  });
  if (head) gsap.set(head, { clearProps: "opacity" });
  if (backdrop) gsap.set(backdrop, { autoAlpha: 0 });

  section.classList.remove("is-stage");
  document.body.classList.remove("svc-open");
  if (expanded) {
    scrollCtx?.lenis?.start();
    expanded = null;
  }
  busy = false;
}
