



async function _fetchMembers() {
  try {
    const res = await fetch("/api/members", { cache: "no-store" });
    if (!res.ok) return { ok: false, items: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    if (!Array.isArray(data)) return { ok: false, items: [], error: "Некорректный ответ API" };
    return { ok: true, items: data, error: "" };
  } catch (e) {
    return { ok: false, items: [], error: e?.message || "Сетевая ошибка" };
  }
}

function _setMembersEmpty(text1, text2) {
  const empty = document.getElementById("membersEmpty");
  const grid = document.getElementById("membersGrid");
  if (grid) grid.innerHTML = "";
  if (!empty) return;
  empty.style.display = "block";
  empty.innerHTML = `
    <h3>${window.ITASUtils.escapeHtml(text1)}</h3>
    <p>${window.ITASUtils.escapeHtml(text2)}</p>
  `;
}

function _renderMembers(items) {
  const grid = document.getElementById("membersGrid");
  const empty = document.getElementById("membersEmpty");
  if (!grid) return;

  if (!items || items.length === 0) {
    _setMembersEmpty("Список участников пока пуст", "Добавь членов Ассоциации в админке — и они появятся здесь.");
    return;
  }

  if (empty) empty.style.display = "none";

  const html = items.map((m) => {
    const name = window.ITASUtils.escapeHtml(m.name || "");
    const desc = window.ITASUtils.escapeHtml(m.description || "");
    const logo = m.logo_url || window.ITASUtils.localMediaUrl(m.logo);
    const link = window.ITASUtils.externalHttpUrl(m.url);

    const openTag = link ? `<a class="member-report member-report--link" href="${link}" target="_blank" rel="noopener noreferrer">` : `<article class="member-report">`;
    const closeTag = link ? `</a>` : `</article>`;

    return `
      ${openTag}
        <div class="member-report__top">
          <div class="member-report__label">УЧАСТНИК</div>
          <div class="member-report__name">${name}</div>
        </div>

        <div class="member-report__media">
          ${
            logo
              ? `<img src="${logo}" alt="${name}" loading="lazy">`
              : `<div class="member-report__placeholder">LOGO</div>`
          }
        </div>

        <div class="member-report__bottom">
          <div class="member-report__desc">${desc}</div>
          <div class="member-report__arrow" aria-hidden="true">→</div>
        </div>
      ${closeTag}
    `;
  }).join("");

  grid.innerHTML = html;
}

async function initMembersFromDB() {
  if (!document.getElementById("membersGrid")) return;

  const { ok, items, error } = await _fetchMembers();
  if (!ok) {
    _setMembersEmpty("Не удалось загрузить участников", error || "Проверь сервер и /api/members");
    return;
  }

  _renderMembers(items);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMembersFromDB);
} else {
  initMembersFromDB();
}
