(() => {
  "use strict";

  function ensureStylesOnce() {
    if (document.getElementById("stars-style")) return;
    const style = document.createElement("style");
    style.id = "stars-style";
    style.textContent = `
      #starsCanvas{
        position:fixed;inset:0;
        z-index:-2;
        width:100vw;height:100vh;
        pointer-events:none;
      }
    `;
    document.head.appendChild(style);
  }

  function setupCanvas(id) {
    let canvas = document.getElementById(id);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = id;
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d", { alpha: true });
    return { canvas, ctx };
  }

  function fit(canvas) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { w, h, dpr };
  }

  function makeStars(count, w, h, sizeMin, sizeMax, alphaMin, alphaMax, speedMin, speedMax) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: sizeMin + Math.random() * (sizeMax - sizeMin),
        a: alphaMin + Math.random() * (alphaMax - alphaMin),
        tw: 0.5 + Math.random() * 1.5,
        sp: speedMin + Math.random() * (speedMax - speedMin),
      });
    }
    return stars;
  }

  window.initStars = function initStars() {
    ensureStylesOnce();

    const { canvas, ctx } = setupCanvas("starsCanvas");
    if (!ctx) return;

    let layer1 = [];
    let layer2 = [];
    let layer3 = [];

    function rebuild() {
      const { w, h } = fit(canvas);

      // плотность можно подкрутить
      const area = (w * h) / (1200 * 800); // нормализация под условный 1200x800
      layer1 = makeStars(Math.floor(140 * area), w, h, 0.7, 1.2, 0.15, 0.45, 0.02, 0.05);
      layer2 = makeStars(Math.floor(90 * area), w, h, 1.0, 1.8, 0.20, 0.60, 0.05, 0.10);
      layer3 = makeStars(Math.floor(55 * area), w, h, 1.4, 2.6, 0.25, 0.75, 0.10, 0.18);
    }

    function drawLayer(stars, w, h, t) {
      for (const s of stars) {
        // лёгкое движение вниз/вбок (параллакс ощущение)
        s.y += s.sp;
        if (s.y > h + 10) {
          s.y = -10;
          s.x = Math.random() * w;
        }

        const twinkle = 0.5 + 0.5 * Math.sin(t * s.tw + s.x * 0.001);
        const a = Math.min(1, Math.max(0, s.a * (0.65 + 0.7 * twinkle)));

        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(now) {
      const { w, h } = fit(canvas);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";

      const t = now * 0.001;

      // рисуем от дальних к ближним
      ctx.globalCompositeOperation = "source-over";
      drawLayer(layer1, w, h, t);
      drawLayer(layer2, w, h, t);
      drawLayer(layer3, w, h, t);

      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", rebuild, { passive: true });
    rebuild();
    requestAnimationFrame(loop);
  };
})();
