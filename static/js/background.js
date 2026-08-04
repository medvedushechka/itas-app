(() => {
  "use strict";

  const starsRoot = document.querySelector(".stars-container");
  const blobsRoot = document.querySelector(".background-elements");
  if (!starsRoot || !blobsRoot) return;

  // Чистим (на случай двойного запуска)
  starsRoot.innerHTML = "";
  blobsRoot.innerHTML = "";

  // =========================
  // ЗВЁЗДЫ
  // =========================
  const STAR_COUNT = Math.min(90, Math.max(45, Math.floor(window.innerWidth / 22)));

  for (let i = 0; i < STAR_COUNT; i++) {
    const s = document.createElement("div");
    s.className = "star";

    // равномерно по экрану
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    // размер 1..2.6px
    const size = 1 + Math.random() * 1.6;

    // мерцание
    const tw = (4 + Math.random() * 8).toFixed(2) + "s";
    const td = (Math.random() * 6).toFixed(2) + "s";

    s.style.left = x + "vw";
    s.style.top = y + "vh";
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.setProperty("--tw", tw);
    s.style.setProperty("--td", td);

    // чуть разные оттенки (холоднее/теплее)
    const cool = Math.random() < 0.7;
    const a = 0.45 + Math.random() * 0.45;
    s.style.background = cool
      ? `rgba(220,245,255,${a.toFixed(2)})`
      : `rgba(255,235,220,${a.toFixed(2)})`;

    starsRoot.appendChild(s);
  }

  // =========================
  // ФОНОВЫЕ ПЯТНА
  // =========================
  const blue = document.createElement("div");
  blue.className = "blob blob-blue";

  const red = document.createElement("div");
  red.className = "blob blob-red";

  blobsRoot.appendChild(blue);
  blobsRoot.appendChild(red);

  function placeBlobs() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const base = Math.min(w, h);

    // делаем пятна крупнее, чтобы они всегда были видны
    const sz = Math.max(520, Math.min(980, Math.round(base * 0.95)));

    blue.style.width = sz + "px";
    blue.style.height = sz + "px";

    red.style.width = sz + "px";
    red.style.height = sz + "px";

    // СТАВИМ так, чтобы всегда часть была на экране:
    // blue — справа/сверху, red — слева/снизу
    blue.style.left = Math.round(w * 0.55) + "px";
    blue.style.top  = Math.round(h * 0.05) + "px";

    red.style.left = Math.round(w * 0.05) + "px";
    red.style.top  = Math.round(h * 0.55) + "px";
  }

  placeBlobs();
  window.addEventListener("resize", placeBlobs, { passive: true });

  // разные фазы “дыхания”
  blue.style.animationDuration = "12s";
  blue.style.animationDelay = "0s";

  red.style.animationDuration = "14s";
  red.style.animationDelay = "2.3s";
})();
