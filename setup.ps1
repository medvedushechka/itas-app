$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,
        [Parameter(Mandatory = $true)]
        [string]$ErrorMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$ErrorMessage (exit code: $LASTEXITCODE)"
    }
}

Write-Host "[ITAS] Preparing virtual environment..."

if (-not (Test-Path -LiteralPath ".venv")) {
    Invoke-Checked { py -3.12 -m venv .venv } "Failed to create virtual environment"
}

Invoke-Checked { & ".\.venv\Scripts\python.exe" -m pip install --upgrade pip } "Failed to update pip"
Invoke-Checked { & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt } "Failed to install dependencies"

if (-not (Test-Path -LiteralPath ".env")) {
    Write-Host "[ITAS] Creating local configuration..."
    Invoke-Checked { & ".\.venv\Scripts\python.exe" "scripts\bootstrap_env.py" } "Failed to create .env"
}

Write-Host "[ITAS] Applying database migrations..."
Invoke-Checked { & ".\.venv\Scripts\python.exe" -m flask --app "app:create_app" db upgrade } "Database migration failed"

Write-Host "[ITAS] Loading demo data when the database is empty..."
Invoke-Checked { & ".\.venv\Scripts\python.exe" "scripts\seed_demo_data.py" } "Demo data loading failed"

Write-Host "[ITAS] Setup completed successfully."
