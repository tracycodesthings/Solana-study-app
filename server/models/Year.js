import mongoose from 'mongoose'

const yearSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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

// Index for faster queries by user
yearSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('Year', yearSchema)
