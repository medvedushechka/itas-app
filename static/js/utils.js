// Общие функции фронтенда без создания лишних глобальных переменных.
(() => {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function localMediaUrl(path) {
    if (!path) return "";
    const normalized = String(path).replace(/\\/g, "/").replace(/^\/+/, "");
    return `/${normalized}`;
  }

  function externalHttpUrl(url) {
    const value = String(url || "").trim();
    return /^https?:\/\//i.test(value) ? value : "";
  }

  window.ITASUtils = Object.freeze({ escapeHtml, localMediaUrl, externalHttpUrl });
})();
