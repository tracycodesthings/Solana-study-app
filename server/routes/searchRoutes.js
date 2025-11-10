import express from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  globalSearch,
  searchInCourse,
  generateMixedPaper,
  uploadMixedPaper
} from '../controllers/searchController.js'

const router = express.Router()

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain') {
      cb(null, true)
    } else {
      cb(new Error('Only .txt files are allowed'))
    }
  }
})

// All search routes require authentication
router.use(requireAuth)

// GET /api/search?query=... - Global search
router.get('/', globalSearch)

// GET /api/search/course/:courseId?query=... - Search within course
router.get('/course/:courseId', searchInCourse)

// POST /api/search/mixed-paper - Generate mixed paper
router.post('/mixed-paper', generateMixedPaper)

// POST /api/search/upload-mixed-paper - Upload existing mixed paper
router.post('/upload-mixed-paper', upload.single('file'), uploadMixedPaper)

export default router
