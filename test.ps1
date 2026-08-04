$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    throw "Виртуальное окружение не найдено. Сначала выполните .\setup.ps1"
}

& .\.venv\Scripts\python.exe -m pytest
