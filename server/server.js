import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import connectDB from './config/db.js'
import { clerkClient } from '@clerk/clerk-sdk-node'

// Import routes
import fileRoutes from './routes/fileRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import tutorRoutes from './routes/tutorRoutes.js'
import userRoutes from './routes/userRoutes.js'
import structureRoutes from './routes/structureRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import searchRoutes from './routes/searchRoutes.js'

// Load environment variables
dotenv.config()

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'GEMINI_API_KEY'
]

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '))
  process.exit(1)
}

// Initialize Express
const app = express()

// Connect to MongoDB
connectDB()

// Trust proxy - required for rate limiting behind reverse proxy
app.set('trust proxy', 1)

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit for sensitive endpoints
  message: 'Too many requests, please try again later.',
})

app.use('/api/', limiter)

// Compression middleware
app.use(compression())

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'))
} else {
  app.use(morgan('dev'))
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174']

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true)
      
      if (process.env.NODE_ENV === 'production') {
        // Check if origin matches allowed origins or Vercel preview URLs
        const isAllowed = allowedOrigins.includes(origin) || 
                         origin.includes('vercel.app') ||
                         origin.includes('solana-study-app')
        
        if (isAllowed) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      } else {
        // Allow all origins in development
        callback(null, true)
      }
    },
    credentials: true
  })
)

// Health check route (detailed)
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const mongoose = (await import('mongoose')).default
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    
    // Check Cloudinary configuration
    const hasCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET
    )
    
    const cloudinaryStatus = hasCloudinary 
      ? `configured (${process.env.CLOUDINARY_CLOUD_NAME})` 
      : 'not configured (using local storage)'
    
    res.json({ 
      status: 'OK', 
      message: 'Solana API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      cloudinary: cloudinaryStatus,
      storage: hasCloudinary ? 'cloudinary' : 'local',
      uptime: process.uptime()
    })
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    })
  }
})

// Simple health check for uptime monitoring
app.get('/health', (req, res) => {
  res.status(200).send('OK')
})

// Serve uploaded files
app.use('/uploads', express.static('uploads'))

// API Routes
app.use('/api/files', fileRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/tutor', strictLimiter, tutorRoutes) // Stricter rate limit for AI endpoint
app.use('/api/users', userRoutes)
app.use('/api/structure', structureRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/search', searchRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { 
      stack: err.stack,
      details: err.details 
    })
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`🔐 Clerk authentication enabled`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})
