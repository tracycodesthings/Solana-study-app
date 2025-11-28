# Cloudinary Setup Guide

## Why You Need This
- **Local development** uses disk storage (files in `uploads/` folder)
- **Production (Render)** has ephemeral storage - files disappear on restart
- **Cloudinary** provides permanent cloud storage for production

## Step 1: Get Your Cloudinary Credentials

1. Go to [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Sign up or log in
3. On the dashboard, you'll see:
   - **Cloud Name**: `dxxxxxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `abc123xyz...` (click "Show" to reveal)

## Step 2: Add to Render Environment Variables

1. Go to your Render dashboard: https://dashboard.render.com/
2. Click on your **server** service (solana-study-app backend)
3. Go to **Environment** tab
4. Add these variables (click "Add Environment Variable"):

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

5. Click **Save Changes**
6. Render will automatically redeploy

## Step 3: Verify Setup

After deployment, check your server logs on Render. You should see:
- ✅ `Cloudinary storage configured` (means it's working)
- ⚠️ `Cloudinary not configured, using local storage` (means variables are missing)

## Step 4: Test Upload

1. Go to your deployed app
2. Upload a new file
3. Check Render logs for: `📤 Cloudinary upload details`
4. The file should appear in your Cloudinary Media Library

## Troubleshooting

### Files still not working after setup?
- Old files in database reference non-existent Cloudinary files
- **Solution**: Delete old files from your app and re-upload them

### "File not found in Cloudinary" error?
- The file was uploaded to a different Cloudinary account
- **Solution**: Verify the credentials on Render match your Cloudinary dashboard

### Want to use Cloudinary locally too?
Add to your local `.env` file:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Current Status

Run this command to check if Cloudinary is configured:
```bash
curl https://solana-study-app-2.onrender.com/api/health
```

Should return Cloudinary status.
