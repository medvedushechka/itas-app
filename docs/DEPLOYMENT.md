# Развёртывание

## Общие требования

- Python 3.12;
- HTTPS;
- постоянный каталог для `app.db` и `static/uploads`;
- доступ к SMTP-серверу, если используется форма обратной связи;
- резервное копирование базы и загрузок.

## Подготовка production-конфигурации

Создайте `.env` на сервере и задайте как минимум:

```env
SECRET_KEY=случайная-длинная-строка
ADMIN_USERNAME=непубличный-логин
ADMIN_PASSWORD_HASH=хеш-пароля
SESSION_COOKIE_SECURE=1
TRUST_PROXY_HEADERS=1
DATABASE_URL=sqlite:////absolute/path/to/app.db
CONTACT_TO=recipient@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=sender@example.com
SMTP_PASSWORD=application-password
SMTP_USE_SSL=1
```

Не храните production `.env` в репозитории и не передавайте его в публичных архивах.

## cPanel Passenger

1. Создайте Python-приложение в панели cPanel и выберите Python 3.12.
2. Укажите корень приложения и файл запуска `passenger_wsgi.py`.
3. Установите зависимости в виртуальное окружение приложения:

```bash
python -m pip install -r requirements.txt
```

4. Создайте `.env` в корне приложения.
5. Примените миграции:

```bash
python -m flask --app app:create_app db upgrade
```

6. Для новой установки один раз выполните:

```bash
python scripts/seed_demo_data.py
```

7. Перезапустите Passenger через панель либо обновлением файла перезапуска, предусмотренным хостингом.

Точные названия пунктов cPanel зависят от хостера.

## Обновление приложения

Перед обновлением сохраните:

- `.env`;
- `app.db`;
- каталог `static/uploads`.

Затем обновите код, установите зависимости и примените миграции:

```bash
python -m pip install -r requirements.txt
python -m flask --app app:create_app db upgrade
```

Не запускайте `seed_demo_data.py --force` на рабочем сервере.

## Резервное копирование SQLite

При остановленном приложении достаточно скопировать `app.db`. Для работающего сайта безопаснее использовать встроенную команду SQLite backup либо временно перевести сайт в режим обслуживания.

Медиафайлы резервируются отдельным копированием `static/uploads`.

## Проверка после публикации

- `/health` отвечает `200` и JSON `{"status": "healthy"}`;
- главная страница загружается по HTTPS;
- вход и выход из `/admin/` работают;
- неопубликованные новости не доступны через API;
- загрузка и удаление медиа работают;
- контактная форма отправляет письмо;
- в браузерной консоли нет ошибок;
- `.env`, база и резервные копии недоступны по HTTP.
