# 🚀 Deployment Guide - Solana Study App

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup (MongoDB Atlas)](#database-setup)
3. [Backend Deployment (Render)](#backend-deployment)
4. [Frontend Deployment (Vercel)](#frontend-deployment)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub account with repository access
- [ ] MongoDB Atlas account
- [ ] Clerk account (authentication service)
- [ ] Google Cloud account (for Gemini API)
- [ ] Render account (for backend) OR Railway/Heroku
- [ ] Vercel account (for frontend) OR Netlify

---

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Cluster

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Create New Cluster**:
   - Click "Build a Database"
   - Choose "M0 (Free)" tier for development
   - Select region closest to your backend server
   - Name your cluster (e.g., "solana-cluster")

3. **Configure Database Access**:
   ```
   Security → Database Access → Add New Database User
   - Username: solana-admin
   - Password: [Generate strong password]
   - Role: Atlas admin (or Read and write to any database)
   ```

4. **Configure Network Access**:
   ```
   Security → Network Access → Add IP Address
   - For development: Add your current IP
   - For production: Add 0.0.0.0/0 (allow from anywhere)
     OR add specific IPs of your hosting service
   ```

5. **Get Connection String**:
   ```
   Deployment → Database → Connect → Drivers
   - Select "Node.js" driver
   - Copy connection string
   - Replace <password> with your actual password
   - Replace <dbname> with "solana-study-app"
   ```

   Example:
   ```
   mongodb+srv://solana-admin:YOUR_PASSWORD@cluster.mongodb.net/solana-study-app?retryWrites=true&w=majority
   ```

### Step 2: Database Optimization

1. **Create Indexes** (optional, for better performance):
   ```javascript
   // In MongoDB Compass or Atlas UI
   db.users.createIndex({ clerkId: 1 })
   db.quizzes.createIndex({ userId: 1 })
   db.files.createIndex({ userId: 1 })
   ```

2. **Enable Connection Pooling** (already configured in code):
   - Max pool size: 10
   - Min pool size: 5

---

## Backend Deployment (Render)

### Step 1: Create New Web Service

1. **Go to Render**: https://render.com
2. **New → Web Service**
3. **Connect GitHub Repository**: `Solana-study-app`
4. **Configure Service**:
   ```
   Name: solana-backend
   Region: Choose nearest to your users
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free (or Starter for production)
   ```

### Step 2: Environment Variables

Add these in Render Dashboard (Environment tab):

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-atlas-connection-string>
CLERK_SECRET_KEY=<your-clerk-secret-key>
CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
GEMINI_API_KEY=<your-gemini-api-key>
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Step 3: Deploy

- Click "Create Web Service"
- Render will automatically deploy
- Note your backend URL: `https://solana-backend.onrender.com`

### Alternative: Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd server
railway init

# Add environment variables
railway variables set MONGODB_URI=<value>
railway variables set CLERK_SECRET_KEY=<value>
# ... (add all variables)

# Deploy
railway up
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare for Deployment

1. **Update environment variables**:
   ```bash
   # client/.env.production
   VITE_API_URL=https://solana-backend.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
   ```

2. **Test build locally**:
   ```bash
   cd client
   npm run build
   npm run preview
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Import Project**:
   - New Project → Import Git Repository
   - Select `Solana-study-app`
3. **Configure Project**:
   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables**:
   ```
   VITE_API_URL=https://solana-backend.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
   ```

5. **Deploy** → Wait for build to complete

6. **Custom Domain** (Optional):
   - Settings → Domains → Add Domain
   - Follow DNS configuration instructions

### Alternative: Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build
cd client
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

---

## Environment Variables

### Backend Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Server port | Yes | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb+srv://...` |
| `CLERK_SECRET_KEY` | Clerk authentication secret | Yes | `sk_live_...` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes | `pk_live_...` |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | `AIza...` |
| `ALLOWED_ORIGINS` | CORS allowed origins | Yes | `https://app.com` |

### Frontend Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `https://api.app.com` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes | `pk_live_...` |

---

## Post-Deployment Checklist

### ✅ Backend
- [ ] Backend is accessible at the deployment URL
- [ ] `/health` endpoint returns `OK`
- [ ] `/api/health` shows database connection status
- [ ] File uploads work correctly
- [ ] Authentication with Clerk is working
- [ ] AI quiz generation is functional
- [ ] Rate limiting is active
- [ ] CORS allows frontend domain

### ✅ Frontend
- [ ] Frontend loads without errors
- [ ] User can sign in/sign up
- [ ] Dashboard displays correctly
- [ ] File upload works
- [ ] Quiz generation works
- [ ] Quiz taking works
- [ ] AI tutor chat works
- [ ] All pages load correctly
- [ ] No console errors

### ✅ Integration
- [ ] Frontend connects to backend API
- [ ] Authentication flow works end-to-end
- [ ] Database operations work
- [ ] File storage/retrieval works

---

## Monitoring & Maintenance

### Health Monitoring

**Set up Uptime Monitoring**:
- Use https://uptimerobot.com (free)
- Add monitor for backend: `https://your-backend.com/health`
- Add monitor for frontend: `https://your-frontend.com`
- Set check interval: 5 minutes
- Configure email alerts

**Backend Health Check**:
```bash
curl https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Solana API is running",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "production",
  "database": "connected",
  "uptime": 12345
}
```

### Error Tracking (Optional - Sentry)

1. **Create Sentry account**: https://sentry.io
2. **Install Sentry**:
   ```bash
   # Backend
   cd server
   npm install @sentry/node
   
   # Frontend
   cd client
   npm install @sentry/react
   ```

3. **Configure Sentry** (see Sentry docs for integration)

### Logging

**Backend logs** (Render):
- Go to Render Dashboard → Your Service → Logs
- Logs include Morgan HTTP requests
- Errors are logged with full stack traces

**Frontend errors**:
- Check Vercel Dashboard → Your Project → Analytics
- Check browser console in production

### Performance Monitoring

**Analyze bundle size**:
```bash
cd client
npm run build
# Check dist/ folder size
```

**Monitor API response times**:
- Use Render metrics dashboard
- Set up alerts for slow responses (>2s)

### Database Backups

**MongoDB Atlas Automatic Backups**:
1. Go to Atlas → Backup
2. Enable continuous backups (M10+ clusters)
3. Or use Cloud Provider Snapshots (Free tier)

**Manual Backup**:
```bash
# Export database
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore database
mongorestore --uri="mongodb+srv://..." ./backup
```

### Maintenance Schedule

**Weekly**:
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor disk usage

**Monthly**:
- [ ] Update dependencies (`npm outdated`)
- [ ] Review security vulnerabilities (`npm audit`)
- [ ] Check database size and performance
- [ ] Review and clean old uploaded files

**Quarterly**:
- [ ] Review and optimize database indexes
- [ ] Analyze application performance
- [ ] Update documentation
- [ ] Review and update environment variables

---

## Rollback Procedures

### Render Rollback

1. **Go to Render Dashboard** → Your Service
2. **Click "Events" tab**
3. **Find previous successful deployment**
4. **Click "Redeploy"** on that version

Or use CLI:
```bash
# List deployments
render services list

# Rollback to specific deployment
render deployments rollback <deployment-id>
```

### Vercel Rollback

1. **Go to Vercel Dashboard** → Your Project
2. **Click "Deployments" tab**
3. **Find previous working deployment**
4. **Click "..." → Promote to Production**

Or use CLI:
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel alias set <deployment-url> <your-domain>
```

### Database Rollback

```bash
# Restore from backup
mongorestore --uri="mongodb+srv://..." --drop ./backup
```

### Emergency Procedures

**If backend is down**:
1. Check Render logs for errors
2. Verify environment variables
3. Check MongoDB Atlas status
4. Restart service: Render Dashboard → Manual Deploy

**If frontend is down**:
1. Check Vercel deployment logs
2. Verify build completed successfully
3. Check if backend API is accessible
4. Redeploy: Vercel Dashboard → Redeploy

**If database is down**:
1. Check MongoDB Atlas status page
2. Verify network access settings
3. Check connection string
4. Contact MongoDB support if needed

---

## Continuous Deployment

### GitHub Actions (Already Configured)

- Automatically runs on push to `main` branch
- Builds and tests both frontend and backend
- Can be extended to auto-deploy

### Auto-Deploy Settings

**Render**:
- Settings → Auto-Deploy: Yes
- Branch: main
- Auto-deploy on push: Enabled

**Vercel**:
- Settings → Git → Auto-deploy: Enabled
- Production Branch: main
- Preview deployments for all branches

---

## Support & Resources

- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **Gemini API Docs**: https://ai.google.dev/docs

---

## Quick Deploy Commands

```bash
# Frontend build test
cd client
npm run build
npm run preview

# Backend start
cd server
npm start

# Check health
curl https://your-backend.com/health

# View logs (Render)
render logs -f

# View logs (Vercel)
vercel logs
```

---

**Last Updated**: January 2025
**Maintained By**: Development Team
