# 408 · sudo-sleep

A React + TypeScript version of 408's original portfolio. It keeps the original header, font sizes, spacing, two-project layout, avatar, biography, and about/contact sidebar. The visual changes are limited to a darker green palette, desaturated imagery, restrained analog texture, and brief peripheral eyes using the supplied references.

## Run

```sh
npm install
npm run dev
```

## Build and check

```sh
npm run build
npx playwright install chromium
npm test
```

`dist/` is a self-contained static site. The Vite base is relative, so the build can also be hosted in a subdirectory. No backend, API keys, or runtime GitHub requests are required.

## Content sources

Public sources verified on 30 October 2026:

- [Original portfolio / AboutMe](https://github.com/sudo-sleep-now/AboutMe): layout foundation, avatar, Pelagic preview, fonts, biography, and contact details.
- [Public profile](https://github.com/sudo-sleep-now/sudo-sleep-now): identity, pronouns, interests, and contacts.
- [Pelagic](https://github.com/sudo-sleep-now/Pelagic): JavaScript / Three.js ocean simulation.
- [Waffles](https://github.com/sudo-sleep-now/Waffles): dependency-free binary serialization for Roblox, native buffers, schemas, and guarded decoders.

The archive is deliberately curated rather than populated from every repository.

## Visual assets

All eye imagery comes from the three user-supplied reference images, copied unchanged into `public/assets/eye.png`, `eyes-field.png`, and `eyes-scatter.png`. CSS crops different eyes from those originals. No generated imagery is used by the site. The avatar and ocean screenshot are from the original portfolio; the Waffles icon is also unchanged from the original portfolio. Font licenses are included alongside the local Bricolage Grotesque and DM Sans files.

## Effects and accessibility

`src/Signal.tsx` owns a 25 fps correlated video-noise canvas, short dropouts, bottom-edge head-switch noise, slow luminance drift, and a dynamic SVG displacement map. The displacement map shifts neighboring horizontal lines together and briefly bends a narrow section during tracking errors, without changing DOM geometry or hit targets. Image-only horizontal color delay and a faint offset echo soften highlights. The CSS CRT grid is deliberately faint and alternates fields rather than acting as the main VHS effect.

The grain canvas blends directly with the page using soft light, preserving black levels instead of covering the interface with a gray veil. Eye appearances and tape errors have separate schedules; only some coincide. The supplied eyes remain brief and restricted to the edges.

Touch devices, devices reporting four or fewer CPU cores, and reduced-data environments use a 12 fps smaller canvas and skip the full-page displacement filter. ResizeObserver keeps the map aligned after layout changes. All rendering pauses when the tab is hidden and its animation frame, observer, event handlers, image map, and noise canvas are cleaned up when effects are disabled.

Visual behavior references: [A/V Artifact Atlas — Head Switching Noise](https://www.avartifactatlas.com/artifacts/fr/head_switching_noise.html) and [Time Base Error](https://github.com/bavc/avaa/blob/master/_artifacts/time_base_error.md).

The footer Effects control pauses interference and saves the preference locally. `prefers-reduced-motion` disables all animated effects automatically. Navigation, projects, and contact links remain usable with effects off. There is no audio, forced intro, or dependency on external font servers.

The browser suite checks the original header scale and two-column geometry, real repository links, effect persistence and filter cleanup, stable link geometry during animated warping, the slower-device fallback, live reduced-motion changes, peripheral eye timing and placement, clipboard feedback, and navigation/overflow at 320, 390, 768, and 1440 pixels.
