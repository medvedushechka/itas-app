(async function () {
  const root = document.getElementById("itas-ticker");
  if (!root) return;

  try {
    const res = await fetch("/api/ticker", { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("ticker fetch failed");

    const data = await res.json();

    const enabled = !!data.is_enabled;
    const perNewsSeconds = Number(data.speed_seconds || 18);
    const items = Array.isArray(data.items) ? data.items : [];

    const texts = items
      .map(x => String(x.text || "").trim())
      .filter(Boolean);

    if (!enabled || texts.length === 0) {
      root.style.display = "none";
      return;
    }

    const track = root.querySelector(".itas-ticker__track");
    const viewport = root.querySelector(".itas-ticker__viewport");
    if (!track || !viewport) return;

    track.innerHTML = "";

    const makeItem = (txt) => {
      const item = document.createElement("div");
      item.className = "itas-ticker__item";
      item.innerHTML = `<span class="itas-ticker__dot"></span><span class="itas-ticker__text"></span>`;
      item.querySelector(".itas-ticker__text").textContent = txt;
      return item;
    };

    // Сколько раз повторять одну новость подряд (чтобы "держалась" на экране)
    // делаем адаптивно от ширины экрана.
    const probe = makeItem(texts[0]);
    probe.style.visibility = "hidden";
    probe.style.position = "absolute";
    probe.style.left = "-99999px";
    root.appendChild(probe);
    const itemW = Math.max(1, probe.getBoundingClientRect().width);
    probe.remove();

    const viewportW = Math.max(320, viewport.getBoundingClientRect().width || root.getBoundingClientRect().width);
    const approxPerScreen = Math.ceil(viewportW / itemW) + 2; // запас
    const repeatEach = Math.max(4, Math.min(12, approxPerScreen)); // Ограничиваем диапазоном от 4 до 12

    // Строим первую половину трека:
    // [Новость1 x N] [Новость2 x N] ... [НовостьK x N]
    for (const txt of texts) {
      for (let i = 0; i < repeatEach; i++) track.appendChild(makeItem(txt));
    }

    // Дублируем весь набор для бесконечного скролла
    const clone = track.cloneNode(true);
    while (clone.firstChild) track.appendChild(clone.firstChild);

    // Длительность: perNewsSeconds * кол-во новостей (как ты хотел — “на 1 новость”)
    const totalDuration = Math.max(6, Math.round(perNewsSeconds * texts.length));
    root.style.setProperty("--ticker-duration", `${totalDuration}s`);

    root.style.display = "";

  } catch (e) {
    root.style.display = "none";
  }
})();
