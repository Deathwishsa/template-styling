# Studio — Lusion-tier single-page template

A frontend-only, single-page creative-studio template built to compete aesthetically with [lusion.co](https://lusion.co): a real-time WebGL hero (flowing curl-noise glowing tubes), scroll choreography, crisp SVG, and flawless responsiveness across mobile / tablet / desktop.

## Stack

| Concern | Tech |
|---|---|
| Bundler / dev | Vite |
| Language | TypeScript |
| 3D | Three.js + custom GLSL shaders |
| Animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| Styling | SCSS (tokens + fluid mixins) |
| Text reveals | SplitType |

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to /dist
npm run preview  # preview the built site
```

## Rebranding — edit ONE file

Everything (text, colors, contact, nav, social, sections **and** the 3D hero tint) is driven by:

```
src/config/site.config.ts
```

Change the brand name, `colors` (these flow into both CSS custom properties and the WebGL shader uniforms via `applyBrand`), contact details, nav, social links, and section content there — no other file needs touching. Feature flags live in `options` (`smoothScroll`, `customCursor`, `grain`).

## Structure

```
src/
├─ config/      site.config.ts (white-label), applyBrand.ts
├─ dom/         populate.ts — fills index.html [data-*] slots from config
├─ styles/      SCSS (abstracts / base / layout / components / sections)
├─ scroll/      smoothScroll.ts (Lenis), reveals.ts (GSAP + SplitType)
├─ ui/          preloader, menu, cursor, marquee, header
├─ gl/          HeroScene, Tubes, curl noise, shaders/ (GLSL)
└─ utils/       device (perf tiers / reduced-motion), math
```

## Performance & accessibility

- **Perf tiers** (`utils/device.ts`) scale tube count / bloom / DPR by device capability.
- **`prefers-reduced-motion`** → static gradient hero, no smooth-scroll inertia, instant reveals.
- **Touch** → custom cursor disabled; WebGL pauses when the tab is hidden.
- DPR capped at 2 (1.5 on low tier).

## Tuning the 3D hero

- Colors: `site.config.ts → brand.colors.accent / glow`.
- Density / fidelity: `TIER_CONFIG` in `src/gl/HeroScene.ts`.
- Flow look: tube radius & path step in `src/gl/Tubes.ts`; displacement/fresnel in `src/gl/shaders/tube.vert|frag`.
- Bloom: `UnrealBloomPass` params in `HeroScene.ts`.

## Alternative stacks (not used, for reference)

- **React + react-three-fiber** — declarative 3D, easier to maintain if it grows into a multi-page app.
- **Astro + Three.js islands** — best Lighthouse/SEO; more manual 3D wiring.
