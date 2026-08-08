import Lenis from "https://cdn.jsdelivr.net/npm/lenis@1.3.25/+esm";
import { createAsciiMatrix } from "./ascii-matrix.js?v=20260809i";

(() => {
  const body = document.body;
  body.classList.add("is-loading");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Discourage casual drag / save / copy on protected photos
  document.querySelectorAll("[data-protect-media]").forEach((el) => {
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("dragstart", (e) => e.preventDefault());
    el.querySelectorAll("img").forEach((img) => {
      img.setAttribute("draggable", "false");
      img.addEventListener("dragstart", (e) => e.preventDefault());
    });
  });
  document.addEventListener("dragstart", (e) => {
    if (e.target && e.target.closest && e.target.closest("[data-protect-media]")) {
      e.preventDefault();
    }
  });

  // Lenis smooth scroll (same feel as premium portfolios like jigneshis)
  let lenis = null;
  if (!reduceMotion) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.4,
      wheelMultiplier: 1,
    });
    lenis.stop();
    const lenisLoop = (time) => {
      lenis.raf(time);
      requestAnimationFrame(lenisLoop);
    };
    requestAnimationFrame(lenisLoop);
    window.__lenis = lenis;
  }

  // Top scroll progress — driven by Lenis when available
  const progressBar = document.querySelector(".scroll-progress i");
  let scrollTracking = false;

  const readProgress = () => {
    if (!scrollTracking || !progressBar) return;
    const scrollTop = lenis
      ? lenis.scroll
      : document.documentElement.scrollTop || document.body.scrollTop;
    const limit = lenis
      ? lenis.limit
      : document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const p = limit > 0 ? scrollTop / limit : 0;
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
  };

  if (lenis) lenis.on("scroll", readProgress);
  else window.addEventListener("scroll", readProgress, { passive: true });
  window.addEventListener("resize", readProgress);

  // Loader then hero entrance — finish when shared lineFill ends (1.6s)
  let loaderDone = false;
  const unlockScroll = () => {
    body.classList.remove("is-loading");
    body.style.overflow = "";
    document.documentElement.style.overflow = "";
    lenis?.start();
  };

  const finishLoader = () => {
    if (loaderDone) return;
    loaderDone = true;
    document.querySelector(".loader")?.classList.add("is-done");
    unlockScroll();
    body.classList.add("is-ready");
    /* Hand top line over to scroll tracking from 0 */
    if (progressBar) {
      progressBar.style.animation = "none";
      progressBar.style.transform = "scaleX(0)";
    }
    scrollTracking = true;
    readProgress();
  };

  const startLoad = () => setTimeout(finishLoader, 1650);
  window.addEventListener("load", startLoad);
  if (document.readyState === "complete") startLoad();
  // Safety: never leave the page stuck non-scrollable
  setTimeout(finishLoader, 2800);

  // Split brand letters
  document.querySelectorAll("[data-split]").forEach((el) => {
    const text = el.textContent || "";
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.style.animationDelay = `${0.25 + i * 0.1}s`;
      el.appendChild(span);
    });
  });

  // Mark scroll sections for reveal (staggered)
  const revealGroups = [
    ".work-head",
    ".work-item",
    ".about-sticky",
    ".about-copy",
    ".process-head",
    ".step",
    ".stack-head",
    ".contact > *",
    ".site-link",
  ];
  const revealTargets = document.querySelectorAll(revealGroups.join(", "));
  revealTargets.forEach((el, i) => {
    el.classList.add("reveal-up");
    el.style.setProperty("--delay", `${(i % 6) * 90}ms`);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal-up").forEach((el) => io.observe(el));

  // Signal line: scramble / decode on hover (Awwwards-style, no black box)
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%$*<>/";

  const scrambleText = (el, finalText) => {
    const chars = [...finalText];
    el.innerHTML = "";
    const nodes = chars.map((ch) => {
      const span = document.createElement("span");
      span.className = ch === " " ? "ch is-space" : "ch";
      span.textContent = ch === " " ? "\u00A0" : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      el.appendChild(span);
      return { span, final: ch };
    });

    let frame = 0;
    const total = 18 + nodes.length;
    let raf = 0;

    const tick = () => {
      frame += 1;
      const revealCount = Math.floor((frame / total) * nodes.length);

      nodes.forEach((node, i) => {
        if (node.final === " ") {
          node.span.textContent = "\u00A0";
          node.span.classList.add("is-set");
          return;
        }
        if (i < revealCount) {
          node.span.textContent = node.final;
          node.span.classList.add("is-set");
        } else {
          node.span.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          node.span.classList.remove("is-set");
        }
      });

      if (frame < total) {
        raf = requestAnimationFrame(tick);
      } else {
        nodes.forEach((node) => {
          node.span.textContent = node.final === " " ? "\u00A0" : node.final;
          node.span.classList.add("is-set");
        });
      }
    };

    cancelAnimationFrame(el._scrambleRaf || 0);
    raf = requestAnimationFrame(tick);
    el._scrambleRaf = raf;
  };

  document.querySelectorAll("[data-signal]").forEach((line) => {
    const code = line.querySelector(".signal-line__code");
    if (!code) return;
    const finalText = code.getAttribute("data-text") || "";

    const run = () => scrambleText(code, finalText);
    line.addEventListener("pointerenter", run);
    line.addEventListener("focus", run);
  });

  // Anchor scrolling through Lenis for the same buttered glide
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -8, duration: 1.35 });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
  });

  // About stats: repos from GitHub; live sites from links shown on this page
  (() => {
    const GITHUB_USER = "Shreesoni520";

    // Wipe any older stats caches that used to freeze the live count.
    try {
      sessionStorage.removeItem("shreeGithubStats");
      sessionStorage.removeItem("shreeGithubStats_v2");
    } catch {
      /* ignore */
    }

    const isLiveHost = (href) => {
      const home = String(href || "").trim();
      if (!home) return null;
      try {
        const url = new URL(/^https?:\/\//i.test(home) ? home : `https://${home}`);
        const host = url.hostname.replace(/^www\./i, "").toLowerCase();
        if (!host || host === "github.com" || host.endsWith(".github.com")) return null;
        if (host === "localhost" || host.startsWith("127.")) return null;
        return host;
      } catch {
        return null;
      }
    };

    // Count unique live hosts actually linked in Work / Contact — not GitHub About URLs.
    const countLiveSitesOnPage = () => {
      const hosts = new Set();
      document
        .querySelectorAll("a.work-item[href], a.site-link[href]")
        .forEach((a) => {
          const host = isLiveHost(a.getAttribute("href"));
          if (host) hosts.add(host);
        });
      return hosts.size;
    };

    const animateCount = (el, target) => {
      const start = performance.now();
      const duration = 1800;
      const from = Number(el.textContent) || 0;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(from + (target - from) * eased));
        if (t < 1) requestAnimationFrame(tick);
        else {
          el.textContent = String(target);
          el.dataset.counted = "1";
        }
      };
      requestAnimationFrame(tick);
    };

    const observeCounters = () => {
      const counters = document.querySelectorAll("[data-count]");
      const countIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = Number(el.getAttribute("data-count") || "0");
            animateCount(el, target);
            countIo.unobserve(el);
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => countIo.observe(el));
    };

    const applyStats = (repos, live) => {
      const reposEl = document.querySelector('[data-stat="repos"]');
      const liveEl = document.querySelector('[data-stat="live"]');
      if (reposEl && Number.isFinite(repos)) {
        const next = String(repos);
        reposEl.setAttribute("data-count", next);
        if (reposEl.dataset.counted === "1") reposEl.textContent = next;
      }
      if (liveEl && Number.isFinite(live)) {
        const next = String(live);
        liveEl.setAttribute("data-count", next);
        if (liveEl.dataset.counted === "1") liveEl.textContent = next;
        const label = liveEl.parentElement?.querySelector("span");
        if (label) {
          label.textContent = live === 1 ? "Live site online" : "Live sites online";
        }
      }
    };

    const fetchRepoCount = async () => {
      const userRes = await fetch(`https://api.github.com/users/${GITHUB_USER}`, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!userRes.ok) throw new Error("user fetch failed");
      const user = await userRes.json();
      return Number(user.public_repos) || 0;
    };

    const liveCount = countLiveSitesOnPage();
    applyStats(Number(document.querySelector('[data-stat="repos"]')?.getAttribute("data-count")) || 0, liveCount);

    fetchRepoCount()
      .then((reposCount) => applyStats(reposCount, liveCount))
      .catch(() => {
        /* keep HTML repo fallback */
      })
      .finally(observeCounters);
  })();

  // Toolkit marquee: duplicate each row so -50% loops seamlessly (like jignesh)
  (() => {
    const board = document.querySelector(".stack-board");
    if (!board) return;

    board.querySelectorAll(".stack-rail__track").forEach((track) => {
      const group = track.querySelector(".stack-rail__group");
      if (!group || track.children.length > 1) return;
      track.appendChild(group.cloneNode(true));
    });

    board.addEventListener("pointerenter", () => board.classList.add("is-paused"));
    board.addEventListener("pointerleave", () => board.classList.remove("is-paused"));
  })();

  // Process lines: smooth active fill while scrolling / hovering
  (() => {
    const steps = [...document.querySelectorAll(".process-steps .step")];
    if (!steps.length) return;

    let hoverLocked = false;

    const setActive = (active) => {
      steps.forEach((step) => step.classList.toggle("is-active", step === active));
    };

    steps.forEach((step) => {
      step.addEventListener("pointerenter", () => {
        hoverLocked = true;
        setActive(step);
      });
      step.addEventListener("pointerleave", () => {
        hoverLocked = false;
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        if (hoverLocked) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target);
      },
      { threshold: [0.35, 0.55, 0.75], rootMargin: "-10% 0px -35% 0px" }
    );

    steps.forEach((step) => io.observe(step));
    setActive(steps[0]);
  })();

  // Work row tilt on mouse
  document.querySelectorAll("[data-work]").forEach((row) => {
    const preview = row.querySelector(".work-preview");
    if (!preview) return;
    row.addEventListener("pointermove", (e) => {
      const rect = row.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      preview.style.transform = `scale(1) translate(${x * 12}px, ${y * 10}px)`;
    });
    row.addEventListener("pointerleave", () => {
      preview.style.transform = "";
    });
  });

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  const closeNav = () => {
    toggle?.setAttribute("aria-expanded", "false");
    if (mobileNav) mobileNav.hidden = true;
    document.body.style.overflow = "";
    if (loaderDone) lenis?.start();
  };

  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    if (mobileNav) mobileNav.hidden = open;
    document.body.style.overflow = open ? "" : "hidden";
    if (open) {
      if (loaderDone) lenis?.start();
    } else {
      lenis?.stop();
    }
  });

  mobileNav?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));

  // Soft parallax on hero ring (throttled)
  const heroRing = document.querySelector(".hero-ring");
  let ringRaf = 0;
  let ringX = 0;
  let ringY = 0;
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!heroRing) return;
      ringX = (e.clientX / window.innerWidth - 0.5) * 24;
      ringY = (e.clientY / window.innerHeight - 0.5) * 16;
      if (ringRaf) return;
      ringRaf = requestAnimationFrame(() => {
        ringRaf = 0;
        heroRing.style.translate = `${ringX}px ${ringY}px`;
      });
    },
    { passive: true }
  );

  // Full-site + grid; cursor glitch only in the hero section
  const matrixCanvas = document.getElementById("ascii-matrix");
  if (matrixCanvas) {
    createAsciiMatrix(matrixCanvas, {
      interactiveZone: document.querySelector(".hero"),
    });
  }

  // Copy Discord username (no public profile URL without numeric ID)
  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", async (e) => {
      e.preventDefault();
      const text = el.getAttribute("data-copy");
      if (!text) return;
      const label = el.textContent;
      try {
        await navigator.clipboard.writeText(text);
        el.textContent = "Copied!";
      } catch {
        window.prompt("Copy Discord username:", text);
        return;
      }
      window.setTimeout(() => {
        el.textContent = label;
      }, 1400);
    });
  });
})();
