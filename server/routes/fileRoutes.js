import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { upload } from '../config/cloudinary.js'
import { 
  uploadFile, 
  getFilesByCourse, 
  deleteFile, 
  renameFile,
  addLink 
} from '../controllers/fileController.js'

const router = express.Router()

// All file routes require authentication
router.use(requireAuth)

// POST /api/files/upload - Upload a file
router.post('/upload', upload.single('file'), uploadFile)

// POST /api/files/add-link - Add an external link
router.post('/add-link', addLink)

// GET /api/files/:courseId - Get all files for a course
router.get('/:courseId', getFilesByCourse)

// DELETE /api/files/:fileId - Delete a file
router.delete('/:fileId', deleteFile)

// PUT /api/files/:fileId - Rename a file
router.put('/:fileId', renameFile)

export default router
