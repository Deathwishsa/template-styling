/**
 * Minimal preloader: animates a 0→100 counter while the page/GL warms up,
 * then wipes away. Resolves so callers can start the hero render.
 */
export function runPreloader(): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-preloader]");
  const countEl = document.querySelector<HTMLElement>("[data-preloader-count]");
  const barEl = document.querySelector<HTMLElement>("[data-preloader-bar]");
  if (!root) return Promise.resolve();

  return new Promise((resolve) => {
    let progress = 0;
    const tick = () => {
      // ease toward 100 with diminishing increments
      progress += Math.max(0.5, (100 - progress) * 0.06);
      const v = Math.min(100, Math.round(progress));
      if (countEl) countEl.textContent = String(v);
      if (barEl) barEl.style.width = `${v}%`;

      if (v < 100) {
        requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => {
          root.classList.add("is-done");
          document.body.classList.remove("is-loading");
          window.setTimeout(resolve, 700);
        }, 250);
      }
    };
    requestAnimationFrame(tick);
  });
}
