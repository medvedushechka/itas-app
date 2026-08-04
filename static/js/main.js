(() => {
  "use strict";

  const header = document.getElementById("siteHeader") || document.querySelector("header");
  const mainLogo = document.getElementById("mainLogo");
  const fixedLogo = document.getElementById("fixedPlanetsContainer");

  // --- Компактная шапка при прокрутке ---
  const COMPACT_AT = 140; // пикселей
  function updateHeaderMode() {
    if (!header) return;
    const y = window.scrollY || 0;
    header.classList.toggle("header--compact", y > COMPACT_AT);

    if (mainLogo) mainLogo.setAttribute("aria-hidden", y > COMPACT_AT ? "true" : "false");
    if (fixedLogo) fixedLogo.setAttribute("aria-hidden", y > COMPACT_AT ? "false" : "true");
  }

  updateHeaderMode();
  window.addEventListener("scroll", updateHeaderMode, { passive: true });

  // --- Мобильное меню ---
  const btn = document.getElementById("mobileMenuBtn");
  const closeBtn = document.getElementById("mobileCloseBtn");
  const overlay = document.getElementById("mobileMenuOverlay");

  function openMenu() {
    document.body.classList.add("menu-open");
  }
  function closeMenu() {
    document.body.classList.remove("menu-open");
  }

  btn?.addEventListener("click", openMenu);
  closeBtn?.addEventListener("click", closeMenu);
  overlay?.addEventListener("click", closeMenu);

  // --- Плавная прокрутка к секциям ---
  function scrollToHash(hash) {
    const el = document.querySelector(hash);
    if (!el) return;

    const headerH = header ? header.getBoundingClientRect().height : 80;
    const rect = el.getBoundingClientRect();
    const top = (window.scrollY || 0) + rect.top - headerH - 10;

    window.scrollTo({ top, behavior: "smooth" });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const hash = a.getAttribute("href");
    if (!hash || hash === "#") return;

    e.preventDefault();
    closeMenu();

    // если есть showNews и это переход к новостям — открываем новости красиво
    if ((hash === "#news" || hash === "#newsSection") && typeof window.showNews === "function") {
      window.showNews();
      return;
    }

    scrollToHash(hash);
  });

  // =========================
  // ДОБАВЛЕНО БЕЗ index.html:
  // 1) "Новости" -> самый левый
  // 2) CTA кнопка в hero
  // =========================
  function moveNewsLeft() {
    // Компьютерная версия
    const desktopUl = document.querySelector(".desktop-nav ul");
    if (desktopUl) {
      const newsA = desktopUl.querySelector("[data-news-link]");
      const li = newsA?.closest("li");
      if (li) desktopUl.insertBefore(li, desktopUl.firstElementChild);
    }

    // Мобильная версия
    const mobileUl = document.querySelector("#mobileNav ul");
    if (mobileUl) {
      const newsA = mobileUl.querySelector("[data-news-link]");
      const li = newsA?.closest("li");
      if (li) mobileUl.insertBefore(li, mobileUl.firstElementChild);
    }
  }

  function injectHeroCTA() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const stats = hero.querySelector(".hero-stats");
    if (!stats) return;

    // не дублируем
    if (hero.querySelector(".hero-cta-more")) return;

    const wrap = document.createElement("div");
    wrap.className = "hero-cta-more";

    // ВАЖНО: <a href="#news"> — чтобы работал твой smooth scroll и было семантически ок
    wrap.innerHTML = `
      <a class="hero-more-btn itas-cta-about" href="#news" aria-label="Немного подробнее о нас">
        <span class="hero-more-btn__text">Новости</span>
        <span class="hero-more-btn__glow" aria-hidden="true"></span>
      </a>
    `;

    // вставляем после stats
    stats.insertAdjacentElement("afterend", wrap);

    // Резервный вариант на случай, если якоря нет и showNews тоже нет
    const a = wrap.querySelector("a");
    a?.addEventListener("click", () => {
      if (typeof window.showNews === "function") return;

      const newsSection =
        document.getElementById("news") ||
        document.getElementById("newsSection") ||
        document.querySelector(".news") ||
        document.querySelector("[data-news]");

      if (newsSection) {
        // показать, если кто-то скрывает display:none
        if (newsSection.style) newsSection.style.display = "";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      moveNewsLeft();
      injectHeroCTA();
    });
  } else {
    moveNewsLeft();
    injectHeroCTA();
  }
})();
 