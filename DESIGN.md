---
name: Coralì Tailwind Maritime
version: 2026-05-18
implementation:
  framework: Static HTML
  styling: Tailwind CSS 4.3 via browser CDN
  tailwind_cdn: https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3
  custom_css: false
  tailwind_config: false
  pages:
    - index.html
    - menu.html
  behavior_file: Coralì/site.js
colors:
  background: stone-100
  surface: stone-100
  surface-muted: stone-200
  surface-overlay: stone-200/70
  text-primary: slate-950
  text-body: slate-600
  text-muted: slate-500
  dark: slate-950
  dark-soft: slate-900
  coral-accent: orange-700
  coral-soft: orange-200
  coral-selection: orange-300
  maritime-accent: sky-800
typography:
  display:
    fontFamily: Playfair Display
    usage: hero logo, editorial headlines, menu item names
  body:
    fontFamily: Montserrat
    usage: body copy, nav, labels, buttons
  hero:
    desktop: text-[15rem]
    tablet: sm:text-[10rem]
    mobile: text-[6.5rem]
    class: font-['Playfair_Display'] font-semibold leading-none tracking-tight
layout:
  container: max-w-7xl
  page-padding: px-5 sm:px-8 lg:px-10
  section-spacing: py-24 lg:py-32/36
  grid: lg:grid-cols-12 for editorial layouts
  radius: none
motion:
  reveal_initial: opacity-0 translate-y-8
  reveal_final: opacity-100 translate-y-0
  reveal_transition: transition-all duration-700 ease-out
  image_hover: transition duration-700 hover:scale-105
  hero_image_motion: motion-safe:animate-[pulse_9s_ease-in-out_infinite]
assets:
  hero: img/hero.png
  location: Coralì/immagini/locale.jpg
  dessert_generated: Coralì/immagini/generated/dolce-cheesecake.png
  decorative:
    - Coralì/immagini/corallo.png
    - Coralì/immagini/corallo2.png
    - Coralì/immagini/corallo4.png
    - Coralì/immagini/TRE ALGHE.png
    - Coralì/immagini/alga2.png
contact:
  address: Corso Cristoforo Colombo, 86, 17019 Varazze SV
  phone_display: 019 770 3829
  phone_href: tel:+390197703829
---

## Brand Direction

Coralì uses a restrained maritime luxury language: dark slate overlays, pale stone surfaces, orange/coral accents, and local restaurant photography. The current site should feel quiet, editorial, and material rather than decorative or promotional.

The visual system is intentionally minimal. Most sections are built from large photographic fields, generous negative space, sharp rectangular crops, and precise typographic contrast. Coral and algae assets are used as faint watermarks only, never as primary illustrations.

## Technical Rules

- Use Tailwind CSS 4.3 through `@tailwindcss/browser@4.3`.
- Do not add `tailwind.config`, custom CSS, inline `style=`, or `<style>` blocks.
- Styling must be expressed with Tailwind classes only, including arbitrary values such as `font-['Playfair_Display']`, `text-[15rem]`, and `animate-[pulse_9s_ease-in-out_infinite]`.
- JavaScript is allowed only for behavior in `Coralì/site.js`: mobile menu state and IntersectionObserver reveal animations.
- Use local assets from `Coralì/`; do not reference remote generated image URLs.

## Color System

The previous custom palette has been mapped to native Tailwind colors:

- **Stone (`stone-100`, `stone-200`)** replaces parchment and warm restaurant surfaces.
- **Slate (`slate-950`, `slate-900`, `slate-600`, `slate-500`)** replaces deep navy, ink, and neutral text.
- **Orange (`orange-700`, `orange-300`, `orange-200`)** replaces muted coral accents.
- **Sky (`sky-800`)** is reserved for subtle maritime/cantina accents.

Use the palette sparingly. The dominant read should be stone and slate, with orange as a small editorial accent for labels, hover states, and selection.

## Typography

- **Playfair Display** is used for the brand name, hero title, large editorial headings, and menu item names.
- **Montserrat** is used for navigation, labels, buttons, body copy, metadata, and prices.
- Hero typography on the home page is intentionally reduced to a single centered `Coralì` wordmark over photography, using `mix-blend-overlay` and white opacity to echo the Stitch variant.
- Labels use uppercase, heavy tracking, and small type: usually `text-[0.68rem]`, `font-bold`, `uppercase`, and `tracking-[0.28em]`.
- Body copy should stay measured and readable: `text-base`, `leading-8`, `tracking-wide`, usually in `text-slate-600`.

## Layout

