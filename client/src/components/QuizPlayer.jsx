import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import axios from 'axios'
import Sidebar from './Sidebar'
import QuizResults from './QuizResults'

const API_URL = import.meta.env.VITE_API_URL || ''

function QuizPlayer() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getAuthToken = async () => {
    return await window.Clerk.session.getToken()
  }

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      const token = await getAuthToken()
      const response = await axios.get(`${API_URL}/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Quiz data received from backend:', response.data)
      setQuiz(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load quiz:', err)
      setError('Failed to load quiz')
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer) => {
    setAnswers({
      ...answers,
      [currentQuestion]: answer
    })
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      if (!confirm('You have unanswered questions. Submit anyway?')) {
        return
      }
    }

    setLoading(true)
    try {
      const token = await getAuthToken()
      const answersArray = quiz.questions.map((_, index) => answers[index] || '')
      
      const response = await axios.post(`${API_URL}/api/quizzes/${quizId}/submit`, {
        answers: answersArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setResults(response.data)
      setShowResults(true)
    } catch (err) {
      console.error('Failed to submit quiz:', err)
      setError('Failed to submit quiz')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading quiz...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/quizzes')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    )
  }

  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No quiz data available.</p>
          <button
            onClick={() => navigate('/quizzes')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    )
  }

  if (showResults) {
    return <QuizResults results={results} quiz={quiz} onBack={() => navigate('/quizzes')} />
  }

  const question = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </p>
              </div>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-8 mb-6">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
                  {question.type}
                </span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {question.question}
                </h3>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {question.type === 'MCQ' && question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      answers[currentQuestion] === option
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 mr-3 ${
                        answers[currentQuestion] === option ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 text-gray-900 dark:text-white">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {currentQuestion === quiz.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>

            {/* Answer Summary */}
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Progress</h4>
              <p className="text-sm text-gray-600">
                Answered: {Object.keys(answers).length} / {quiz.questions.length}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default QuizPlayer
