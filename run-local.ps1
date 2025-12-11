# Run-local helper for Backend
# Usage: open PowerShell in the Backend folder and run `./run-local.ps1`

Write-Host "Installing dependencies..."
npm install

Write-Host "Seeding database (uses MONGODB_URI from .env if present)..."
npm run seed

Write-Host "Starting dev server (press Ctrl+C to stop)..."
npm run dev
