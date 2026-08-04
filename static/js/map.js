(() => {
  "use strict";

  // Минск, ул. Академика Купревича, 1/1 (примерные координаты)
  const CENTER = [53.927172, 27.681810];

  function init() {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;
    if (mapEl.dataset.ready === "1") return;
    if (typeof L === "undefined") return;

    mapEl.dataset.ready = "1";

    const map = L.map("map", {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: true,
      tap: true,
    }).setView(CENTER, 15);

    // НОРМАЛЬНЫЕ тайлы (OSM)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    // Маркер
    const icon = L.divIcon({
      className: "custom-marker",
      html: `
        <div class="marker-pin"></div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    L.marker(CENTER, { icon }).addTo(map);

    // Если карта создаётся в скрытом блоке/при анимации — иногда нужен invalidateSize
    setTimeout(() => map.invalidateSize(true), 120);
  }

  // Авто-инициализация
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // экспорт на всякий
  window.initMap = init;
})();
