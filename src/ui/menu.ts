import { gsap } from "gsap";
import type { ScrollContext } from "../scroll/smoothScroll";
import { prefersReducedMotion } from "../utils/device";

/**
 * Fullscreen overlay menu with a fluid "ripple" reveal/retract.
 *
 * Open  : a circle (anchored at the menu button) expands while the nav items
 *         rise and fade in, staggered top-down.
 * Close : the items fall away bottom-first (like a wave pulling back) and the
 *         circle contracts to the button — water draining to a point.
 */
export function initMenu(scroll: ScrollContext): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  const closeBtn = document.querySelector<HTMLButtonElement>("[data-menu-close]");
  if (!toggle || !menu) return;

  const items = Array.from(
    menu.querySelectorAll<HTMLElement>(".menu__nav a, .menu__meta > *")
  );
  const reduced = prefersReducedMotion();

  let isOpen = false;
  let tl: gsap.core.Timeline | null = null;
  const clip = { r: 0 };
  const applyClip = () => menu.style.setProperty("--clip", `${clip.r}%`);

  const setOpen = (open: boolean): void => {
    if (open === isOpen) return;
    isOpen = open;
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (scroll.lenis) open ? scroll.lenis.stop() : scroll.lenis.start();

    tl?.kill();

    if (reduced) {
      clip.r = open ? 160 : 0;
      applyClip();
      gsap.set(items, { opacity: open ? 1 : 0, y: 0 });
      menu.classList.toggle("is-open", open);
      return;
    }

    tl = gsap.timeline();
    if (open) {
      menu.classList.add("is-open");
      tl.to(clip, { r: 160, duration: 0.7, ease: "power3.inOut", onUpdate: applyClip }, 0)
        .fromTo(
          items,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
            stagger: { each: 0.06, from: "start" },
          },
          0.15
        );
    } else {
      tl.to(
        items,
        {
          y: 36,
          opacity: 0,
          duration: 0.45,
          ease: "power2.in",
          stagger: { each: 0.05, from: "end" }, // bottom retracts first
        },
        0
      )
        .to(clip, { r: 0, duration: 0.75, ease: "power3.inOut", onUpdate: applyClip }, 0.1)
        .add(() => menu.classList.remove("is-open"));
    }
  };

  toggle.addEventListener("click", () => setOpen(!isOpen));
  closeBtn?.addEventListener("click", () => setOpen(false));

  // Anchor links (header + overlay) → smooth scroll, close menu first.
  document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("#")) {
        e.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => scroll.scrollTo(href));
      }
    });
  });

  // CTA + back-to-top
  document.querySelector<HTMLElement>("[data-hero-cta]")?.addEventListener("click", (e) => {
    e.preventDefault();
    scroll.scrollTo("#work");
  });
  document.querySelector<HTMLElement>("[data-scroll-top]")?.addEventListener("click", () =>
    scroll.scrollTo(0)
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}
