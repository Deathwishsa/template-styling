/**
 * ────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — single source of truth (white-label here)
 * ────────────────────────────────────────────────────────────────────────────
 *  Change brand name, colors, contact details, copy, nav, social links and
 *  section content in THIS FILE ONLY. Everything else (DOM + 3D + SCSS colors)
 *  reads from here. No other file needs editing to rebrand the template.
 */

export interface NavItem {
  label: string;
  target: string;
}

export interface SocialItem {
  label: string;
  url: string;
}

export interface WorkItem {
  title: string;
  tag: string;
  year: string;
  /** Optional image URL placed in /public. Falls back to a generated gradient. */
  image?: string;
}

export interface ServiceItem {
  title: string;
  desc: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface SiteConfig {
  brand: {
    name: string;
    tagline: string;
    /** Text/symbol logo mark shown in the header. */
    logoText: string;
    colors: {
      bg: string;
      fg: string;
      accent: string;
      glow: string;
    };
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  social: SocialItem[];
  nav: NavItem[];
  hero: {
    headline: string;
    sub: string;
    cta: string;
  };
  marquee: string[];
  work: WorkItem[];
  services: ServiceItem[];
  about: {
    label: string;
    statement: string;
    stats: StatItem[];
  };
  contactSection: {
    label: string;
    headline: string;
    cta: string;
  };
  meta: {
    title: string;
    description: string;
    ogImage: string;
    url: string;
  };
  options: {
    smoothScroll: boolean;
    customCursor: boolean;
    grain: boolean;
  };
}

export const site: SiteConfig = {
  brand: {
    name: "Studio",
    tagline: "We craft immersive digital experiences.",
    logoText: "Studio◦",
    colors: {
      bg: "#05060a",
      fg: "#f4f4ef",
      accent: "#6c5ce7",
      glow: "#a29bfe",
    },
  },

  contact: {
    email: "hello@studio.com",
    phone: "+1 555 0100",
    address: "Cape Town, South Africa",
  },

  social: [
    { label: "Instagram", url: "https://instagram.com" },
    { label: "X / Twitter", url: "https://x.com" },
    { label: "LinkedIn", url: "https://linkedin.com" },
    { label: "Dribbble", url: "https://dribbble.com" },
  ],

  nav: [
    { label: "Work", target: "#work" },
    { label: "Services", target: "#services" },
    { label: "About", target: "#about" },
    { label: "Contact", target: "#contact" },
  ],

  hero: {
    headline: "Design that moves.",
    sub: "An independent studio building immersive, real‑time web experiences for ambitious brands.",
    cta: "View our work",
  },

  marquee: [
    "Branding",
    "WebGL",
    "Motion",
    "3D",
    "Interaction",
    "Strategy",
    "Art Direction",
  ],

  work: [
    { title: "Aurora", tag: "WebGL · Brand", year: "2026" },
    { title: "Halcyon", tag: "Product · Motion", year: "2025" },
    { title: "Monolith", tag: "3D · Identity", year: "2025" },
    { title: "Lumen", tag: "Interactive · Web", year: "2024" },
  ],

  services: [
    {
      title: "Creative Direction",
      desc: "Concept, art direction and the strategy that turns an idea into a coherent, unmistakable brand.",
    },
    {
      title: "Real‑time 3D",
      desc: "Bespoke WebGL, custom shaders and GPU‑driven visuals built for 60fps across every device.",
    },
    {
      title: "Motion & Interaction",
      desc: "Scroll choreography, micro‑interactions and transitions that make a page feel alive.",
    },
    {
      title: "Design & Build",
      desc: "End‑to‑end design and front‑end engineering, shipped pixel‑perfect and performant.",
    },
  ],

  about: {
    label: "About",
    statement:
      "We are a small team of designers and engineers obsessed with the craft of the web — where motion, code and art direction meet to create work that people remember.",
    stats: [
      { value: "120+", label: "Projects shipped" },
      { value: "18", label: "Awards" },
      { value: "9yrs", label: "Of craft" },
    ],
  },

  contactSection: {
    label: "Contact",
    headline: "Let's build something unforgettable.",
    cta: "Start a project",
  },

  meta: {
    title: "Studio — Immersive Digital Experiences",
    description:
      "An independent studio building immersive, real-time web experiences for ambitious brands.",
    ogImage: "/og.jpg",
    url: "https://studio.example.com",
  },

  options: {
    smoothScroll: true,
    customCursor: true,
    grain: true,
  },
};
