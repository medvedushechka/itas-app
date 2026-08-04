
function _guessMediaKind(url) {
  const u = String(url || "").toLowerCase();
  if (u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg")) return "video";
  // gif считаем как image (браузер сам проиграет)
  return "image";
}


async function _loadHeroSlidesFromAPI() {
  try {
    const res = await fetch("/api/carousel", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    // ожидаем [{media_file, title, position}, ...]
    return data
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.id ?? 0) - (b.id ?? 0));
  } catch {
    return [];
  }
}

function _renderHeroSlider(sliderEl, items) {
  if (!sliderEl) return false;

  // В index.html у тебя уже есть структура:
  // <div id="heroSlider" class="hero-slider">
  //   <div class="slide active">...</div>...
  //   <div class="slider-dots">...</div>
  // </div>

  const dotsWrap = sliderEl.querySelector(".slider-dots") || (() => {
    const d = document.createElement("div");
    d.className = "slider-dots";
    sliderEl.appendChild(d);
    return d;
  })();

  if (!items || items.length === 0) {
    // Если в БД пусто — оставляем твои хардкодные слайды как есть
    return false;
  }

  // чистим существующие слайды, но оставим dotsWrap
  Array.from(sliderEl.querySelectorAll(".slide")).forEach((s) => s.remove());
  dotsWrap.innerHTML = "";

  items.forEach((it, idx) => {
    const src = it.media_url || window.ITASUtils.localMediaUrl(it.media_file);
    const kind = _guessMediaKind(src);

    const slide = document.createElement("div");
    slide.className = "slide" + (idx === 0 ? " active" : "");

    if (kind === "video") {
      const v = document.createElement("video");
      v.className = "hero-image";
      v.src = src;
      v.autoplay = true;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      slide.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.className = "hero-image";
      img.src = src;
      img.alt = it.title ? String(it.title) : `Hero slide ${idx + 1}`;
      slide.appendChild(img);
    }

    // вставляем слайды ДО dotsWrap
    sliderEl.insertBefore(slide, dotsWrap);

    const dot = document.createElement("span");
    dot.className = "dot" + (idx === 0 ? " active" : "");
    dot.dataset.slide = String(idx);
    dotsWrap.appendChild(dot);
  });

  return true;
}

window.initHeroSlider = async function initHeroSlider() {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  // 1) подгружаем из БД и рендерим (если есть)
  const items = await _loadHeroSlidesFromAPI();
  _renderHeroSlider(slider, items);

  // 2) дальше — твой обычный слайдер
  const slides = slider.querySelectorAll(".slide");
  const dots = slider.querySelectorAll(".dot");
  if (!slides.length || !dots.length) return;

  let currentSlide = 0;
  let timer = null;

  function showSlide(index) {
    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    currentSlide = index;
  }

  function nextSlide() {
    showSlide((currentSlide + 1) % slides.length);
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(nextSlide, 6000);
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const idx = Number(dot.dataset.slide || 0);
      showSlide(idx);
      startAuto();
    });
  });

  // Старт
  showSlide(0);
  startAuto();

  // На всякий: если вкладка неактивна — не жрём CPU
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });
};

// Авто-инициализация.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.initHeroSlider && window.initHeroSlider());
} else {
  window.initHeroSlider && window.initHeroSlider();
}
