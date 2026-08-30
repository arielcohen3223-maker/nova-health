# NOVA Supabase setup — הריצי: .\scripts\setup-supabase.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "=== NOVA Supabase Setup ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Create a project (if you don't have one)" -ForegroundColor Yellow
Write-Host "  https://supabase.com/dashboard → New project"
Write-Host ""
Write-Host "Step 2: SQL Editor → paste supabase/full_setup.sql → Run"
Write-Host ""
Write-Host "Step 3: Authentication → Providers → Email → ON"
Write-Host "  Authentication → URL Configuration:"
Write-Host "    Site URL: https://nova-health-eight.vercel.app"
Write-Host "    Redirect URLs: https://nova-health-eight.vercel.app/**"
Write-Host ""

$url = Read-Host "Paste EXPO_PUBLIC_SUPABASE_URL (https://xxx.supabase.co)"
$key = Read-Host "Paste EXPO_PUBLIC_SUPABASE_ANON_KEY (eyJ...)"
$ref = Read-Host "Paste project ref (from dashboard URL, e.g. abcdefghijklmnop)"
$openai = Read-Host "Paste OPENAI_API_KEY (sk-...) or press Enter to skip"

$envContent = @"
EXPO_PUBLIC_SUPABASE_URL=$url
EXPO_PUBLIC_SUPABASE_ANON_KEY=$key
EXPO_PUBLIC_DEMO_MODE=true
EXPO_PUBLIC_PRIVACY_URL=https://nova-health-eight.vercel.app/legal/privacy.html
EXPO_PUBLIC_TERMS_URL=https://nova-health-eight.vercel.app/legal/terms.html
"@

$envPath = Join-Path $root ".env"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Host ""
Write-Host "Wrote $envPath" -ForegroundColor Green
Write-Host "EXPO_PUBLIC_DEMO_MODE=true — app works without login while you test." -ForegroundColor Gray
Write-Host "Remove DEMO_MODE from Vercel when ready for real sign-in." -ForegroundColor Gray

Write-Host ""
Write-Host "=== Vercel Environment Variables ===" -ForegroundColor Cyan
Write-Host "Dashboard → nova-health → Settings → Environment Variables → Add:"
Write-Host "  EXPO_PUBLIC_SUPABASE_URL = $url"
Write-Host "  EXPO_PUBLIC_SUPABASE_ANON_KEY = (your anon key)"
Write-Host "  EXPO_PUBLIC_DEMO_MODE = true   (optional, for testing)"
Write-Host "Then: Deployments → Redeploy"
Write-Host ""

Write-Host "=== Edge Functions (optional — needs supabase login) ===" -ForegroundColor Cyan
Write-Host "  npx supabase login"
Write-Host "  npx supabase link --project-ref $ref"
if ($openai) {
  Write-Host "  npx supabase secrets set OPENAI_API_KEY=$openai"
}
Write-Host "  npm run functions:deploy"
Write-Host ""
Write-Host "Done." -ForegroundColor Green
