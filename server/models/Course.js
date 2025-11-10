import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  yearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Index for faster queries
courseSchema.index({ userId: 1, yearId: 1 })

export default mongoose.model('Course', courseSchema)
