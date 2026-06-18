# Current Implementation Overview

A snapshot of what this project is, how it's built, and where everything lives.

## Objective

A **frontend-only, single-page creative-studio template** built to compete aesthetically with [lusion.co](https://lusion.co) — a real-time WebGL hero, scroll-driven motion, crisp SVG, and flawless responsiveness across mobile, tablet, and desktop. It's a reusable, white-label starting point: rebrandable by editing a single config file.

## Stack & languages

| Concern | Technology |
|---|---|
| Bundler / dev server | **Vite 5** |
| Language | **TypeScript** (app logic) + **GLSL** (shaders) |
| 3D / WebGL | **Three.js** with custom shaders + UnrealBloom post-processing |
| Animation | **GSAP** + **ScrollTrigger** |
| Smooth scroll | **Lenis** |
| Styling | **SCSS** (Dart Sass) — design tokens + fluid mixins |
| Text reveals | **SplitType** |
| HTTPS (LAN) | **@vitejs/plugin-basic-ssl** (opt-in, for phone motion sensors) |

## The constant / config file (white-label)

**`src/config/site.config.ts`** is the single source of truth. Editing it rebrands the entire site — brand name, colors, contact details, nav, social links, and all section copy. The brand `colors` flow into **both** CSS custom properties **and** the WebGL shader uniforms via `src/config/applyBrand.ts`, so a color change updates the UI and the 3D hero together. `src/dom/populate.ts` injects this config into the `data-*` slots in `index.html` at boot. No other file needs editing to reskin the template.

## Project layout

```
styling/
├─ index.html                 # Single page; semantic sections with data-* slots
├─ vite.config.ts             # Vite + GLSL + (opt-in) HTTPS config
├─ host.ps1                   # Serve over LAN/WiFi (HTTPS) to view on a phone
├─ md/                        # Project documentation (this file)
├─ src/
│  ├─ main.ts                 # Bootstrap: brand → DOM → scroll → UI → WebGL
│  ├─ config/                 # site.config.ts (white-label) + applyBrand.ts
│  ├─ dom/                    # populate.ts — fills index.html from config
│  ├─ styles/                 # SCSS: abstracts / base / layout / components / sections
│  ├─ scroll/                 # smoothScroll.ts (Lenis) + reveals.ts (GSAP/SplitType)
│  ├─ ui/                     # preloader, menu, cursor, marquee, header, counters
│  ├─ gl/                     # HeroScene, Tubes, curl noise, shaders/ (GLSL)
│  └─ utils/                  # device (perf tiers / reduced-motion), math
└─ README.md
```

## Key features

- **WebGL hero** — flowing curl-noise glowing tubes (the signature Lusion-style effect), reacting to pointer and scroll.
- **Interaction** — desktop mouse parallax; **mobile device-tilt** drives the same parallax (requires HTTPS); **press-and-hold** (mouse or touch) speeds up the flow ~3.5×.
- **Decode stats** — the about stats scramble/lock digits left-to-right on scroll-in, staggered, with a drawn accent underline.
- **Scroll choreography** — Lenis smooth scroll, line/word reveals, velocity-reactive marquee.
- **UI** — preloader, fullscreen overlay menu, magnetic custom cursor, grain overlay.

## Performance & accessibility

- **Perf tiers** (`src/utils/device.ts`) scale tube count / bloom / DPR by device capability.
- **`prefers-reduced-motion`** → static gradient hero, no smooth-scroll inertia, instant reveals/counters.
- **Touch** → custom cursor disabled; WebGL pauses when the tab is hidden; DPR capped at 2.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build → dist/
npm run preview  # serve the built site
```

To view on a phone over WiFi (with working tilt): run `.\host.ps1` and open the printed `https://<lan-ip>:5173` URL (accept the self-signed cert warning).

## Branching

- **develop** — active development / integration branch.
- **prod** — production-ready, promoted from `develop`.
- **live** — currently deployed/live state.
