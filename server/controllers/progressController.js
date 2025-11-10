import QuizAttempt from '../models/QuizAttempt.js'
import Quiz from '../models/Quiz.js'
import File from '../models/File.js'
import Course from '../models/Course.js'
import Year from '../models/Year.js'

// Get overall dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.auth.userId
    
    // Get all quiz attempts
    const attempts = await QuizAttempt.find({ userId })
      .sort({ completedAt: -1 })
      .limit(50)
    
    // Calculate statistics
    const totalQuizzes = attempts.length
    const averageScore = totalQuizzes > 0
      ? attempts.reduce((sum, a) => sum + a.score, 0) / totalQuizzes
      : 0
    
    // Get recent attempts (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentAttempts = attempts.filter(a => a.completedAt >= sevenDaysAgo)
    
    // Calculate study streak (consecutive days with activity)
    const studyDays = new Set()
    attempts.forEach(attempt => {
      const date = new Date(attempt.completedAt).toDateString()
      studyDays.add(date)
    })
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    while (true) {
      const dateStr = currentDate.toDateString()
      if (studyDays.has(dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (streak > 0) {
        break
      } else {
        // Check yesterday
        currentDate.setDate(currentDate.getDate() - 1)
        if (studyDays.has(currentDate.toDateString())) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          break
        }
      }
    }
    
    // Get total files and courses
    const totalFiles = await File.countDocuments({ userId })
    const totalCourses = await Course.countDocuments({ userId })
    
    res.json({
      totalQuizzes,
      averageScore: averageScore.toFixed(1),
      recentActivity: recentAttempts.length,
      studyStreak: streak,
      totalFiles,
      totalCourses
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get quiz performance over time (for chart)
export const getQuizPerformance = async (req, res) => {
  try {
    const userId = req.auth.userId
    const { days = 30 } = req.query
    
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(days))
    
    const attempts = await QuizAttempt.find({
      userId,
      completedAt: { $gte: daysAgo }
    })
      .sort({ completedAt: 1 })
      .populate('quizId', 'title')
    
    // Group by date
    const performanceByDate = {}
    attempts.forEach(attempt => {
      const date = new Date(attempt.completedAt).toLocaleDateString()
      if (!performanceByDate[date]) {
        performanceByDate[date] = {
          date,
          scores: [],
          count: 0
        }
      }
      performanceByDate[date].scores.push(attempt.score)
      performanceByDate[date].count++
    })
    
    // Calculate average for each date
    const performance = Object.values(performanceByDate).map(day => ({
      date: day.date,
      averageScore: (day.scores.reduce((a, b) => a + b, 0) / day.count).toFixed(1),
      quizzesTaken: day.count
    }))
    
    res.json(performance)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get course-wise performance
export const getCoursePerformance = async (req, res) => {
  try {
    const userId = req.auth.userId
    
    const attempts = await QuizAttempt.find({ userId })
      .populate('courseId', 'name')
    
    // Group by course
    const courseStats = {}
    attempts.forEach(attempt => {
      const courseId = attempt.courseId?._id.toString()
      const courseName = attempt.courseId?.name || 'Unknown'
      
      if (!courseStats[courseId]) {
        courseStats[courseId] = {
          courseName,
          scores: [],
          totalQuizzes: 0
        }
      }
      
      courseStats[courseId].scores.push(attempt.score)
      courseStats[courseId].totalQuizzes++
    })
    
    // Calculate averages
    const performance = Object.values(courseStats).map(course => ({
      courseName: course.courseName,
      averageScore: (course.scores.reduce((a, b) => a + b, 0) / course.scores.length).toFixed(1),
      totalQuizzes: course.totalQuizzes,
      highestScore: Math.max(...course.scores).toFixed(1),
      lowestScore: Math.min(...course.scores).toFixed(1)
    }))
    
    res.json(performance)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get recent activity
export const getRecentActivity = async (req, res) => {
  try {
    const userId = req.auth.userId
    const { limit = 10 } = req.query
    
    const attempts = await QuizAttempt.find({ userId })
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .populate('quizId', 'title')
      .populate('courseId', 'name')
    
    const activity = attempts.map(attempt => ({
      id: attempt._id,
      quizTitle: attempt.quizId?.title || 'Deleted Quiz',
      courseName: attempt.courseId?.name || 'Unknown Course',
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      completedAt: attempt.completedAt
    }))
    
    res.json(activity)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get weak areas (topics with low scores)
export const getWeakAreas = async (req, res) => {
  try {
    const userId = req.auth.userId
    
    const attempts = await QuizAttempt.find({ userId })
      .populate('courseId', 'name')
    
    // Find courses with average score below 70%
    const courseStats = {}
    attempts.forEach(attempt => {
      const courseId = attempt.courseId?._id.toString()
      const courseName = attempt.courseId?.name || 'Unknown'
      
      if (!courseStats[courseId]) {
        courseStats[courseId] = {
          courseName,
          scores: []
        }
      }
      
      courseStats[courseId].scores.push(attempt.score)
    })
    
    const weakAreas = Object.values(courseStats)
      .map(course => ({
        courseName: course.courseName,
        averageScore: (course.scores.reduce((a, b) => a + b, 0) / course.scores.length).toFixed(1),
        attemptsCount: course.scores.length
      }))
      .filter(course => course.averageScore < 70)
      .sort((a, b) => a.averageScore - b.averageScore)
    
    res.json(weakAreas)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
