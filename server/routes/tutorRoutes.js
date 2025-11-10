import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation
} from '../controllers/tutorController.js'

const router = express.Router()

// All tutor routes require authentication
router.use(requireAuth)

// POST /api/tutor/message - Send message to tutor
router.post('/message', sendMessage)

// GET /api/tutor/conversations/:courseId - Get all conversations for a course
router.get('/conversations/:courseId', getConversations)

// GET /api/tutor/conversation/:conversationId - Get single conversation
router.get('/conversation/:conversationId', getConversation)

// DELETE /api/tutor/conversation/:conversationId - Delete conversation
router.delete('/conversation/:conversationId', deleteConversation)

export default router
