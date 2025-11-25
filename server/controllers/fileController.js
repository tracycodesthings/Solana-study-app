import File from '../models/File.js'
import Course from '../models/Course.js'
import { cloudinary, hasCloudinaryConfig } from '../config/cloudinary.js'
import fs from 'fs/promises'
import path from 'path'

// Upload file
export const uploadFile = async (req, res) => {
  try {
    // Ensure uploads directory exists for local storage
    if (!hasCloudinaryConfig) {
      const uploadsDir = process.env.UPLOAD_DIR || './uploads'
      try {
        await fs.access(uploadsDir)
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true })
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { courseId } = req.body
    if (!courseId) {
      // Cleanup uploaded file if validation fails
      if (hasCloudinaryConfig && cloudinary && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename).catch(err => 
          console.error('Cloudinary cleanup error:', err)
        )
      } else if (!hasCloudinaryConfig && req.file.path) {
        await fs.unlink(req.file.path).catch(err => 
          console.error('Local file cleanup error:', err)
        )
      }
      return res.status(400).json({ error: 'Course ID is required' })
    }

    // Verify course exists and belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      // Cleanup uploaded file if course not found
      if (hasCloudinaryConfig && cloudinary && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename).catch(err => 
          console.error('Cloudinary cleanup error:', err)
        )
      } else if (!hasCloudinaryConfig && req.file.path) {
        await fs.unlink(req.file.path).catch(err => 
          console.error('Local file cleanup error:', err)
        )
      }
      return res.status(404).json({ error: 'Course not found' })
    }

    // Determine file URL based on storage type
    const fileUrl = hasCloudinaryConfig 
      ? req.file.path // Cloudinary URL
      : `/uploads/${req.file.filename}` // Local path

    // Create file record
    const file = await File.create({
      name: req.file.originalname,
      originalName: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      mimeType: req.file.mimetype,
      courseId,
      userId: req.auth.userId,
      cloudinaryId: hasCloudinaryConfig ? req.file.filename : undefined
    })

    res.status(201).json(file)
  } catch (error) {
    console.error('Upload error:', error)
    console.error('Error stack:', error.stack)
    console.error('Request file:', req.file)
    console.error('Request body:', req.body)
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
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

    // Delete physical file if it's not a link
    if (!file.isLink) {
      if (hasCloudinaryConfig && file.cloudinaryId && cloudinary) {
        // Delete from Cloudinary
        try {
          await cloudinary.uploader.destroy(file.cloudinaryId)
        } catch (err) {
          console.error('Error deleting from Cloudinary:', err)
        }
      } else if (!hasCloudinaryConfig) {
        // Delete from local storage
        const filePath = path.join(process.cwd(), file.url)
        try {
          await fs.unlink(filePath)
        } catch (err) {
          console.error('Error deleting local file:', err)
        }
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
