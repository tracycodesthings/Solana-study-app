import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  globalSearch,
  searchInCourse,
  generateMixedPaper
} from '../controllers/searchController.js'

const router = express.Router()

// All search routes require authentication
router.use(requireAuth)

// GET /api/search?query=... - Global search
router.get('/', globalSearch)

// GET /api/search/course/:courseId?query=... - Search within course
router.get('/course/:courseId', searchInCourse)

// POST /api/search/mixed-paper - Generate mixed paper
router.post('/mixed-paper', generateMixedPaper)

export default router
