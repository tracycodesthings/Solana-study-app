# Testing Authentication (Phase 2)

## Prerequisites
1. Make sure MongoDB is running
2. Your `.env` files have valid Clerk keys

## Start the Application

### Terminal 1 - Backend
```bash
cd server
npm run dev
```

Should see:
- ✅ Server running on port 5000
- ✅ MongoDB Connected
- 🔐 Clerk authentication enabled

### Terminal 2 - Frontend
```bash
cd client
npm run dev
```

Should open at: http://localhost:3000

## Test Authentication Flow

### 1. Sign Up
- Visit http://localhost:3000
- You'll be redirected to `/sign-in`
- Click "Sign up" link
- Create a new account
- After signup, you'll be redirected to the dashboard

### 2. Sign In
- Sign out using the UserButton (top right)
- Sign in again with your credentials
- Should be redirected back to dashboard

### 3. Session Persistence
- Refresh the page
- You should stay logged in
- Close browser and reopen - session should persist

### 4. Protected Routes
Try accessing these while logged out:
- http://localhost:3000/files (should redirect to sign-in)
- http://localhost:3000/quizzes (should redirect to sign-in)
- http://localhost:3000/tutor (should redirect to sign-in)

### 5. Test API Authentication
```bash
# Without authentication (should fail)
curl http://localhost:5000/api/users/stats

# With authentication (need valid session token from Clerk)
curl -H "Authorization: Bearer YOUR_SESSION_TOKEN" http://localhost:5000/api/users/stats
```

## Features Implemented ✅

### Frontend
- [x] ClerkProvider wrapping entire app
- [x] Sign In page with Clerk component
- [x] Sign Up page with Clerk component
- [x] Protected routes (Dashboard, Files, Quizzes, Tutor, Mixed Papers)
- [x] Redirect to sign-in for unauthenticated users
- [x] UserButton with sign-out
- [x] Sidebar navigation
- [x] Dashboard with stats cards and quick actions

### Backend
- [x] Clerk SDK integration
- [x] Authentication middleware (`requireAuth`)
- [x] All API routes protected
- [x] User info attached to requests (`req.auth`)
- [x] Error handling for auth failures
- [x] CORS configuration
- [x] MongoDB connection
- [x] Express server setup

## Next Steps - Phase 3
- File & Folder Management
- Database models (Year, Course, File)
- File upload with Multer
- Cloud storage integration
