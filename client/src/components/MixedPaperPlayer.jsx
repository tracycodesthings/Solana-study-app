import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import Sidebar from './Sidebar'

function MixedPaperPlayer() {
  const navigate = useNavigate()
  const [paperData, setPaperData] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)

  useEffect(() => {
    const storedData = sessionStorage.getItem('mixedPaper')
    if (storedData) {
      setPaperData(JSON.parse(storedData))
    } else {
      navigate('/mixed-papers')
    }
  }, [navigate])

  if (!paperData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading mixed paper...</p>
      </div>
    )
  }

  const handleAnswerSelect = (answer) => {
    setAnswers({
      ...answers,
      [currentQuestion]: answer
    })
  }

  const handleNext = () => {
    if (currentQuestion < paperData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    if (Object.keys(answers).length < paperData.questions.length) {
      if (!confirm('You have unanswered questions. Submit anyway?')) {
        return
      }
    }

    // Calculate results
    let correctCount = 0
    const resultDetails = paperData.questions.map((question, index) => {
      const userAnswer = answers[index] || ''
      const isCorrect = userAnswer === question.correctAnswer
      if (isCorrect) correctCount++

      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        sourceQuiz: question.sourceQuiz
      }
    })

    const score = (correctCount / paperData.questions.length) * 100

    setResults({
      score: score.toFixed(2),
      correctCount,
      totalQuestions: paperData.questions.length,
      results: resultDetails
    })
    setShowResults(true)
  }

  if (showResults) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h2 className="text-2xl font-bold text-gray-900">Mixed Paper Results</h2>
                <UserButton afterSignOutUrl="/sign-in" />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Score Card */}
              <div className={`bg-white rounded-lg shadow-lg p-8 mb-6 border-t-4 ${
                parseFloat(results.score) >= 60 ? 'border-green-500' : 'border-red-500'
              }`}>
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{paperData.title}</h3>
                  <p className="text-gray-600">Paper Complete!</p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-4xl font-bold text-blue-600 mb-2">{results.score}%</p>
                    <p className="text-sm text-gray-600">Your Score</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-4xl font-bold text-green-600 mb-2">{results.correctCount}</p>
                    <p className="text-sm text-gray-600">Correct Answers</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-4xl font-bold text-gray-900 mb-2">{results.totalQuestions}</p>
                    <p className="text-sm text-gray-600">Total Questions</p>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Review Answers</h3>
                
                <div className="space-y-6">
                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      className={`border-l-4 p-4 rounded-r-lg ${
                        result.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <span className="mr-2">Question {index + 1}</span>
                          {result.isCorrect ? (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </h4>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2">From: {result.sourceQuiz}</p>
                      <p className="text-gray-700 mb-3">{result.question}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Your answer: </span>
                          <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                            {result.userAnswer || '(Not answered)'}
                          </span>
                        </div>
                        
                        {!result.isCorrect && (
                          <div>
                            <span className="font-medium text-gray-700">Correct answer: </span>
                            <span className="text-green-700">{result.correctAnswer}</span>
                          </div>
                        )}
                        
                        {result.explanation && (
                          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                            <span className="font-medium text-gray-700">Explanation: </span>
                            <span className="text-gray-600">{result.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/mixed-papers')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Another Paper
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const question = paperData.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / paperData.questions.length) * 100

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{paperData.title}</h2>
                <p className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of {paperData.questions.length}
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {question.type}
                  </span>
                  <span className="text-xs text-gray-500">From: {question.sourceQuiz}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {question.question}
                </h3>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {question.type === 'MCQ' ? (
                  question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        answers[currentQuestion] === option
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 mr-3 ${
                          answers[currentQuestion] === option ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <textarea
                    value={answers[currentQuestion] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    rows="6"
                  />
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {paperData.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-full text-sm font-medium ${
                      index === currentQuestion
                        ? 'bg-purple-600 text-white'
                        : answers[index]
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestion === paperData.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit Paper
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Next
                </button>
              )}
            </div>

            {/* Answer Summary */}
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Progress</h4>
              <p className="text-sm text-gray-600">
                Answered: {Object.keys(answers).length} / {paperData.questions.length}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MixedPaperPlayer
