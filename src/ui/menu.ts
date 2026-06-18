import type { ScrollContext } from "../scroll/smoothScroll";

/** Wires the fullscreen overlay menu + anchor navigation through Lenis. */
export function initMenu(scroll: ScrollContext): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (scroll.lenis) open ? scroll.lenis.stop() : scroll.lenis.start();
    document.body.classList.toggle("menu-open", open);
  };

  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));

  // Anchor links (header + overlay) → smooth scroll, close menu
  document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("#")) {
        e.preventDefault();
        setOpen(false);
        // wait a frame so Lenis restarts before scrolling
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
