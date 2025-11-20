# 🚀 Quick Deployment Guide

## Prerequisites Checklist
- [ ] MongoDB Atlas account created
- [ ] Clerk account set up with app credentials
- [ ] Google Gemini API key obtained
- [ ] Render/Railway account (for backend)
- [ ] Vercel/Netlify account (for frontend)

---

## Step 1: MongoDB Atlas (5 minutes)

1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Create database user (save username/password)
4. Add IP: 0.0.0.0/0 (allow all)
5. Get connection string: `mongodb+srv://...`

---

## Step 2: Backend Deployment - Render (10 minutes)

1. **Go to Render.com** → New Web Service
2. **Connect**: Select `Solana-study-app` repo
3. **Settings**:
   ```
   Name: solana-backend
   Root Directory: server
   Build: npm install
   Start: npm start
   ```
4. **Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<from-step-1>
   CLERK_SECRET_KEY=<from-clerk-dashboard>
   CLERK_PUBLISHABLE_KEY=<from-clerk-dashboard>
   GEMINI_API_KEY=<from-google-cloud>
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
5. **Deploy** → Copy your backend URL

---

## Step 3: Frontend Deployment - Vercel (5 minutes)

1. **Go to Vercel.com** → New Project
2. **Import**: Select `Solana-study-app` repo
3. **Settings**:
   ```
   Framework: Vite
   Root Directory: client
   Build: npm run build
   Output: dist
   ```
4. **Environment Variables**:
   ```bash
   VITE_API_URL=<backend-url-from-step-2>
   VITE_CLERK_PUBLISHABLE_KEY=<from-clerk-dashboard>
   ```
5. **Deploy** → Get your app URL

---

## Step 4: Update CORS (2 minutes)

1. Go back to **Render backend**
2. Update environment variable:
   ```
   ALLOWED_ORIGINS=https://your-actual-app.vercel.app
   ```
3. Save & redeploy

---

## Step 5: Test Your App ✅

1. Visit your Vercel URL
2. Sign up / Sign in
3. Upload a file
4. Generate a quiz
5. Take the quiz
6. Try the AI tutor

---

## Monitoring Setup (Optional)

### UptimeRobot (Free)
1. https://uptimerobot.com → Add Monitor
2. Monitor backend: `https://your-backend.onrender.com/health`
3. Check every 5 minutes

---

## Troubleshooting

### Backend not responding?
```bash
# Check health endpoint
curl https://your-backend.onrender.com/health

# Check Render logs
Go to Render Dashboard → Your Service → Logs
```

### Frontend can't connect to backend?
- Verify `VITE_API_URL` in Vercel environment variables
- Check CORS `ALLOWED_ORIGINS` includes your Vercel domain
- Ensure backend is deployed and healthy

### Database connection failed?
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format
- Ensure username/password are correct

---

## Cost Breakdown

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| MongoDB Atlas | M0: 512MB | M10: $9/month |
| Render | 750 hours/month | $7/month |
| Vercel | Unlimited | $20/month |
| Clerk | 10,000 MAU | $25/month |
| **Total** | **$0/month** | **~$60/month** |

---

## Next Steps

1. ✅ Set up custom domain (optional)
2. ✅ Configure email notifications
3. ✅ Enable database backups
4. ✅ Set up error monitoring (Sentry)
5. ✅ Review security settings

---

**Need Help?** See full guide in [DEPLOYMENT.md](./DEPLOYMENT.md)
