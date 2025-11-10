import File from '../models/File.js'
import Quiz from '../models/Quiz.js'
import Course from '../models/Course.js'
import Year from '../models/Year.js'

// Global search across files and quizzes
export const globalSearch = async (req, res) => {
  try {
    const { query } = req.query
    const userId = req.auth.userId

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }

    const searchRegex = new RegExp(query, 'i')

    // Search files by name
    const files = await File.find({
      userId,
      name: searchRegex
    })
      .populate('courseId', 'name')
      .limit(10)

    // Search quizzes by title
    const quizzes = await Quiz.find({
      userId,
      title: searchRegex
    })
      .populate('courseId', 'name')
      .limit(10)

    // Search courses by name
    const courses = await Course.find({
      userId,
      name: searchRegex
    })
      .populate('yearId', 'name')
      .limit(10)

    res.json({
      files: files.map(f => ({
        id: f._id,
        name: f.name,
        type: 'file',
        course: f.courseId?.name || 'Unknown',
        uploadedAt: f.uploadedAt
      })),
      quizzes: quizzes.map(q => ({
        id: q._id,
        title: q.title,
        type: 'quiz',
        course: q.courseId?.name || 'Unknown',
        questions: q.totalQuestions,
        createdAt: q.createdAt
      })),
      courses: courses.map(c => ({
        id: c._id,
        name: c.name,
        type: 'course',
        year: c.yearId?.name || 'Unknown'
      }))
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Search within a specific course
export const searchInCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    const { query } = req.query
    const userId = req.auth.userId

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }

    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    const searchRegex = new RegExp(query, 'i')

    const files = await File.find({
      courseId,
      userId,
      name: searchRegex
    })

    const quizzes = await Quiz.find({
      courseId,
      userId,
      title: searchRegex
    })

    res.json({
      courseName: course.name,
      files,
      quizzes
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Generate mixed paper from multiple courses
export const generateMixedPaper = async (req, res) => {
  try {
    const { courseIds, questionsPerCourse = 5 } = req.body
    const userId = req.auth.userId

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ error: 'At least one course must be selected' })
    }

    const mixedQuestions = []
    
    for (const courseId of courseIds) {
      // Get all quizzes for this course
      const quizzes = await Quiz.find({ courseId, userId })
      
      if (quizzes.length === 0) continue

      // Collect all questions from all quizzes in this course
      const allQuestions = []
      quizzes.forEach(quiz => {
        quiz.questions.forEach(q => {
          allQuestions.push({
            ...q.toObject(),
            sourceCourse: quiz.courseId,
            sourceQuiz: quiz.title
          })
        })
      })

      // Randomly select questions
      const shuffled = allQuestions.sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, parseInt(questionsPerCourse))
      mixedQuestions.push(...selected)
    }

    if (mixedQuestions.length === 0) {
      return res.status(400).json({ error: 'No questions found in selected courses' })
    }

    // Shuffle the final mixed questions
    const finalQuestions = mixedQuestions.sort(() => 0.5 - Math.random())

    // Get course names for reference
    const courses = await Course.find({ _id: { $in: courseIds }, userId }).select('name')
    const courseNames = courses.map(c => c.name).join(', ')

    res.json({
      title: `Mixed Paper: ${courseNames}`,
      totalQuestions: finalQuestions.length,
      questions: finalQuestions,
      courses: courseNames
    })
  } catch (error) {
    console.error('Mixed paper error:', error)
    res.status(500).json({ error: error.message })
  }
}
