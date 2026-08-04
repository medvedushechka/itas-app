(function () {
  const modal = document.getElementById("contactModal");
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("contactStatus");
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.dataset.kind = kind || "";
  }

  function openModal() {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("news-modal-open"); // уже используешь для запрета скролла
    setStatus("", "");
    setTimeout(() => modal.querySelector("input,textarea")?.focus(), 0);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("news-modal-open");
    setStatus("", "");
    form?.reset();
  }

  // привяжем к кнопке "Написать в Ассоциацию" (первой в блоке membership)
  document.querySelectorAll(".audience-btn").forEach((btn) => {
    const txt = (btn.textContent || "").toLowerCase();
    if (txt.includes("написать")) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    }
  });

  // закрытие
  modal?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.matches("[data-close]")) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("Отправляем…", "loading");

    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      subject: String(fd.get("subject") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      company: String(fd.get("company") || "").trim(),
    };

    if (!payload.message || payload.message.length < 10) {
      setStatus("Сообщение должно содержать не менее 10 символов.", "error");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus(data.error || `Ошибка: HTTP ${res.status}`, "error");
        return;
      }

      setStatus("Отправлено! Мы ответим вам в ближайшее время.", "ok");
      form.reset();
      setTimeout(closeModal, 900);
    } catch (err) {
      setStatus("Сетевая ошибка. Попробуйте позже.", "error");
    }
  });
})();
