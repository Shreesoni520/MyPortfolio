<p align="center">
  <img src="assets/favicon.png" width="72" height="72" alt="Shree." />
</p>

<h1 align="center">Shree.</h1>

<p align="center">
  <strong>A personal site that should feel sharp on first load.</strong><br />
  Dark room. Ice-blue accent. Motion that earns its place.
</p>

<p align="center">
  <a href="https://shreesoni.vercel.app"><img alt="Live site" src="https://img.shields.io/badge/Live-shreesoni.vercel.app-8ec5ff?style=for-the-badge" /></a>
  <img alt="HTML5" src="https://img.shields.io/badge/HTML-5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img alt="CSS3" src="https://img.shields.io/badge/CSS-3-1572B6?style=for-the-badge&logo=css&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" />
</p>

---

## The idea

Most portfolios look like a template with a name swapped in. This one is supposed to feel like walking into a room.

You land on a loader, the brand splits in, and a quiet ASCII cloud follows the cursor. Scroll and the page glides. Hover a signal line and the text unscrambles. Work, process, stack, contact — each section has one job.

No framework. No build step. Just HTML, CSS, and JavaScript, shipped on Vercel.

**Live:** [shreesoni.vercel.app](https://shreesoni.vercel.app)

---

## Features

| | |
| --- | --- |
| **Loader → hero** | Name, progress line, then the brand letters drop in |
| **ASCII spotlight** | Soft cursor-follow cloud on the hero; fades when idle |
| **Signal lines** | Scramble / decode on hover and keyboard focus |
| **Lenis scroll** | Smooth page glide, with a top progress bar |
| **Selected work** | Portfolio, Extract, and the rest of GitHub |
| **Process** | Discover → Structure → Craft → Polish |
| **Toolkit marquee** | Dual-direction stack of tools I actually use |
| **Live stats** | Public repo count from GitHub, plus live sites |
| **Quiet on purpose** | Mobile nav, and `prefers-reduced-motion` turns the show down |

---

## Quick start

```bash
git clone https://github.com/Shreesoni520/MyPortfolio.git
cd MyPortfolio
python -m http.server 5500
```

Open [http://localhost:5500](http://localhost:5500).

No `npm install`. Static files only. A local server is better than opening `index.html` directly, because the live GitHub stats need `fetch`.

---

## How it works

```
Loader  →  Hero (ASCII + Shree)
              │
              ├─ Work: Portfolio, Extract, GitHub
              ├─ About + live stats
              ├─ Process: Discover → Structure → Craft → Polish
              ├─ Stack marquee
              └─ Contact
```

- **Scroll** is [Lenis](https://github.com/darkroomengineering/lenis) unless the visitor asks for reduced motion.
- **ASCII** is a canvas field that tracks the pointer, then clears after idle.
- **Signal lines** decode from noise into a readable string on hover / focus.
- **Stats** pull public GitHub data in the browser. If the request fails, the page still stands.

```text
MyPortfolio/
├── index.html
├── css/styles.css
├── js/main.js
├── assets/
│   ├── favicon.png
│   ├── favicon-32.png
│   ├── favicon-48.png
│   └── apple-touch-icon.png
└── README.md
```

---

## Stack

- HTML5 + CSS3 (custom properties, grid / flex, keyframes)
- Vanilla JavaScript + [Lenis](https://github.com/darkroomengineering/lenis)
- [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) for brand
- [Sora](https://fonts.google.com/specimen/Sora) for UI
- [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) for signal / ASCII
- [Vercel](https://vercel.com) for deploy

Accent `#8ec5ff` on near-black `#070708`. Display type for the name. Mono for the noise. Motion pauses when it should.

---

## Selected work

| Project | What it is | Link |
| --- | --- | --- |
| **Portfolio** | This site — ASCII UI, selected work, contact | [shreesoni.vercel.app](https://shreesoni.vercel.app) |
| **Extract** | Private person-to-person file sharing | [shrees-extractions.vercel.app](https://shrees-extractions.vercel.app) |
| **More** | Code, experiments, whatever is next | [github.com/Shreesoni520](https://github.com/Shreesoni520) |

---

## Contact

Open to freelance, collabs, and roles where craft actually matters.

- **Email:** [shreesoni520@gmail.com](mailto:shreesoni520@gmail.com)
- **GitHub:** [Shreesoni520](https://github.com/Shreesoni520)
- **X:** [@Shreessoni520](https://x.com/Shreessoni520)
- **Instagram:** [krishna_soni.52](https://www.instagram.com/krishna_soni.52/)
- **Discord:** `shree_soni520`

---

## License

Personal work. Read it, learn from it — please don’t ship the site as your own.

Designed and coded with intention by **Shree**.
