import Quiz from '../models/Quiz.js'
import UploadedQuiz from '../models/UploadedQuiz.js'
import QuizAttempt from '../models/QuizAttempt.js'
import Course from '../models/Course.js'
import File from '../models/File.js'
import fs from 'fs/promises'
import path from 'path'

// Simple quiz generation from text content
const extractQuestionsFromText = (text) => {
  const questions = []
  
  // Simple pattern matching for common question formats
  // MCQ: Look for questions with options A, B, C, D
  const mcqPattern = /(\d+\.?\s*.*?\?)\s*(?:A[\)\.:]?\s*(.*?)\s*B[\)\.:]?\s*(.*?)\s*C[\)\.:]?\s*(.*?)\s*D[\)\.:]?\s*(.*?))/gi
  let match
  
  while ((match = mcqPattern.exec(text)) !== null && questions.length < 10) {
    questions.push({
      type: 'MCQ',
      question: match[1].trim(),
      options: [
        match[2].trim(),
        match[3].trim(),
        match[4].trim(),
        match[5].trim()
      ],
      correctAnswer: match[2].trim(), // Default to first option
      explanation: 'Review your notes for detailed explanation'
    })
  }
  
  // If no MCQs found, create generic questions from headings/important text
  if (questions.length === 0) {
    const lines = text.split('\n').filter(line => line.trim().length > 10)
    const sampleLines = lines.slice(0, 5)
    
    sampleLines.forEach((line, index) => {
      if (line.includes('?')) {
        questions.push({
          type: 'SAQ',
          question: line.trim(),
          options: [],
          correctAnswer: 'See notes for answer',
          explanation: 'This question was extracted from your notes'
        })
      }
    })
  }
  
  return questions
}

// Generate quiz from notes
export const generateQuiz = async (req, res) => {
  try {
    const { fileId, courseId } = req.body
    
    if (!fileId || !courseId) {
      return res.status(400).json({ error: 'File ID and Course ID are required' })
    }
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    
    // Get file
    const file = await File.findOne({ _id: fileId, userId: req.auth.userId })
    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }
    
    // Read file content (only for text files for now)
    let content = ''
    try {
      const filePath = path.join(process.cwd(), file.url)
      content = await fs.readFile(filePath, 'utf-8')
    } catch (err) {
      return res.status(400).json({ error: 'Cannot read file. Only text files are supported for quiz generation.' })
    }
    
    // Extract questions
    const questions = extractQuestionsFromText(content)
    
    if (questions.length === 0) {
      return res.status(400).json({ error: 'No questions could be extracted from this file. Try uploading a file with clear questions and options.' })
    }
    
    // Create quiz
    const quiz = await Quiz.create({
      title: `Quiz from ${file.name}`,
      courseId,
      userId: req.auth.userId,
      questions,
      generatedFrom: file.name
    })
    
    res.status(201).json(quiz)
  } catch (error) {
    console.error('Quiz generation error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get quizzes by course (both generated and uploaded)
export const getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    
    // Get auto-generated quizzes
    const generatedQuizzes = await Quiz.find({ 
      courseId, 
      userId: req.auth.userId 
    }).sort({ createdAt: -1 })
    
    // Get uploaded quizzes
    const uploadedQuizzes = await UploadedQuiz.find({ 
      courseId, 
      userId: req.auth.userId 
    }).sort({ uploadedAt: -1 })
    
    res.json({
      generated: generatedQuizzes,
      uploaded: uploadedQuizzes
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get single quiz
export const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    
    const quiz = await Quiz.findOne({ 
      _id: quizId, 
      userId: req.auth.userId 
    })
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    
    res.json(quiz)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Submit quiz (for Phase 5 - Quiz Player)
export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    const { answers } = req.body
    
    const quiz = await Quiz.findOne({ _id: quizId, userId: req.auth.userId })
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    
    // Calculate score
    let correctCount = 0
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index]
      const isCorrect = userAnswer === question.correctAnswer
      if (isCorrect) correctCount++
      
      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      }
    })
    
    const score = (correctCount / quiz.questions.length) * 100
    
    // Save quiz attempt for progress tracking
    await QuizAttempt.create({
      userId: req.auth.userId,
      quizId: quiz._id,
      courseId: quiz.courseId,
      score: parseFloat(score.toFixed(2)),
      correctCount,
      totalQuestions: quiz.questions.length,
      answers: results
    })
    
    res.json({
      score: score.toFixed(2),
      correctCount,
      totalQuestions: quiz.questions.length,
      results
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Upload manual quiz
export const uploadManualQuiz = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const { courseId, title, type } = req.body
    
    if (!courseId || !title) {
      await fs.unlink(req.file.path)
      return res.status(400).json({ error: 'Course ID and title are required' })
    }
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      await fs.unlink(req.file.path)
      return res.status(404).json({ error: 'Course not found' })
    }
    
    // Create uploaded quiz record
    const uploadedQuiz = await UploadedQuiz.create({
      title: title.trim(),
      type: type || 'Past Paper',
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      courseId,
      userId: req.auth.userId
    })
    
    res.status(201).json(uploadedQuiz)
  } catch (error) {
    console.error('Upload quiz error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    
    const quiz = await Quiz.findOne({ _id: quizId, userId: req.auth.userId })
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    
    await Quiz.deleteOne({ _id: quizId })
    res.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
