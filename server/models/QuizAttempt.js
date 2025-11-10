import mongoose from 'mongoose'

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  correctCount: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  answers: [{
    question: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
})

// Index for efficient queries
quizAttemptSchema.index({ userId: 1, completedAt: -1 })
quizAttemptSchema.index({ courseId: 1, completedAt: -1 })

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema)

export default QuizAttempt
