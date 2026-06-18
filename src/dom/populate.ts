import type { SiteConfig } from "../config/site.config";

/** Populates all `data-*` slots in index.html from the site config. */
export function populateDom(site: SiteConfig): void {
  const $ = <T extends Element = HTMLElement>(sel: string) =>
    document.querySelector<T>(sel);
  const $$ = <T extends Element = HTMLElement>(sel: string) =>
    Array.from(document.querySelectorAll<T>(sel));

  // Meta
  document.title = site.meta.title;
  setMeta("description", site.meta.description);
  setMeta("og:title", site.meta.title, true);
  setMeta("og:description", site.meta.description, true);
  setMeta("og:image", site.meta.ogImage, true);

  // Brand text
  $$("[data-brand-name]").forEach((el) => (el.textContent = site.brand.name));
  $$("[data-brand-logo]").forEach((el) => (el.textContent = site.brand.logoText));

  // Year
  $$("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

  // Hero
  setText("[data-hero-title]", site.hero.headline);
  setText("[data-hero-sub]", site.hero.sub);
  const cta = $("[data-hero-cta] span");
  if (cta) cta.textContent = site.hero.cta;

  // Nav (desktop + overlay)
  const navHtml = site.nav
    .map((n) => `<a href="${n.target}" data-nav-link data-magnetic>${n.label}</a>`)
    .join("");
  $$("[data-nav-desktop], [data-nav-overlay]").forEach((el) => (el.innerHTML = navHtml));

  // Contact
  $$("[data-contact-email], [data-contact-email-large]").forEach((el) => {
    el.setAttribute("href", `mailto:${site.contact.email}`);
    el.textContent = site.contact.email;
  });
  setText("[data-contact-phone]", site.contact.phone);
  setText("[data-contact-address]", site.contact.address);
  setText("[data-contact-label]", site.contactSection.label);
  setText("[data-contact-headline]", site.contactSection.headline);

  // About
  setText("[data-about-label]", site.about.label);
  setText("[data-about-statement]", site.about.statement);
  const stats = $("[data-about-stats]");
  if (stats)
    stats.innerHTML = site.about.stats
      .map(
        (s) =>
          `<li class="about__stat"><span class="about__stat-value">${s.value}</span><span class="about__stat-label">${s.label}</span></li>`
      )
      .join("");

  // Social (every [data-social] list)
  const socialHtml = site.social
    .map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener" data-magnetic>${s.label}</a></li>`)
    .join("");
  $$("[data-social]").forEach((el) => (el.innerHTML = socialHtml));

  // Marquee (duplicated for a seamless loop)
  const marqueeInner = site.marquee.map((m) => `<span>${m}</span>`).join("");
  const marquee = $("[data-marquee]");
  if (marquee) marquee.innerHTML = `${marqueeInner}${marqueeInner}`;

  // Work
  const work = $("[data-work]");
  if (work)
    work.innerHTML = site.work
      .map(
        (w) =>
          `<li class="work__item" data-reveal>
             <span class="work__title">${w.title}</span>
             <span class="work__tag">${w.tag}</span>
             <span class="work__year">${w.year}</span>
           </li>`
      )
      .join("");

  // Services
  const services = $("[data-services]");
  if (services)
    services.innerHTML = site.services
      .map(
        (s, i) =>
          `<li class="services__item" data-reveal>
             <span class="services__num">0${i + 1}</span>
             <h3 class="services__title">${s.title}</h3>
             <p class="services__desc">${s.desc}</p>
           </li>`
      )
      .join("");

  function setText(sel: string, text: string) {
    const el = $(sel);
    if (el) el.textContent = text;
  }
  function setMeta(name: string, content: string, property = false) {
    const attr = property ? "property" : "name";
    let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }
}
