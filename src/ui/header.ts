import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Condenses the header after scrolling past the first viewport. */
export function initHeader(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) return;

  ScrollTrigger.create({
    start: "top -80",
    end: 99999,
    onUpdate: (self) => header.classList.toggle("is-condensed", self.scroll() > 80),
    onToggle: (self) => header.classList.toggle("is-condensed", self.isActive),
  });
}
