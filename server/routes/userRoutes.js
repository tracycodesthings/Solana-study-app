import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { 
  getUserProgress, 
  updateUserProfile, 
  getUserStats 
} from '../controllers/userController.js'

const router = express.Router()

// All user routes require authentication
router.use(requireAuth)

// GET /api/users/progress - Get user's progress
router.get('/progress', getUserProgress)

// GET /api/users/stats - Get user's statistics
router.get('/stats', getUserStats)

// PUT /api/users/profile - Update user profile
router.put('/profile', updateUserProfile)

export default router
