$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    throw "Виртуальное окружение не найдено. Сначала выполните .\setup.ps1"
}

if (-not (Test-Path ".env")) {
    throw "Файл .env не найден. Скопируйте .env.example в .env и заполните настройки."
}

& .\.venv\Scripts\python.exe app.py
