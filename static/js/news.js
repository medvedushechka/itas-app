


function _formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "2-digit" });
  } catch {
    return "";
  }
}

function _mediaHtml(item) {
  const src = item.media_url || window.ITASUtils.localMediaUrl(item.media_file);
  if (!src) return "";

  const type = String(item.media_type || "").toLowerCase();
  if (type === "video") {
    return `
      <div class="news-media">
        <video src="${src}" controls playsinline preload="metadata"></video>
      </div>
    `;
  }

  return `
    <div class="news-media">
      <img src="${src}" alt="${window.ITASUtils.escapeHtml(item.title || "")}" loading="lazy">
    </div>
  `;
}

function _stripToExcerpt(html, maxLen = 160) {
  const div = document.createElement("div");
  div.innerHTML = String(html || "");
  const text = (div.textContent || "").trim().replace(/\s+/g, " ");
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + "…";
}

async function _fetchNews() {
  const res = await fetch("/api/news", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Bad API response");
  return data;
}

function _ensureContainerStructure() {
  const big = document.getElementById("newsBig");
  const grid = document.getElementById("newsGrid");
  if (!big || !grid) return null;
  big.classList.add("news-big");
  grid.classList.add("news-grid");
  return { big, grid };
}

function _renderEmpty(big, grid) {
  big.innerHTML = `
    <div class="news-empty">
      <div class="news-empty__title">Пока нет опубликованных новостей</div>
    </div>
  `;
  grid.innerHTML = "";
}

/* ===== Scroll lock (жёстко фиксируем body) ===== */
let __newsScrollY = 0;

function _lockScroll() {
  __newsScrollY = window.scrollY || 0;

  document.documentElement.classList.add("news-modal-open");
  document.body.classList.add("news-modal-open");

  document.body.style.position = "fixed";
  document.body.style.top = `-${__newsScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function _unlockScroll() {
  document.documentElement.classList.remove("news-modal-open");
  document.body.classList.remove("news-modal-open");

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, __newsScrollY || 0);
}

/* ===== Кастомная модалка (без <dialog>) ===== */
let __overlayEl = null;
let __escHandler = null;

function _closeNewsModal() {
  if (__overlayEl) {
    __overlayEl.remove();
    __overlayEl = null;
  }
  if (__escHandler) {
    window.removeEventListener("keydown", __escHandler);
    __escHandler = null;
  }
  _unlockScroll();
}

function _openNewsModal(item) {

  // Закрываем предыдущую модалку, если она осталась в DOM.
  if (__overlayEl) _closeNewsModal();
  _lockScroll();

  const overlay = document.createElement("div");
  overlay.className = "news-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="news-modal" role="document">
      <button class="news-close" type="button" aria-label="Закрыть">×</button>

      <div class="news-modal__head">
        <div class="news-date">${window.ITASUtils.escapeHtml(_formatDate(item.created_at))}</div>
        <div class="news-modal__title">${window.ITASUtils.escapeHtml(item.title || "")}</div>
      </div>

      <div class="news-modal__media">${_mediaHtml(item)}</div>
      <div class="news-modal__content">${item.content_html || ""}</div>
    </div>
  `;

  document.body.appendChild(overlay);
  __overlayEl = overlay;

  // закрытие по клику на затемнение
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) _closeNewsModal();
  });

  // кнопка закрытия
  overlay.querySelector(".news-close")?.addEventListener("click", _closeNewsModal);

  // ESC
  __escHandler = (e) => {
    if (e.key === "Escape") _closeNewsModal();
  };
  window.addEventListener("keydown", __escHandler, { passive: true });

  // фокус на кнопку закрытия
  setTimeout(() => overlay.querySelector(".news-close")?.focus?.(), 0);
}

function _wireOpens(itemsById) {
  document.querySelectorAll("#newsSection .news-open").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("article");
      const id = card?.getAttribute("data-news-id");
      if (!id) return;
      const item = itemsById.get(String(id));
      if (!item) return;
      _openNewsModal(item);
    });
  });
}

function _renderNews(items) {
  const c = _ensureContainerStructure();
  if (!c) return;

  // IMPORTANT: закрываем модалку при перерендере (чтобы не зависало)
  _closeNewsModal();

  const bigItems = items.filter((x) => String(x.size).toLowerCase() === "big");
  const smallItems = items.filter((x) => String(x.size).toLowerCase() !== "big");

  const topBig = bigItems[0] || null;
  const rest = [
    ...bigItems.slice(1).map((x) => ({ ...x, _asBigCard: true })),
    ...smallItems,
  ];

  if (!topBig && rest.length === 0) {
    _renderEmpty(c.big, c.grid);
    return;
  }

  // map по id для модалки
  const itemsById = new Map();
  items.forEach((x) => itemsById.set(String(x.id), x));

  if (topBig) {
    c.big.innerHTML = `
      <article class="news-hero" data-news-id="${window.ITASUtils.escapeHtml(topBig.id)}">
        ${_mediaHtml(topBig)}
        <div class="news-hero__body">
          <div class="news-date">${window.ITASUtils.escapeHtml(_formatDate(topBig.created_at))}</div>
          <h3 class="news-title">${window.ITASUtils.escapeHtml(topBig.title || "")}</h3>
          <div class="news-excerpt">${window.ITASUtils.escapeHtml(_stripToExcerpt(topBig.content_html, 220))}</div>
          <button class="news-open" type="button">Читать полностью</button>
        </div>
      </article>
    `;
  } else {
    c.big.innerHTML = "";
  }

  c.grid.innerHTML = rest
    .map((n) => {
      const isBig = !!n._asBigCard;
      return `
      <article class="news-card ${isBig ? "news-card--wide" : ""}" data-news-id="${window.ITASUtils.escapeHtml(n.id)}">
        ${_mediaHtml(n)}
        <div class="news-card__body">
          <div class="news-date">${window.ITASUtils.escapeHtml(_formatDate(n.created_at))}</div>
          <h4 class="news-title">${window.ITASUtils.escapeHtml(n.title || "")}</h4>
          <div class="news-excerpt">${window.ITASUtils.escapeHtml(_stripToExcerpt(n.content_html, isBig ? 180 : 130))}</div>
          <button class="news-open" type="button">Читать полностью</button>
        </div>
      </article>
    `;
    })
    .join("");

  _wireOpens(itemsById);
}

window.loadNews = async function loadNews() {
  const c = _ensureContainerStructure();
  if (!c) return;

  try {
    const items = await _fetchNews();
    _renderNews(items);
  } catch (e) {
    c.big.innerHTML = `
      <div class="news-empty">
        <div class="news-empty__title">Ошибка загрузки новостей</div>
        <div class="news-empty__text">${window.ITASUtils.escapeHtml(e?.message || "Проверь /api/news")}</div>
      </div>
    `;
    c.grid.innerHTML = "";
  }
};
