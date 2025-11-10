import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  generateQuiz,
  getQuizzesByCourse,
  submitQuiz,
  getQuizResults
} from '../controllers/quizController.js'

const router = express.Router()

// All quiz routes require authentication
router.use(requireAuth)

// POST /api/quizzes/generate - Generate quiz from notes
router.post('/generate', generateQuiz)

// GET /api/quizzes/course/:courseId - Get quizzes for a course
router.get('/course/:courseId', getQuizzesByCourse)

// POST /api/quizzes/:quizId/submit - Submit quiz answers
router.post('/:quizId/submit', submitQuiz)

// GET /api/quizzes/results/:userId - Get user's quiz results
router.get('/results/:userId', getQuizResults)

export default router
