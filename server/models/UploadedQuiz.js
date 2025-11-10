import mongoose from 'mongoose'

const uploadedQuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Past Paper', 'Practice Quiz', 'Mock Exam', 'Other'],
    default: 'Past Paper'
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
})

uploadedQuizSchema.index({ userId: 1, courseId: 1, uploadedAt: -1 })

export default mongoose.model('UploadedQuiz', uploadedQuizSchema)
