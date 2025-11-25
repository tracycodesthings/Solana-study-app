# 🤖 Automated Deployment Script

This directory contains scripts to automate your deployment.

## Option 1: Railway + Vercel (Fully Automated)

```powershell
# Run the automated deployment script
.\scripts\deploy.ps1
```

This script will:
1. ✅ Deploy backend to Railway with environment variables
2. ✅ Deploy frontend to Vercel with auto-configuration
3. ✅ Set up continuous deployment from GitHub

**Requirements:**
- Railway CLI installed ✅ (already installed)
- Vercel CLI installed ✅ (already installed)
- You'll need to authenticate both services (browser popup)

---

## Option 2: Manual Deployment (Recommended - Easier UI)

### Backend - Render.com (10 minutes)

1. **Go to**: https://render.com/
2. **Sign up** with GitHub
3. **New → Web Service**
4. **Connect** repository: `Solana-study-app`
5. **Configure**:
   ```
   Name: solana-backend
   Root Directory: server
   Build Command: npm install
   Start Command: npm start
   ```
6. **Add Environment Variables** (copy from your server/.env):
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGODB_URI` = (your value)
   - `CLERK_SECRET_KEY` = (your value)
   - `CLERK_PUBLISHABLE_KEY` = (your value)
   - `GEMINI_API_KEY` = (your value)
   - `ALLOWED_ORIGINS` = (will add after frontend deploy)

7. **Deploy** and copy your backend URL

### Frontend - Vercel.com (5 minutes)

Run this command:
```powershell
cd client
vercel
```

Or use UI:
1. **Go to**: https://vercel.com/
2. **Import** project: `Solana-study-app`
3. **Configure**:
   ```
   Framework: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   ```
4. **Environment Variables**:
   - `VITE_API_URL` = (your Render backend URL)
   - `VITE_CLERK_PUBLISHABLE_KEY` = (from server/.env)

5. **Deploy**

### Final Step: Update CORS

1. Go back to **Render dashboard**
2. Update `ALLOWED_ORIGINS` = (your Vercel URL)
3. **Redeploy**

---

## Quick Command Reference

```powershell
# Deploy frontend to Vercel
cd client
vercel --prod

# Deploy backend to Railway
cd server
railway up

# Check backend health
curl https://your-backend.onrender.com/health

# View logs (Render)
# Go to dashboard → Logs

# View logs (Vercel)
vercel logs
```

---

## What's Already Done ✅

- ✅ Production build configuration
- ✅ Security headers (Helmet)
- ✅ Rate limiting
- ✅ Error handling
- ✅ Environment validation
- ✅ CI/CD pipeline
- ✅ Health checks
- ✅ Documentation

---

## Need Help?

See:
- [QUICK_DEPLOY.md](../QUICK_DEPLOY.md) - Step-by-step guide
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Comprehensive guide
- [PRE_DEPLOY_CHECKLIST.md](../PRE_DEPLOY_CHECKLIST.md) - Checklist
