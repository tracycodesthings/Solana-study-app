import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import { clerkClient } from '@clerk/clerk-sdk-node'

// Import routes
import fileRoutes from './routes/fileRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import tutorRoutes from './routes/tutorRoutes.js'
import userRoutes from './routes/userRoutes.js'
import structureRoutes from './routes/structureRoutes.js'

// Load environment variables
dotenv.config()

// Initialize Express
const app = express()

// Connect to MongoDB
connectDB()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true)
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true
  })
)

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Learnify API is running',
    timestamp: new Date().toISOString()
  })
})

// Serve uploaded files
app.use('/uploads', express.static('uploads'))

// API Routes
app.use('/api/files', fileRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/tutor', tutorRoutes)
app.use('/api/users', userRoutes)
app.use('/api/structure', structureRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`🔐 Clerk authentication enabled`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})
