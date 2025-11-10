import express from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/authMiddleware.js'
import { 
  uploadFile, 
  getFilesByCourse, 
  deleteFile, 
  renameFile 
} from '../controllers/fileController.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_DIR || './uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  }
})

// All file routes require authentication
router.use(requireAuth)

// POST /api/files/upload - Upload a file
router.post('/upload', upload.single('file'), uploadFile)

// GET /api/files/:courseId - Get all files for a course
router.get('/:courseId', getFilesByCourse)

// DELETE /api/files/:fileId - Delete a file
router.delete('/:fileId', deleteFile)

// PUT /api/files/:fileId - Rename a file
router.put('/:fileId', renameFile)

export default router
