#!/usr/bin/env pwsh
# Automated Deployment Script for Solana Study App
# This script will guide you through deploying your application

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Solana Study App - Automated Deployment      " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if CLIs are installed
Write-Host "🔍 Checking required CLIs..." -ForegroundColor Yellow

$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Install with: npm install -g vercel" -ForegroundColor Red
    exit 1
}

if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI not found. Install with: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All CLIs installed!" -ForegroundColor Green
Write-Host ""

# Step 1: Deploy Backend to Railway
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "STEP 1: Backend Deployment (Railway)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Railway will open a browser for authentication..." -ForegroundColor Yellow
Write-Host ""

$deployBackend = Read-Host "Deploy backend to Railway? (y/n)"

if ($deployBackend -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Deploying backend to Railway..." -ForegroundColor Green
    
    Set-Location server
    
    # Initialize Railway project
    Write-Host "Initializing Railway project..." -ForegroundColor Yellow
    railway login
    railway init
    
    # Link to GitHub
    Write-Host ""
    Write-Host "📝 Setting up environment variables..." -ForegroundColor Yellow
    
    # Read from .env and set in Railway
    if (Test-Path .env) {
        Get-Content .env | ForEach-Object {
            if ($_ -match '^([^=]+)=(.+)$') {
                $key = $matches[1]
                $value = $matches[2]
                Write-Host "  Setting $key..." -ForegroundColor Gray
                railway variables set "$key=$value"
            }
        }
        
        # Add NODE_ENV
        railway variables set "NODE_ENV=production"
    }
    
    Write-Host ""
    Write-Host "🚀 Deploying backend..." -ForegroundColor Green
    railway up
    
    Write-Host ""
    Write-Host "📋 Getting backend URL..." -ForegroundColor Yellow
    $backendUrl = railway domain
    
    Write-Host ""
    Write-Host "✅ Backend deployed!" -ForegroundColor Green
    Write-Host "🔗 Backend URL: $backendUrl" -ForegroundColor Cyan
    Write-Host ""
    
    # Save backend URL for frontend
    $env:BACKEND_URL = $backendUrl
    
    Set-Location ..
}

# Step 2: Deploy Frontend to Vercel
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "STEP 2: Frontend Deployment (Vercel)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$deployFrontend = Read-Host "Deploy frontend to Vercel? (y/n)"

if ($deployFrontend -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Deploying frontend to Vercel..." -ForegroundColor Green
    
    Set-Location client
    
    # Create .env.production with backend URL
    if ($env:BACKEND_URL) {
        Write-Host "📝 Configuring frontend environment..." -ForegroundColor Yellow
        
        $clerkKey = (Get-Content ../server/.env | Select-String "CLERK_PUBLISHABLE_KEY" | ForEach-Object { $_ -replace '.*=', '' })
        
        @"
VITE_API_URL=$env:BACKEND_URL
VITE_CLERK_PUBLISHABLE_KEY=$clerkKey
"@ | Out-File -FilePath .env.production -Encoding utf8
        
        Write-Host "✅ Environment configured" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
    npm run build
    
    Write-Host ""
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
    vercel --prod
    
    Write-Host ""
    Write-Host "✅ Frontend deployed!" -ForegroundColor Green
    
    Set-Location ..
}

# Step 3: Update CORS
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "STEP 3: Final Configuration" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANT: Update CORS settings" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Get your Vercel frontend URL" -ForegroundColor White
Write-Host "2. Go to Railway dashboard" -ForegroundColor White
Write-Host "3. Update ALLOWED_ORIGINS environment variable" -ForegroundColor White
Write-Host "4. Redeploy backend" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

if ($env:BACKEND_URL) {
    Write-Host "Backend URL: $env:BACKEND_URL" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test your application" -ForegroundColor White
Write-Host "  2. Set up uptime monitoring (uptimerobot.com)" -ForegroundColor White
Write-Host "  3. Configure custom domain (optional)" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: See DEPLOYMENT.md for details" -ForegroundColor Gray
Write-Host ""
