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

  // Top scroll progress — only after loader (keeps load lines in sync)
  const progressBar = document.querySelector(".scroll-progress i");
  let progressTarget = 0;
  let progressCurrent = 0;
  let progressTicking = false;
  let scrollTracking = false;

  const readProgress = () => {
    if (!scrollTracking || !progressBar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    progressTarget = height > 0 ? scrollTop / height : 0;
    if (!progressTicking) {
      progressTicking = true;
      requestAnimationFrame(smoothProgress);
    }
  };

  const smoothProgress = () => {
    if (!progressBar) return;
    progressCurrent += (progressTarget - progressCurrent) * 0.12;
    if (Math.abs(progressTarget - progressCurrent) < 0.001) {
      progressCurrent = progressTarget;
      progressTicking = false;
    } else {
      requestAnimationFrame(smoothProgress);
    }
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progressCurrent))})`;
  };

  window.addEventListener("scroll", readProgress, { passive: true });
  window.addEventListener("resize", readProgress);

  // Loader then hero entrance — finish when shared lineFill ends (1.6s)
  const finishLoader = () => {
    document.querySelector(".loader")?.classList.add("is-done");
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    /* Hand top line over to scroll tracking from 0 */
    if (progressBar) {
      progressBar.style.animation = "none";
      progressCurrent = 0;
      progressTarget = 0;
      progressBar.style.transform = "scaleX(0)";
    }
    scrollTracking = true;
    readProgress();
  };

  const startLoad = () => setTimeout(finishLoader, 1650);
  window.addEventListener("load", startLoad);
  if (document.readyState === "complete") startLoad();

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

  // Soft parallax on hero ring
  const heroRing = document.querySelector(".hero-ring");
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!heroRing) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      heroRing.style.translate = `${x}px ${y}px`;
    },
    { passive: true }
  );


  // ASCII trail (cool.mp4) — paints where the cursor has been; fades after idle
  (() => {
    const canvases = [...document.querySelectorAll("[data-ascii]")];
    if (!canvases.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const CELL = 14;
    const BRUSH = 1.65; // thin path — not a ring around the cursor
    const IDLE_MS = 10000; // stop & disappear after 10s without move
    const FADE_PER_FRAME = 0.015; // soft dissolve once idle / leaving

    const fields = canvases
      .map((canvas) => {
        const host = canvas.parentElement;
        const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
        if (!host || !ctx) return null;
        const mode = canvas.getAttribute("data-ascii") || "hero";
        const zone = canvas.closest(".hero, #about, .about") || host;
        return {
          canvas,
          host,
          zone,
          ctx,
          mode,
          width: 0,
          height: 0,
          cols: 0,
          rows: 0,
          grid: null,
          hover: false,
          active: false,
          hasInk: false,
          lastCol: -1,
          lastRow: -1,
          lastMove: 0,
          fading: false,
        };
      })
      .filter(Boolean);

    const resetGrid = (field) => {
      field.grid = new Float32Array(field.cols * field.rows);
      field.hasInk = false;
      field.lastCol = -1;
      field.lastRow = -1;
      field.fading = false;
    };

    const clearField = (field) => {
      field.ctx.clearRect(0, 0, field.width || field.canvas.width, field.height || field.canvas.height);
      if (field.grid) field.grid.fill(0);
      field.hasInk = false;
      field.lastCol = -1;
      field.lastRow = -1;
      field.fading = false;
    };

    const resizeField = (field) => {
      const rect = field.canvas.getBoundingClientRect();
      field.width = Math.max(1, Math.round(rect.width) || field.zone.clientWidth || 320);
      field.height = Math.max(1, Math.round(rect.height) || field.zone.clientHeight || 240);
      if (field.canvas.width !== field.width) field.canvas.width = field.width;
      if (field.canvas.height !== field.height) field.canvas.height = field.height;
      field.ctx.setTransform(1, 0, 0, 1, 0, 0);
      field.cols = Math.ceil(field.width / CELL) + 1;
      field.rows = Math.ceil(field.height / CELL) + 1;
      resetGrid(field);
      field.ctx.clearRect(0, 0, field.width, field.height);
    };

    const pointerToCanvas = (field, e) => {
      const rect = field.canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        x: ((e.clientX - rect.left) / rect.width) * field.width,
        y: ((e.clientY - rect.top) / rect.height) * field.height,
      };
    };

    // Soft cool.mp4 dab — only the path cells, not a big surround
    const stamp = (field, px, py) => {
      const col = px / CELL;
      const row = py / CELL;
      const c0 = Math.max(0, Math.floor(col - BRUSH));
      const c1 = Math.min(field.cols - 1, Math.ceil(col + BRUSH));
      const r0 = Math.max(0, Math.floor(row - BRUSH));
      const r1 = Math.min(field.rows - 1, Math.ceil(row + BRUSH));
      const hero = field.mode === "hero";

      for (let r = r0; r <= r1; r += 1) {
        for (let c = c0; c <= c1; c += 1) {
          const dx = c + 0.5 - col;
          const dy = r + 0.5 - row;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > BRUSH) continue;
          const fall = 1 - d / BRUSH;
          let ink = 0.35 + fall * fall * 0.65;

          if (hero) {
            const x = (c + 0.5) * CELL;
            const y = (r + 0.5) * CELL;
            const bx = x / field.width - 0.28;
            const by = y / field.height - 0.48;
            const hole = Math.max(0, 1 - Math.sqrt(bx * bx + by * by) / 0.2);
            ink *= 1 - hole * hole * 0.55;
          }

          const i = r * field.cols + c;
          if (ink > field.grid[i]) {
            field.grid[i] = ink;
            field.hasInk = true;
          }
        }
      }
    };

    const paintPath = (field, x, y) => {
      const col = x / CELL;
      const row = y / CELL;
      if (field.lastCol < 0) {
        stamp(field, x, y);
      } else {
        const dx = col - field.lastCol;
        const dy = row - field.lastRow;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 2.5));
        for (let s = 1; s <= steps; s += 1) {
          const t = s / steps;
          stamp(field, (field.lastCol + dx * t) * CELL, (field.lastRow + dy * t) * CELL);
        }
      }
      field.lastCol = col;
      field.lastRow = row;
      field.lastMove = performance.now();
      field.fading = false;
    };

    const drawField = (field, now) => {
      if (!field.grid) return false;

      // Idle 10s (or left the zone) → soft fade, then disappear
      const idle = !field.hover || !field.active || now - field.lastMove > IDLE_MS;
      if (idle) field.fading = true;

      if (field.fading && field.hasInk) {
        let left = 0;
        for (let i = 0; i < field.grid.length; i += 1) {
          if (field.grid[i] <= 0) continue;
          field.grid[i] -= FADE_PER_FRAME;
          if (field.grid[i] <= 0.02) field.grid[i] = 0;
          else left += 1;
        }
        if (left === 0) {
          clearField(field);
          return false;
        }
      } else if (!field.hasInk) {
        return false;
      }

      const { ctx, width, height, cols, rows, grid } = field;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `500 ${CELL - 3}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let any = false;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const n = grid[r * cols + c];
          if (n < 0.05) continue;
          any = true;

          // cool.mp4 soft ramp — clean, no heavy # %
          let ch;
          if (n < 0.22) ch = ".";
          else if (n < 0.38) ch = ",";
          else if (n < 0.52) ch = ":";
          else if (n < 0.68) ch = ";";
          else if (n < 0.84) ch = "+";
          else ch = "*";

          ctx.fillStyle = `rgba(210, 228, 255, ${0.16 + n * 0.55})`;
          ctx.fillText(ch, c * CELL + CELL * 0.5, r * CELL + CELL * 0.5);
        }
      }

      field.hasInk = any;
      if (!any) {
        clearField(field);
        return false;
      }
      return true;
    };

    let raf = 0;
    const tick = (now) => {
      let living = false;
      for (let i = 0; i < fields.length; i += 1) {
        if (drawField(fields[i], now || performance.now())) living = true;
      }
      raf = living ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const field = fields.find((f) => f.canvas === entry.target);
          if (!field) return;
          field.active = entry.isIntersecting;
          if (!entry.isIntersecting) {
            field.hover = false;
            field.fading = true;
            kick();
          }
        });
      },
      { threshold: 0.05, rootMargin: "40px" }
    );

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        fields.forEach(resizeField);
      }, 100);
    });

    fields.forEach((field) => {
      resizeField(field);
      io.observe(field.canvas);

      field.zone.addEventListener(
        "pointerenter",
        (e) => {
          if (!field.active) return;
          field.hover = true;
          const p = pointerToCanvas(field, e);
          if (p) paintPath(field, p.x, p.y);
          kick();
        },
        { passive: true }
      );

      field.zone.addEventListener(
        "pointerleave",
        () => {
          field.hover = false;
          field.lastCol = -1;
          field.lastRow = -1;
          field.fading = true; // dissolve trail when you leave
          kick();
        },
        { passive: true }
      );

      field.zone.addEventListener(
        "pointermove",
        (e) => {
          if (!field.active) return;
          field.hover = true;
          const p = pointerToCanvas(field, e);
          if (!p) return;
          paintPath(field, p.x, p.y);
          kick();
        },
        { passive: true }
      );
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        fields.forEach((f) => {
          f.hover = false;
          clearField(f);
        });
      }
    });
  })();
})();
