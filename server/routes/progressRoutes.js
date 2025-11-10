import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  getDashboardStats,
  getQuizPerformance,
  getCoursePerformance,
  getRecentActivity,
  getWeakAreas
} from '../controllers/progressController.js'

const router = express.Router()

// All progress routes require authentication
router.use(requireAuth)

// GET /api/progress/dashboard - Get overall statistics
router.get('/dashboard', getDashboardStats)

// GET /api/progress/quiz-performance - Get quiz performance over time
router.get('/quiz-performance', getQuizPerformance)

// GET /api/progress/course-performance - Get course-wise performance
router.get('/course-performance', getCoursePerformance)

// GET /api/progress/recent-activity - Get recent quiz attempts
router.get('/recent-activity', getRecentActivity)

// GET /api/progress/weak-areas - Get topics needing improvement
router.get('/weak-areas', getWeakAreas)

export default router
