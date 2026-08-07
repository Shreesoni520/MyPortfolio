# Shree — Creative Frontend Portfolio

Personal portfolio for **Shree** — a creative frontend developer focused on expressive interfaces, clear hierarchy, and motion that feels intentional.

**Live site:** [shreesoni.vercel.app](https://shreesoni.vercel.app)

---

## Overview

A dark, ice-blue portfolio built with plain HTML, CSS, and JavaScript. No framework bloat — just sharp structure, custom interaction, and performance-minded motion.

Designed to feel like a product, not a template: custom cursor, ASCII hover fields, signal-line scramble effects, and a toolkit marquee that stays smooth on scroll.

---

## Features

- **Custom cursor** — hollow ring + tip with hover/click states
- **ASCII fields** — soft density cloud on Hero & About, locked to the cursor tip
- **Signal lines** — scramble text on hover/focus
- **Work showcase** — live projects with clean previews
- **Process section** — scroll-aware step highlights
- **Toolkit marquee** — dual-direction tech chips with spotlight
- **Live stats** — public repo count from GitHub + live sites linked on the page
- **Responsive layout** — desktop polish, mobile nav, reduced-motion support

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Markup | HTML5 |
| Style | CSS3 (custom properties, grid/flex, keyframes) |
| Motion | Vanilla JavaScript (`requestAnimationFrame`, Intersection Observer) |
| Fonts | [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), [Sora](https://fonts.google.com/specimen/Sora), [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) |
| Deploy | [Vercel](https://vercel.com) |

---

## Project structure

```text
MyPortfolio/
├── index.html          # Page structure & content
├── css/
│   └── styles.css      # Design system, layout, motion
├── js/
│   └── main.js         # Cursor, ASCII, reveals, stats, interactions
├── assets/
│   ├── favicon.png
│   ├── favicon-32.png
│   ├── favicon-48.png
│   ├── apple-touch-icon.png
│   └── shree.png
└── README.md
```

---

## Getting started

No build step required.

```bash
# clone
git clone https://github.com/Shreesoni520/MyPortfolio.git
cd MyPortfolio

# open locally (any static server works)
# example with Python:
python -m http.server 5500
```

Then visit `http://localhost:5500`.

Or open `index.html` directly in a browser (some features prefer a local server).

---

## Selected work

| Project | Link |
| --- | --- |
| This Portfolio | [shreesoni.vercel.app](https://shreesoni.vercel.app) |
| Extract | [shrees-extractions.vercel.app](https://shrees-extractions.vercel.app) |
| More on GitHub | [github.com/Shreesoni520](https://github.com/Shreesoni520) |

---

## Design notes

- Accent: ice blue (`#8ec5ff`) on near-black
- Display type for brand moments; Sora for UI; Mono for signal/ASCII
- Motion respects `prefers-reduced-motion`
- ASCII fields pause when idle and clear when the pointer leaves

---

## Contact

- **Email:** [shreesoni520@gmail.com](mailto:shreesoni520@gmail.com)
- **GitHub:** [Shreesoni520](https://github.com/Shreesoni520)
- **X:** [@Shreessoni520](https://x.com/Shreessoni520)
- **Instagram:** [krishna_soni.52](https://www.instagram.com/krishna_soni.52/)

---

## License

This portfolio is personal work. Feel free to explore the code for learning — please don’t copy it wholesale as your own site.

---

Built with intention by **Shree**.
