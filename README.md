# Shree.

Creative frontend portfolio — dark, ice-blue, and built to feel sharp on first load.

**Live:** [shreesoni.vercel.app](https://shreesoni.vercel.app)

---

## About

I’m Shree — a frontend developer who builds clean, expressive sites with presence, not noise. This repo is my personal site: plain HTML, CSS, and JavaScript, shipped on Vercel.

---

## Highlights

- **Lenis smooth scroll** — buttery page glide (respects reduced motion)
- **ASCII spotlight** — soft cursor-follow cloud on the hero; fades after idle
- **Signal lines** — scramble / decode text on hover and focus
- **Work** — live projects: Portfolio, Extract, and more on GitHub
- **Process + stack** — scroll-aware steps and a dual-direction toolkit marquee
- **Live stats** — public repo count from GitHub + live sites linked on the page
- **Responsive** — desktop polish, mobile nav, `prefers-reduced-motion` support

---

## Stack

| Layer | Tools |
| --- | --- |
| Markup | HTML5 |
| Style | CSS3 (custom properties, grid/flex, keyframes) |
| Motion | Vanilla JS + [Lenis](https://github.com/darkroomengineering/lenis) |
| Fonts | [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), [Sora](https://fonts.google.com/specimen/Sora), [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) |
| Deploy | [Vercel](https://vercel.com) |

---

## Structure

```text
MyPortfolio/
├── index.html
├── css/styles.css
├── js/
│   ├── main.js
│   └── ascii-matrix.js
├── assets/
│   ├── favicon.png
│   ├── favicon-32.png
│   ├── favicon-48.png
│   ├── apple-touch-icon.png
│   └── work/
│       ├── portfolio.png
│       └── extract.png
└── README.md
```

No build step. Static files only.

---

## Run locally

```bash
git clone https://github.com/Shreesoni520/MyPortfolio.git
cd MyPortfolio
python -m http.server 5500
```

Open [http://localhost:5500](http://localhost:5500).

You can also open `index.html` directly; a local server is better for fetch-based stats.

---

## Selected work

| Project | Link |
| --- | --- |
| Portfolio | [shreesoni.vercel.app](https://shreesoni.vercel.app) |
| Extract | [shrees-extractions.vercel.app](https://shrees-extractions.vercel.app) |
| More | [github.com/Shreesoni520](https://github.com/Shreesoni520) |

---

## Design

- Accent `#8ec5ff` on near-black `#070708`
- Display type for brand moments; Sora for UI; mono for signal/ASCII
- Motion pauses / simplifies with `prefers-reduced-motion`
- Hero ASCII follows the pointer and clears when idle or on leave

---

## Contact

- **Email:** [shreesoni520@gmail.com](mailto:shreesoni520@gmail.com)
- **GitHub:** [Shreesoni520](https://github.com/Shreesoni520)
- **X:** [@Shreessoni520](https://x.com/Shreessoni520)
- **Instagram:** [krishna_soni.52](https://www.instagram.com/krishna_soni.52/)
- **Discord:** `shree_soni520` (copy from the live site contact row)

---

## License

Personal work. Explore the code to learn — please don’t copy the site wholesale as your own.

Built with intention by **Shree**.
