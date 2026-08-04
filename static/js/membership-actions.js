(function () {
  // Куда реально отправляется письмо — задаётся на сервере через .env (CONTACT_TO).
  // Тут ничего не отправляем через mailto — только открываем модалку.
  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function openModal({ title, subtitle, subject, message }) {
    const modal = qs("#contactModal");
    if (!modal) return;

    const form = qs("#contactForm", modal);
    if (!form) return;

    // Заголовки (если есть)
    const titleEl = qs("#contactTitle", modal);
    if (titleEl && title) titleEl.textContent = title;

    const subEl = qs(".contact-modal__subtitle", modal);
    if (subEl && subtitle) subEl.textContent = subtitle;

    // Поля
    const subjEl = qs('input[name="subject"]', form);
    const msgEl = qs('textarea[name="message"]', form);

    if (subjEl) subjEl.value = subject || "";
    if (msgEl) msgEl.value = message || "";

    // Статус
    const status = qs("#contactStatus", modal);
    if (status) status.textContent = "";

    // Открыть
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    // Фокус
    setTimeout(() => {
      (qs('input[name="name"]', form) || qs('input[name="email"]', form) || msgEl || subjEl)?.focus();
    }, 0);
  }

  function bindButtons() {
    const section = document.getElementById("membership");
    if (!section) return;

    section.querySelectorAll(".audience-btn").forEach((btn) => {
      btn.addEventListener(
        "click",
        (e) => {
          // Полностью гасим любые старые mailto-обработчики
          e.preventDefault();
          e.stopImmediatePropagation();

          const text = (btn.textContent || "").trim().toLowerCase();

          if (text.includes("написать")) {
            openModal({
              title: "Написать в Ассоциацию",
              subtitle: "Общий вопрос / обращение",
              subject: "Написать в Ассоциацию",
              message: "Здравствуйте! Хочу уточнить…",
            });
            return;
          }

          if (text.includes("вступить")) {
            openModal({
              title: "Вступить",
              subtitle: "Заявка на вступление",
              subject: "Заявка на вступление",
              message:
                "Здравствуйте! Хотим вступить в Ассоциацию.\n\nКомпания:\nСайт:\nКонтактное лицо:\nТелефон:\nКоротко о деятельности:",
            });
            return;
          }

          if (text.includes("условия") || text.includes("запросить")) {
            openModal({
              title: "Запросить условия",
              subtitle: "Взносы / требования / процедура",
              subject: "Запрос условий членства",
              message:
                "Здравствуйте! Прошу направить условия членства (взносы, требования, порядок вступления).",
            });
            return;
          }

          // Резервный вариант
          openModal({
            title: "Написать в Ассоциацию",
            subtitle: "Общий вопрос / обращение",
            subject: "Обращение",
            message: "",
          });
        },
        true // capture, чтобы перехватить раньше других слушателей
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindButtons);
  } else {
    bindButtons();
  }
})();
