import File from '../models/File.js'
import Course from '../models/Course.js'
import fs from 'fs/promises'
import path from 'path'

// Upload file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { courseId } = req.body
    if (!courseId) {
      // Clean up uploaded file
      await fs.unlink(req.file.path)
      return res.status(400).json({ error: 'Course ID is required' })
    }

    // Verify course exists and belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      await fs.unlink(req.file.path)
      return res.status(404).json({ error: 'Course not found' })
    }

    // Create file record
    const file = await File.create({
      name: req.file.originalname,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      courseId,
      userId: req.auth.userId
    })

    res.status(201).json(file)
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get files by course
export const getFilesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params

    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    const files = await File.find({ courseId, userId: req.auth.userId })
      .sort({ uploadedAt: -1 })

    res.json(files)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params

    const file = await File.findOne({ _id: fileId, userId: req.auth.userId })
    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Delete physical file only if it's not a link
    if (!file.isLink) {
      const filePath = path.join(process.cwd(), file.url)
      try {
        await fs.unlink(filePath)
      } catch (err) {
        console.error('Error deleting physical file:', err)
      }
    }

    // Delete database record
    await File.deleteOne({ _id: fileId })

    res.json({ message: file.isLink ? 'Link deleted successfully' : 'File deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Rename file
export const renameFile = async (req, res) => {
  try {
    const { fileId } = req.params
    const { name } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'File name is required' })
    }

    const file = await File.findOne({ _id: fileId, userId: req.auth.userId })
    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }

    file.name = name.trim()
    await file.save()

    res.json(file)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Add external link
export const addLink = async (req, res) => {
  try {
    const { courseId, name, url, linkType } = req.body

    if (!courseId || !name || !url) {
      return res.status(400).json({ error: 'Course ID, name, and URL are required' })
    }

    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Create link record (stored in File model with isLink flag)
    const link = await File.create({
      name: name.trim(),
      url: url.trim(),
      isLink: true,
      linkType: linkType || 'note',
      courseId,
      userId: req.auth.userId,
      size: 0,
      mimeType: 'link'
    })

    res.status(201).json(link)
  } catch (error) {
    console.error('Add link error:', error)
    res.status(500).json({ error: error.message })
  }
}
