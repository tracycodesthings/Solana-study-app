# 📋 Pre-Deployment Checklist

Use this checklist before deploying to production.

## Code Quality

### Frontend
- [ ] No console.log statements (or wrapped in development check)
- [ ] All components use lazy loading where appropriate
- [ ] Images are optimized
- [ ] Build completes without errors: `npm run build`
- [ ] No ESLint errors: `npm run lint`
- [ ] App runs in preview mode: `npm run preview`

### Backend
- [ ] No console.log for sensitive data
- [ ] Error handling implemented for all routes
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Environment variables validated
- [ ] Server starts without errors: `npm start`

## Security

- [ ] All API keys in environment variables (not in code)
- [ ] .env files in .gitignore
- [ ] No sensitive data in Git history
- [ ] Helmet security headers configured
- [ ] CORS restricted to known origins
- [ ] Rate limiting enabled
- [ ] Input sanitization implemented
- [ ] MongoDB connection string secure
- [ ] Clerk authentication properly configured

## Database

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with appropriate permissions
- [ ] Network access configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string obtained
- [ ] Database indexes created (if needed)
- [ ] Backup strategy planned

## Environment Variables

### Backend (.env)
- [ ] `NODE_ENV=production`
- [ ] `PORT` set
- [ ] `MONGODB_URI` configured
- [ ] `CLERK_SECRET_KEY` set
- [ ] `CLERK_PUBLISHABLE_KEY` set
- [ ] `GEMINI_API_KEY` set
- [ ] `ALLOWED_ORIGINS` configured

### Frontend (.env.production)
- [ ] `VITE_API_URL` points to production backend
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` set

## Testing

- [ ] User can sign up
- [ ] User can sign in
- [ ] User can upload files
- [ ] Quiz generation works
- [ ] Quiz taking works
- [ ] AI tutor responds
- [ ] Progress tracking works
- [ ] All pages load correctly
- [ ] Mobile responsiveness verified

## Deployment Accounts

- [ ] GitHub account ready
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas account created
- [ ] Clerk account set up
- [ ] Google Cloud account (Gemini API)
- [ ] Render/Railway account (backend)
- [ ] Vercel/Netlify account (frontend)

## Monitoring & Maintenance

- [ ] Health check endpoints working
- [ ] Uptime monitoring configured
- [ ] Error tracking set up (optional)
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team has access to all accounts

## Documentation

- [ ] README.md updated
- [ ] DEPLOYMENT.md reviewed
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Rollback procedures understood

## Performance

- [ ] Build size optimized (<500KB gzipped)
- [ ] Lazy loading implemented
- [ ] Code splitting configured
- [ ] Images compressed
- [ ] API response times acceptable (<2s)

## Post-Deployment

- [ ] Backend URL saved
- [ ] Frontend URL saved
- [ ] DNS configured (if custom domain)
- [ ] SSL certificate working (HTTPS)
- [ ] CORS updated with production URLs
- [ ] All features tested in production
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured

---

## Quick Commands

```bash
# Validate environment
node scripts/validate-env.js

# Build frontend
cd client && npm run build

# Test backend
cd server && npm start

# Check for vulnerabilities
npm audit

# Update dependencies
npm outdated
```

---

## Deployment Commands

```bash
# Frontend (Vercel)
cd client
vercel --prod

# Backend (Render)
git push origin main
# (Render auto-deploys on push)

# Or use Railway
cd server
railway up
```

---

**Ready to deploy?** Follow [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for step-by-step instructions.
