import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MCQ', 'SAQ'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String
  }
})

const quizSchema = new mongoose.Schema({
  title: {
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
  questions: [questionSchema],
  totalQuestions: {
    type: Number,
    default: 0
  },
  generatedFrom: {
    type: String // File name or source
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Update totalQuestions before saving
quizSchema.pre('save', function(next) {
  this.totalQuestions = this.questions.length
  next()
})

quizSchema.index({ userId: 1, courseId: 1, createdAt: -1 })

export default mongoose.model('Quiz', quizSchema)
