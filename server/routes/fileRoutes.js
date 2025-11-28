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
import { cloudinary, hasCloudinaryConfig } from '../config/cloudinary.js'

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

// List all files in solana-uploads folder (debugging)
router.get('/cloudinary/list', async (req, res) => {
  if (!hasCloudinaryConfig) {
    return res.status(400).json({ error: 'Cloudinary not configured' })
  }
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'solana-uploads/',
      max_results: 100
    })
    res.json({ resources: result.resources.map(r => ({
      public_id: r.public_id,
      format: r.format,
      resource_type: r.resource_type,
      url: r.secure_url,
      created_at: r.created_at
    })) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
