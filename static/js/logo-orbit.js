// Орбита слов вокруг "солнца" в лого. Горизонтальный “планетный” эффект:
// слева/справа + за солнце/вперёд через scale/opacity/z-index.
// В RAF ничего не измеряем.

(() => {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cfg = {
    // Увеличили радиус в 1.5 раза
    radiusMultiplier: 1.5,

    // База радиуса (под ширину блока)
    rxMin: 44,
    rxMax: 66,

    // “Горизонт” (наклон по Y)
    tiltYMin: 2,
    tiltYMax: 8,

    // Перспектива
    scaleMin: 0.74,
    scaleMax: 1.10,
    opacityMin: 0.35,
    opacityMax: 1.0,

    // Скорость
    speed: 0.80,

    // Палитра (синий↔красный, ближе к твоей)
    palette: [
      "#00aaff",
      "#3aa8ff",
      "#6aa2ff",
      "#8e8bff",
      "#b26cff",
      "#d34cff",
      "#ff3366",
      "#ff4a7a",
    ],
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixRgb(c1, c2, t) {
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * t),
      g: Math.round(c1.g + (c2.g - c1.g) * t),
      b: Math.round(c1.b + (c2.b - c1.b) * t),
    };
  }

  function rgbToCss({ r, g, b }, a = 1) {
    return `rgba(${r},${g},${b},${a})`;
  }

  function pickPaletteColor(i, n) {
    if (n <= 1) return cfg.palette[0];
    const t = i / (n - 1);
    const seg = t * (cfg.palette.length - 1);
    const idx = Math.floor(seg);
    const frac = seg - idx;
    const c1 = hexToRgb(cfg.palette[idx]);
    const c2 = hexToRgb(cfg.palette[Math.min(idx + 1, cfg.palette.length - 1)]);
    const m = mixRgb(c1, c2, frac);
    return rgbToCss(m, 0.96);
  }

  function initOrbit(root) {
    const logoContainer = root.querySelector(".logo-container");
    const planets = root.querySelector(".planets-container");
    const items = Array.from(root.querySelectorAll(".logo-text"));

    if (!logoContainer || !planets || items.length === 0) return;

    root.style.overflow = "visible";
    logoContainer.style.overflow = "visible";
    planets.style.overflow = "visible";

    let sizes = new Map(); // элемент -> { ширина, высота }
    let rx = 56;
    let tiltY = 6;

    // Проставим БАЗОВЫЕ цвета один раз (стабильно, не мигать)
    const n = items.length;
    items.forEach((el, i) => {
      el.dataset.baseColor = pickPaletteColor(i, n);
      el.style.color = el.dataset.baseColor;
    });

    let angle = 0;
    let lastTs = performance.now();
    let running = true;
    let visible = true;
    let lastPaint = 0;

    function measure() {
      const rect = root.getBoundingClientRect();
      const w = Math.max(rect.width, 1);

      const baseRx = clamp(Math.round(w * 0.34), cfg.rxMin, cfg.rxMax);
      rx = Math.round(baseRx * cfg.radiusMultiplier); // Увеличиваем радиус в полтора раза
      tiltY = clamp(Math.round(w * 0.06), cfg.tiltYMin, cfg.tiltYMax);

      sizes.clear();
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        sizes.set(el, { w: r.width || 28, h: r.height || 14 });
      });
    }

    function tick(ts) {
      if (!running) return;
      if (!visible || document.hidden) {
        lastTs = ts;
        requestAnimationFrame(tick);
        return;
      }
      if (ts - lastPaint < 33) {
        requestAnimationFrame(tick);
        return;
      }
      lastPaint = ts;

      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      angle -= dt * cfg.speed;

      const step = (Math.PI * 2) / n;

      for (let i = 0; i < n; i++) {
        const el = items[i];
        const a = angle + i * step;

        const x = Math.cos(a) * rx;

        // глубина: впереди/сзади
        const depth = Math.sin(a);     // Диапазон от -1 до 1
        const k = (depth + 1) * 0.5;   // Диапазон от 0 до 1

        const y = -depth * tiltY;

        const scale = cfg.scaleMin + k * (cfg.scaleMax - cfg.scaleMin);
        const opacity = cfg.opacityMin + k * (cfg.opacityMax - cfg.opacityMin);

        el.style.zIndex = String(1 + Math.round(k * 30));

        const s = sizes.get(el) || { w: 28, h: 14 };
        const halfW = s.w * 0.5;
        const halfH = s.h * 0.5;

        el.style.transform =
          `translate3d(${Math.round(x - halfW)}px, ${Math.round(y - halfH)}px, 0)` +
          ` scale(${scale.toFixed(3)})`;

        el.style.opacity = opacity.toFixed(3);

        // Мягкий glow без blur-фильтров (не мылит):
        // чуть сильнее, когда “впереди”
        const base = el.dataset.baseColor || "rgba(0,170,255,0.96)";
        // вытащим rgb из rgba(...) / fallback
        // просто делаем text-shadow с прозрачностью от k
        const glowA = (0.08 + k * 0.22).toFixed(3);
        el.style.textShadow = `0 0 ${Math.round(6 + k * 10)}px rgba(0,170,255,${glowA}), 0 0 ${Math.round(
          10 + k * 14
        )}px rgba(255,51,102,${(0.04 + k * 0.14).toFixed(3)})`;

        // Никаких filter: drop-shadow() — он и даёт мыло на движении.
        el.style.filter = "none";
      }

      requestAnimationFrame(tick);
    }

    measure();
    if (!prefersReduced) requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => measure());
    ro.observe(root);

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    }, { threshold: 0.01 });
    io.observe(root);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }

    return {
      stop() { running = false; },
      start() {
        if (running) return;
        running = true;
        lastTs = performance.now();
        requestAnimationFrame(tick);
      },
      measure,
    };
  }

  function boot() {
    document.querySelectorAll(".logo-wrapper").forEach(initOrbit);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