- Use `max-w-7xl` as the main container width.
- Use responsive page padding: `px-5 sm:px-8 lg:px-10`.
- Desktop editorial sections use 12-column grids with asymmetry (`lg:grid-cols-12`, `lg:col-span-*`, `lg:col-start-*`).
- Mobile layouts collapse into a single column with generous spacing and no horizontal overflow.
- Avoid rounded cards. Containers, images, buttons, and frames should stay sharp.
- Use borders and tonal layers instead of shadows: `border-slate-900/10`, `border-white/25`, `bg-stone-200/70`.

## Components

### Header

The header is fixed, glassy, and minimal.

- Home header: dark translucent slate over the hero (`bg-slate-950/25`, white text), with no bottom border, nav and reservation link visible above the hero.
- Menu header: light translucent stone (`bg-stone-100/80`, slate text).
- Desktop nav uses uppercase tracked labels.
- Mobile nav opens through `data-menu-toggle` and `data-mobile-menu`; no external icon library is used.

### Hero

The current home hero contains only:

- background image `img/hero.png`
- dark slate overlay
- soft overlapping transition: long bottom gradient (`h-40 from-stone-100 via-stone-100/45 to-transparent`) and the first section pulled upward with negative margin
- centered `Coralì` wordmark using the Stitch-like combination `mix-blend-overlay`, white text, `opacity-90`, `tracking-tighter`, `text-[120px] md:text-[200px]`
- bottom-centered scroll indicator with `Scorri` label and a thin white line

Do not add hero subtitles, CTA buttons inside the hero, or feature copy unless the design direction changes again. The global header and scroll indicator may remain visible above the hero image.

### Buttons and Links

Buttons are rectangular, border-based, and uppercase with wide tracking.

- Primary light button: `bg-white text-slate-950 hover:bg-orange-100`.
- Ghost dark button: `border border-white/60 text-white hover:bg-white hover:text-slate-950`.
- Slate button: `border border-slate-950 hover:bg-slate-950 hover:text-white`.
- Text links may use only a bottom border or color shift on hover.

### Menu Lists

Menu sections pair one large image with editorial text and dish rows.

- Dish names use Playfair Display, around `text-2xl`.
- Prices are small, neutral, and aligned to the right.
- Descriptions use slate body text with `leading-7`.
- Rows are separated with low-contrast borders: `border-b border-slate-900/10`.

### Decorative Assets

Coral/algae PNGs are background marks only:

- Use `pointer-events-none`, `absolute`, low opacity (`opacity-10` to `opacity-45`).
- Keep them inside the viewport on mobile.
- Do not use them as masks or CSS backgrounds; render them as normal `<img>` elements.

## Motion

Motion is subtle and should not distract from the photography.

- Reveal animation starts with `opacity-0 translate-y-8`.
- `Coralì/site.js` removes those classes and adds `opacity-100 translate-y-0` when elements enter view.
- Respect reduced motion with `motion-reduce:transform-none motion-reduce:opacity-100`.
- The hero scroll indicator uses a subtle `motion-safe:animate-pulse`.
- Images may scale slightly on hover with `hover:scale-105`.
- The hero background may use the existing slow pulse animation.

## Image Rules

- Use local assets only.
- Keep real restaurant photography as the primary visual signal.
- Use `object-cover` and stable aspect ratios (`aspect-[4/5]`, `aspect-[16/10]`, `aspect-square`, `aspect-[4/3]`) to prevent layout shifts.
- Every meaningful image needs a useful Italian `alt`.
- Decorative images use empty `alt=""` and `aria-hidden="true"`.
- The generated dessert image lives at `Coralì/immagini/generated/dolce-cheesecake.png` and should remain project-local.

## Current Page Intent

### `index.html`

Home page focused on atmosphere:

- central hero wordmark over photography
- quiet-luxury positioning
- fluid gallery
- location and booking block
- contact details for Varazze address and phone booking

### `menu.html`

Menu page focused on dishes and structure:

- centered editorial intro
- large local food image
- sections for crudi/antipasti, primi, secondi, cantina, dolci
- generated dessert asset for the dolci section

## Do / Don't

Do:

- Keep surfaces pale and restrained.
- Use slate for authority and contrast.
- Use orange only for editorial accents.
- Keep page structure sharp, spacious, and photographic.
- Prefer real Coralì images over generated assets.

Don't:

- Reintroduce custom color tokens or Tailwind config.
- Add gradients or decorative blobs unrelated to the restaurant imagery.
- Use remote image URLs from generated outputs.
- Add text-heavy hero content on the home page.
- Add rounded cards or heavy shadows.
