# JamAlert Frontend Vercel Deployment Script
# PowerShell script for Windows

Write-Host "🚀 JamAlert Frontend - Vercel Deployment" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI installation..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI. Please install manually:" -ForegroundColor Red
        Write-Host "   npm install -g vercel" -ForegroundColor White
        exit 1
    }
    Write-Host "✅ Vercel CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI found!" -ForegroundColor Green
}

# Check if user is logged in to Vercel
Write-Host "Checking Vercel authentication..." -ForegroundColor Yellow
vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel. Please login:" -ForegroundColor Red
    Write-Host "   vercel login" -ForegroundColor White
    Write-Host ""
    Write-Host "After logging in, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel authentication verified!" -ForegroundColor Green

# Run build to check for errors
Write-Host "Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix build errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "Note: You may be prompted to configure the project." -ForegroundColor Cyan
Write-Host "Recommended settings:" -ForegroundColor Cyan
Write-Host "  - Project name: jamalert-frontend-demo" -ForegroundColor White
Write-Host "  - Directory: ./ (current directory)" -ForegroundColor White
Write-Host ""

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Green
    Write-Host "Your JamAlert demo is now live!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Share this with your team:" -ForegroundColor Yellow
    Write-Host "- Demo includes all UI components" -ForegroundColor White
    Write-Host "- Mock data for realistic testing" -ForegroundColor White
    Write-Host "- Responsive design for all devices" -ForegroundColor White
    Write-Host "- No backend required" -ForegroundColor White
    Write-Host ""
    Write-Host "Perfect for reviewing the current application state!" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}
