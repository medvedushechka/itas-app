
async function _loadCommittees() {
  try {
    const res = await fetch("/api/committees", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.id ?? 0) - (b.id ?? 0));
  } catch {
    return [];
  }
}

function _renderCommitteesIntoCarousel(items) {
  const carousel = document.querySelector(".topics-carousel");
  if (!carousel || !items?.length) return false;

  carousel.innerHTML = items.map((c, idx) => {
    const n = String(idx + 1).padStart(2, "0");
    const title = window.ITASUtils.escapeHtml(c.title || "");
    const tag = window.ITASUtils.escapeHtml(c.tag || "");
    const bullets = String(c.bullets || "")
      .split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 8)
      .map((b) => `<li>${window.ITASUtils.escapeHtml(b)}</li>`).join("");

    return `<div class="topic-card"><div class="topic-number">${n}</div><h3>${title}</h3><ul>${bullets}</ul><div class="topic-tag">${tag}</div><div class="circles-container"></div></div>`;
  }).join("");
  return true;
}

window.initTopicsCarousel = async function () {
  const container = document.querySelector(".topics-carousel-container");
  const carousel = document.querySelector(".topics-carousel");
  if (!container || !carousel) return;

  const committees = await _loadCommittees();
  if (!_renderCommitteesIntoCarousel(committees)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.innerWidth <= 768 || reducedMotion) {
    container.style.overflowX = "auto";
    carousel.style.transform = "none";
    return;
  }

  const original = carousel.innerHTML;
  carousel.innerHTML = original + original;
  carousel.style.willChange = "transform";

  let halfWidth = 0;
  let offset = 0;
  let frame = 0;
  let previous = 0;
  let visible = false;
  let paused = false;
  const pixelsPerSecond = 42;

  function recalc() {
    halfWidth = carousel.scrollWidth / 2;
    if (!Number.isFinite(halfWidth) || halfWidth <= 0) halfWidth = 0;
    if (halfWidth) offset %= halfWidth;
  }

  function animate(now) {
    frame = 0;
    if (!visible || paused || document.hidden || !halfWidth) return;
    if (!previous) previous = now;
    const dt = Math.min(50, now - previous);
    previous = now;
    offset = (offset + pixelsPerSecond * dt / 1000) % halfWidth;
    carousel.style.transform = `translate3d(${-offset}px, 0, 0)`;
    frame = requestAnimationFrame(animate);
  }

  function start() {
    if (frame || !visible || paused || document.hidden) return;
    previous = 0;
    frame = requestAnimationFrame(animate);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  }

  recalc();
  window.addEventListener("load", recalc, { once: true });
  window.addEventListener("resize", recalc, { passive: true });
  container.addEventListener("mouseenter", () => { paused = true; stop(); });
  container.addEventListener("mouseleave", () => { paused = false; start(); });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());

  new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    visible ? start() : stop();
  }, { threshold: 0.08 }).observe(container);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.initTopicsCarousel?.());
} else {
  window.initTopicsCarousel?.();
}
