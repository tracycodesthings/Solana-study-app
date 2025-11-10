import express from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  generateQuiz,
  getQuizzesByCourse,
  getQuiz,
  submitQuiz,
  uploadManualQuiz,
  deleteQuiz
} from '../controllers/quizController.js'

const router = express.Router()

// Configure multer for quiz file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'quiz-' + uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// All quiz routes require authentication
router.use(requireAuth)

// POST /api/quizzes/generate - Generate quiz from file
router.post('/generate', generateQuiz)

// POST /api/quizzes/upload - Upload manual quiz (past paper, practice quiz)
router.post('/upload', upload.single('file'), uploadManualQuiz)

// GET /api/quizzes/course/:courseId - Get quizzes for a course (both generated and uploaded)
router.get('/course/:courseId', getQuizzesByCourse)

// GET /api/quizzes/:quizId - Get single quiz
router.get('/:quizId', getQuiz)

// POST /api/quizzes/:quizId/submit - Submit quiz answers
router.post('/:quizId/submit', submitQuiz)

// DELETE /api/quizzes/:quizId - Delete quiz
router.delete('/:quizId', deleteQuiz)

export default router
