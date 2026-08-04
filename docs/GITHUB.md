# Публикация в GitHub

## Проверка перед коммитом

Убедитесь, что в корне проекта отсутствуют:

- `.env`;
- `app.db`;
- резервные копии базы;
- рабочие файлы из `static/uploads`;
- логи;
- виртуальное окружение `.venv`.

Проверьте состояние:

```powershell
git status --short
```

Проверить, что секретный файл игнорируется:

```powershell
git check-ignore -v .env
```

## Первичная публикация

```powershell
git init
git branch -M main
git add .
git status
git commit -m "Подготовить рабочую версию сайта ассоциации"
git remote add origin https://github.com/medvedushechka/itas-app.git
git push -u origin main
```

Если удалённый репозиторий уже содержит старую версию, безопаснее сначала сохранить её в отдельной ветке либо клонировать репозиторий и заменить файлы в существующей рабочей копии. Не используйте принудительный push без проверки истории.

## Рекомендуемый вариант для существующего репозитория

```powershell
git clone https://github.com/medvedushechka/itas-app.git
cd itas-app
git switch -c rebuild/flask-cms
```

После этого замените содержимое рабочей копии файлами новой версии, затем:

```powershell
git add -A
git status
git commit -m "Переработать сайт в управляемое Flask-приложение"
git push -u origin rebuild/flask-cms
```

Далее создайте pull request в `main`. Это сохранит старую версию в истории и позволит проверить итоговый diff перед объединением.

## После публикации

В настройках репозитория рекомендуется указать:

- описание: `Корпоративный сайт ассоциации на Flask с административной панелью`;
- topics: `python`, `flask`, `sqlalchemy`, `flask-admin`, `sqlite`, `cms`;
- сайт проекта, если доступен публичный адрес;
- ветку `main` как основную.

GitHub Actions автоматически запустит синтаксическую проверку и тесты.
