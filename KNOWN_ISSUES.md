# 📝 Known Issues - Production Deployment

## File Upload Issues

### Issue: 500 Error on File Upload
**Status**: Under investigation

**Possible Causes:**
1. **Ephemeral Filesystem** - Render's free tier uses ephemeral storage
   - Files uploaded get deleted on container restart/redeploy
   - The uploads directory might not have write permissions
   
2. **Missing Environment Variables** - Check Render dashboard
   - `UPLOAD_DIR` should be set (optional, defaults to `./uploads`)

### Temporary Workarounds:
- Use local development for file upload testing
- Files will work but won't persist across deployments

### Permanent Solution (TODO):
Implement cloud storage integration:
- **Option 1**: AWS S3 (most popular, $0.023/GB)
- **Option 2**: Cloudinary (free tier: 25 credits/month)
- **Option 3**: Render Disk (paid add-on, $0.25/GB/month)

### Implementation Steps for Cloud Storage:
1. Install package: `npm install @aws-sdk/client-s3` or `cloudinary`
2. Update `fileController.js` to upload to cloud
3. Store cloud URL in database instead of local path
4. Update file serving to redirect to cloud URLs

---

## Other Known Issues

### Dashboard 404 Errors (Expected)
The following routes return 404 - they haven't been implemented yet:
- `/api/progress/dashboard`
- `/api/progress/quiz-performance`
- `/api/progress/course-performance`
- `/api/progress/recent-activity`
- `/api/progress/weak-areas`

**Impact**: Dashboard analytics won't show data
**Workaround**: Other features work fine (quizzes, tutor, files page)
**Fix**: Implement progress tracking routes (see TODO below)

---

## TODO: Implement Missing Features

### 1. Progress Tracking Routes
Create `server/controllers/progressController.js`:
```javascript
export const getDashboard = async (req, res) => { /* ... */ }
export const getQuizPerformance = async (req, res) => { /* ... */ }
export const getCoursePerformance = async (req, res) => { /* ... */ }
export const getRecentActivity = async (req, res) => { /* ... */ }
export const getWeakAreas = async (req, res) => { /* ... */ }
```

### 2. Cloud Storage Integration
- Choose storage provider
- Set up credentials
- Update file upload/download logic
- Migrate existing file URLs

### 3. File Persistence
- Implement cloud storage
- Or upgrade to Render Disk
- Update documentation

---

## Debugging File Uploads

### Check Render Logs:
1. Go to Render Dashboard
2. Select `solana-study-app-2`
3. Click "Logs" tab
4. Look for "Upload error:" messages

### Common Errors:
- `ENOENT: no such file or directory` - Directory doesn't exist
- `EACCES: permission denied` - No write permissions
- `Course not found` - Course ID invalid or doesn't belong to user

---

Last Updated: November 25, 2025
