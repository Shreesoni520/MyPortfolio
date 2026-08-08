(() => {
  const body = document.body;
  body.classList.add("is-loading");

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

  // Top scroll progress — direct update (no extra animation loop)
  const progressBar = document.querySelector(".scroll-progress i");
  let scrollTracking = false;

  const readProgress = () => {
    if (!scrollTracking || !progressBar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const p = height > 0 ? scrollTop / height : 0;
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
  };

  window.addEventListener("scroll", readProgress, { passive: true });
  window.addEventListener("resize", readProgress);

  // Loader then hero entrance — finish when shared lineFill ends (1.6s)
  let loaderDone = false;
  const unlockScroll = () => {
    body.classList.remove("is-loading");
    body.style.overflow = "";
    document.documentElement.style.overflow = "";
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
    el.style.setProperty("--delay", `${(i % 5) * 120}ms`);
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

  // Slightly softer anchor scrolling feel
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
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
  };

  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    if (mobileNav) mobileNav.hidden = open;
    document.body.style.overflow = open ? "" : "hidden";
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

  // Hero ASCII field — ascii-motion style ambient grid + soft cursor bloom
  (() => {
    const canvas = document.querySelector('[data-ascii="hero"]');
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const RAMP = " .:-+*=%#";
    const IDLE_MS = 10000;
    const FRAME_MS = 1000 / 22; // calm fps — stays smooth
    const MAX_CELLS = 1600;
    const zone = canvas.closest(".hero") || canvas.parentElement;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!zone || !ctx) return;

    const hash = (x, y) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    const noise = (x, y) => {
      const xi = x | 0;
      const yi = y | 0;
      const xf = x - xi;
      const yf = y - yi;
      const u = xf * xf * (3 - 2 * xf);
      const v = yf * yf * (3 - 2 * yf);
      const a = hash(xi, yi);
      const b = hash(xi + 1, yi);
      const c = hash(xi, yi + 1);
      const d = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let cell = 20;
    let mx = 0.55;
    let my = 0.42;
    let tx = 0.55;
    let ty = 0.42;
    let hover = false;
    let spot = 0; // cursor bloom strength
    let active = true;
    let raf = 0;
    let lastDraw = 0;
    let lastMove = 0;
    let t0 = performance.now();
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    const resize = () => {
      const rect = zone.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width) || 320);
      height = Math.max(1, Math.round(rect.height) || 240);
      cell = width * height > 1_200_000 ? 22 : 18;
      cols = Math.ceil(width / cell) + 1;
      rows = Math.ceil(height / cell) + 1;
      while (cols * rows > MAX_CELLS && cell < 28) {
        cell += 1;
        cols = Math.ceil(width / cell) + 1;
        rows = Math.ceil(height / cell) + 1;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const draw = (now) => {
      raf = 0;
      if (!active) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      if (now - lastDraw < FRAME_MS) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;

      const idle = hover && now - lastMove > IDLE_MS;
      const wantSpot = hover && !idle && !coarse;
      spot += ((wantSpot ? 1 : 0) - spot) * (wantSpot ? 0.14 : 0.06);
      mx += (tx - mx) * (wantSpot ? 0.12 : 0.03);
      my += (ty - my) * (wantSpot ? 0.12 : 0.03);

      const t = (now - t0) * 0.001;
      const px = mx * width;
      const py = my * height;
      const spotR = Math.min(width, height) * 0.26;
      const spotR2 = spotR * spotR;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `500 ${Math.max(10, cell - 5)}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#b9d4f5";

      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          // Skip every other cell on the faintest layer for cheap fill
          const x = c * cell + cell * 0.5;
          const y = r * cell + cell * 0.5;

          // Slow flowing ambient field (ascii-motion vibe)
          const flow = noise(c * 0.07 + t * 0.11, r * 0.06 - t * 0.08);
          let n = 0.1 + flow * 0.28;

          // Soft drifting clouds
          n += noise(c * 0.03 - t * 0.04, r * 0.035 + t * 0.03) * 0.18;

          if (spot > 0.02) {
            const dx = x - px;
            const dy = y - py;
            const d2 = dx * dx * 0.9 + dy * dy * 1.15;
            if (d2 < spotR2) {
              const fall = 1 - Math.sqrt(d2) / spotR;
              n += fall * fall * 0.7 * spot;
            }
          }

          // Keep big "Shree" readable
          const bx = x / width - 0.28;
          const by = y / height - 0.48;
          const hole = Math.max(0, 1 - Math.sqrt(bx * bx + by * by) / 0.26);
          n *= 1 - hole * hole * 0.7;

          if (n < 0.12) {
            // ultra-faint dot grid (like ascii-motion)
            if (((c + r) & 3) !== 0) continue;
            ctx.globalAlpha = 0.05;
            ctx.fillText(".", x, y);
            continue;
          }

          if (n < 0.2 && ((c + r) & 1) === 1) continue;

          const idx = Math.min(RAMP.length - 1, (n * (RAMP.length - 0.001)) | 0);
          const ch = RAMP[idx];
          if (ch === " ") continue;
          ctx.globalAlpha = 0.08 + n * 0.42;
          ctx.fillText(ch, x, y);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (!raf && active) raf = requestAnimationFrame(draw);
    };

    const toNorm = (e) => {
      const rect = zone.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      };
    };

    resize();
    mx = tx;
    my = ty;

    const io = new IntersectionObserver(
      ([entry]) => {
        active = !!entry?.isIntersecting;
        if (active) {
          t0 = performance.now() - 1000;
          kick();
        } else {
          cancelAnimationFrame(raf);
          raf = 0;
          ctx.clearRect(0, 0, width, height);
        }
      },
      { threshold: 0.08 }
    );
    io.observe(zone);

    let resizeTimer = 0;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resize();
          kick();
        }, 150);
      },
      { passive: true }
    );

    if (!coarse) {
      zone.addEventListener(
        "pointerenter",
        (e) => {
          hover = true;
          lastMove = performance.now();
          const p = toNorm(e);
          if (p) {
            tx = p.x;
            ty = p.y;
          }
          kick();
        },
        { passive: true }
      );
      zone.addEventListener(
        "pointermove",
        (e) => {
          hover = true;
          lastMove = performance.now();
          const p = toNorm(e);
          if (!p) return;
          tx = p.x;
          ty = p.y;
          kick();
        },
        { passive: true }
      );
      zone.addEventListener(
        "pointerleave",
        () => {
          hover = false;
          kick();
        },
        { passive: true }
      );
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        ctx.clearRect(0, 0, width, height);
      } else if (active) {
        kick();
      }
    });

    kick();
  })();
})();
