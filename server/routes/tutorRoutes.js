import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { searchNotes, getRelatedQuizzes } from '../controllers/tutorController.js'

const router = express.Router()

// All tutor routes require authentication
router.use(requireAuth)

// GET /api/tutor/search?topic=... - Search notes for topic
router.get('/search', searchNotes)

// GET /api/tutor/related-quizzes/:topic - Get quizzes related to topic
router.get('/related-quizzes/:topic', getRelatedQuizzes)

export default router
