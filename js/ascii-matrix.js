/**
 * Full-screen ASCII grid with a thin cursor motion trail (snake path).
 * Baseline + stays site-wide; trail only activates inside interactiveZone.
 */
export function createAsciiMatrix(canvas, options = {}) {
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) return null;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (reduceMotion || coarse) {
    canvas.hidden = true;
    return null;
  }

  const CELL = options.cell ?? 9;
  const BASE = options.base ?? "+";
  const GLYPHS = options.glyphs ?? "%&$*#!?+*#";
  const TRAIL_W = options.trailWidth ?? 7; // thin path half-width (px)
  const PATH_STEP = options.pathStep ?? 3;
  const FADE_MS = options.fadeMs ?? 700;
  const FLICKER_MS = options.flickerMs ?? 70;
  const IDLE_MS = options.idleMs ?? 2800;
  const BASE_ALPHA = options.baseAlpha ?? 0.22;
  const BASE_COLOR = options.baseColor ?? "#7a828c";
  const HOT_COLOR = options.hotColor ?? "#f5f7fa";
  const FAR_SCALE = options.farScale ?? 0.55;
  const NEAR_SCALE = options.nearScale ?? 1.05;
  const Y_POW = options.yPow ?? 0.85;
  const zone =
    options.interactiveZone instanceof Element
      ? options.interactiveZone
      : typeof options.interactiveZone === "string"
        ? document.querySelector(options.interactiveZone)
        : null;

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;

  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let dpr = 1;

  /** @type {Float32Array | null} */
  let energy = null;
  /** @type {Uint8Array | null} */
  let glyphIdx = null;
  /** @type {Float32Array | null} */
  let nextFlicker = null;
  /** @type {Float32Array | null} */
  let posX = null;
  /** @type {Float32Array | null} */
  let posY = null;
  /** @type {Float32Array | null} */
  let scaleAt = null;
  /** @type {Set<number>} */
  const active = new Set();

  let baseLayer = null;
  let hasPointer = false;
  let lastMove = 0;
  let prevX = null;
  let prevY = null;
  let raf = 0;
  let last = 0;
  let running = false;

  const randGlyph = () => (Math.random() * GLYPHS.length) | 0;

  const rowT = (r) => {
    const t = rows <= 1 ? 1 : r / (rows - 1);
    return Math.pow(t, Y_POW);
  };

  const rebuildLayout = () => {
    const n = cols * rows;
    posX = new Float32Array(n);
    posY = new Float32Array(n);
    scaleAt = new Float32Array(n);

    for (let r = 0; r < rows; r += 1) {
      const te = rowT(r);
      const scale = FAR_SCALE + (NEAR_SCALE - FAR_SCALE) * te;
      const y = height * (0.02 + 0.96 * te);
      for (let c = 0; c < cols; c += 1) {
        const i = r * cols + c;
        posX[i] = width * 0.5 + (c - (cols - 1) * 0.5) * CELL * scale;
        posY[i] = y;
        scaleAt[i] = scale;
      }
    }
  };

  const rebuildBase = () => {
    baseLayer = document.createElement("canvas");
    baseLayer.width = Math.round(width * dpr);
    baseLayer.height = Math.round(height * dpr);
    const b = baseLayer.getContext("2d");
    if (!b || !posX || !posY || !scaleAt) return;
    b.imageSmoothingEnabled = false;
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.clearRect(0, 0, width, height);
    b.textAlign = "center";
    b.textBaseline = "middle";
    b.fillStyle = BASE_COLOR;
    b.globalAlpha = BASE_ALPHA;

    for (let i = 0; i < cols * rows; i += 1) {
      const fs = Math.max(7, Math.round((CELL - 1) * scaleAt[i]));
      b.font = `500 ${fs}px "IBM Plex Mono", ui-monospace, monospace`;
      b.fillText(BASE, Math.round(posX[i]), Math.round(posY[i]));
    }
    b.globalAlpha = 1;
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);

    cols = Math.ceil(width / (CELL * FAR_SCALE)) + 8;
    rows = Math.ceil(height / (CELL * 0.75)) + 6;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    energy = new Float32Array(cols * rows);
    glyphIdx = new Uint8Array(cols * rows);
    nextFlicker = new Float32Array(cols * rows);
    active.clear();
    prevX = null;
    prevY = null;
    rebuildLayout();
    rebuildBase();
  };

  const touchCell = (i, boost, now) => {
    if (!energy || !glyphIdx || !nextFlicker) return;
    if (boost <= energy[i]) return;
    energy[i] = boost;
    glyphIdx[i] = randGlyph();
    nextFlicker[i] = now + FLICKER_MS * (0.7 + Math.random() * 0.6);
    active.add(i);
  };

  /** Activate only cells along the path (thin trail), not a spotlight disk */
  const stampPoint = (mx, my, now) => {
    if (!energy || !posX || !posY) return;
    const r2 = TRAIL_W * TRAIL_W;

    for (let r = 0; r < rows; r += 1) {
      const i0 = r * cols;
      const y = posY[i0];
      if (Math.abs(y - my) > TRAIL_W * 1.4) continue;

      for (let c = 0; c < cols; c += 1) {
        const i = i0 + c;
        const dx = posX[i] - mx;
        const dy = posY[i] - my;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        // Flat-ish energy on the path so it reads as a line, not a blob
        const fall = 1 - Math.sqrt(d2) / TRAIL_W;
        touchCell(i, 0.75 + fall * 0.25, now);
      }
    }
  };

  const stampSegment = (x0, y0, x1, y1) => {
    const now = performance.now();
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / PATH_STEP));
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      stampPoint(x0 + dx * t, y0 + dy * t, now);
    }
  };

  const draw = (now) => {
    raf = 0;
    if (!running || !energy || !glyphIdx || !nextFlicker || !baseLayer || !posX || !posY || !scaleAt) {
      return;
    }

    const idle = now - lastMove > IDLE_MS;
    if (idle) hasPointer = false;

    const dt = last ? Math.min(48, now - last) : 16;
    last = now;
    const decay = dt / FADE_MS;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(baseLayer, 0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // No shadowBlur — keeps glyphs crisp
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    if (active.size) {
      const dead = [];
      for (const i of active) {
        // Faster decay once idle so trail clears a few seconds after stop
        const idleBoost = idle ? 1.8 : 1;
        let e = energy[i] - decay * idleBoost * (0.6 + (1 - energy[i]) * 0.55);
        if (e <= 0.02) {
          energy[i] = 0;
          dead.push(i);
          continue;
        }
        energy[i] = e;

        if (!idle && e > 0.15 && now >= nextFlicker[i]) {
          glyphIdx[i] = randGlyph();
          nextFlicker[i] = now + FLICKER_MS * (0.65 + Math.random() * 0.7);
        }

        const fs = Math.max(7, Math.round((CELL - 1) * scaleAt[i]));
        const ch = e > 0.1 ? GLYPHS[glyphIdx[i]] : BASE;

        ctx.font = `500 ${fs}px "IBM Plex Mono", ui-monospace, monospace`;
        ctx.globalAlpha = 0.35 + e * 0.65;
        ctx.fillStyle = HOT_COLOR;
        ctx.fillText(ch, Math.round(posX[i]), Math.round(posY[i]));
      }
      for (const i of dead) active.delete(i);
    }

    ctx.globalAlpha = 1;

    // Keep animating while trail lives; stop a few seconds after idle when fully faded
    if ((!idle && hasPointer) || active.size) {
      raf = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(baseLayer, 0, 0, width, height);
      last = 0;
      prevX = null;
      prevY = null;
    }
  };

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  const inZone = (clientX, clientY) => {
    if (!zone) return true;
    const rect = zone.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  const onMove = (e) => {
    if (!inZone(e.clientX, e.clientY)) {
      if (hasPointer) {
        hasPointer = false;
        prevX = null;
        prevY = null;
        kick();
      }
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    hasPointer = true;
    lastMove = performance.now();

    if (prevX == null || prevY == null) {
      stampPoint(x, y, lastMove);
    } else {
      stampSegment(prevX, prevY, x, y);
    }
    prevX = x;
    prevY = y;
    kick();
  };

  const onLeave = () => {
    hasPointer = false;
    prevX = null;
    prevY = null;
    kick();
  };

  const onScroll = () => {
    if (!hasPointer) return;
    hasPointer = false;
    prevX = null;
    prevY = null;
    kick();
  };

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      kick();
    }, 120);
  };

  const onVis = () => {
    if (document.hidden) {
      hasPointer = false;
      prevX = null;
      prevY = null;
      active.clear();
      if (energy) energy.fill(0);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (baseLayer) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(baseLayer, 0, 0, width, height);
      }
    }
  };

  resize();
  running = true;
  ctx.clearRect(0, 0, width, height);
  if (baseLayer) ctx.drawImage(baseLayer, 0, 0, width, height);

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("blur", onLeave);
  document.addEventListener("mouseleave", onLeave);
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVis);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      active.clear();
    },
    resize,
  };
}
