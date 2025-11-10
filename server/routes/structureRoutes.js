import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import Year from '../models/Year.js'
import Course from '../models/Course.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// ========== YEAR ROUTES ==========

// GET /api/structure/years - Get all years for user
router.get('/years', async (req, res) => {
  try {
    const years = await Year.find({ userId: req.auth.userId })
      .sort({ createdAt: -1 })
    res.json(years)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/structure/years - Create a new year
router.post('/years', async (req, res) => {
  try {
    const { name } = req.body
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Year name is required' })
    }

    const year = await Year.create({
      name: name.trim(),
      userId: req.auth.userId
    })

    res.status(201).json(year)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/structure/years/:yearId - Update a year
router.put('/years/:yearId', async (req, res) => {
  try {
    const { yearId } = req.params
    const { name } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Year name is required' })
    }

    const year = await Year.findOne({ _id: yearId, userId: req.auth.userId })
    if (!year) {
      return res.status(404).json({ error: 'Year not found' })
    }

    year.name = name.trim()
    await year.save()

    res.json(year)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/structure/years/:yearId - Delete a year
router.delete('/years/:yearId', async (req, res) => {
  try {
    const { yearId } = req.params

    const year = await Year.findOne({ _id: yearId, userId: req.auth.userId })
    if (!year) {
      return res.status(404).json({ error: 'Year not found' })
    }

    // Delete all courses in this year
    await Course.deleteMany({ yearId, userId: req.auth.userId })

    // Delete the year
    await Year.deleteOne({ _id: yearId })

    res.json({ message: 'Year deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ========== COURSE ROUTES ==========

// GET /api/structure/courses - Get all courses for user
router.get('/courses', async (req, res) => {
  try {
    const { yearId } = req.query

    const filter = { userId: req.auth.userId }
    if (yearId) {
      filter.yearId = yearId
    }

    const courses = await Course.find(filter)
      .populate('yearId')
      .sort({ createdAt: -1 })

    res.json(courses)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/structure/courses - Create a new course
router.post('/courses', async (req, res) => {
  try {
    const { name, yearId } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required' })
    }

    if (!yearId) {
      return res.status(400).json({ error: 'Year ID is required' })
    }

    // Verify year exists and belongs to user
    const year = await Year.findOne({ _id: yearId, userId: req.auth.userId })
    if (!year) {
      return res.status(404).json({ error: 'Year not found' })
    }

    const course = await Course.create({
      name: name.trim(),
      yearId,
      userId: req.auth.userId
    })

    res.status(201).json(course)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/structure/courses/:courseId - Update a course
router.put('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const { name } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required' })
    }

    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    course.name = name.trim()
    await course.save()

    res.json(course)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/structure/courses/:courseId - Delete a course
router.delete('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Delete the course
    await Course.deleteOne({ _id: courseId })

    res.json({ message: 'Course deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
