import { UserButton } from '@clerk/clerk-react'
import Sidebar from './Sidebar'

function QuizResults({ results, quiz, onBack }) {
  const scorePercentage = parseFloat(results.score)
  const isPassing = scorePercentage >= 60

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Score Card */}
            <div className={`bg-white rounded-lg shadow-lg p-8 mb-6 border-t-4 ${
              isPassing ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {quiz.title}
                </h3>
                <p className="text-gray-600">Quiz Complete!</p>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-4xl font-bold text-blue-600 mb-2">
                    {scorePercentage}%
                  </p>
                  <p className="text-sm text-gray-600">Your Score</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-4xl font-bold text-green-600 mb-2">
                    {results.correctCount}
                  </p>
                  <p className="text-sm text-gray-600">Correct Answers</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {results.totalQuestions}
                  </p>
                  <p className="text-sm text-gray-600">Total Questions</p>
                </div>
              </div>

              <div className="text-center">
                {isPassing ? (
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Great job! You passed!
                  </div>
                ) : (
                  <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Keep practicing!
                  </div>
                )}
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
                      result.isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
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

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default QuizResults
