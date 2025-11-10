import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/clerk-react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

function QuizPage() {
  const [years, setYears] = useState([])
  const [courses, setCourses] = useState([])
  const [quizzes, setQuizzes] = useState({ generated: [], uploaded: [] })
  const [files, setFiles] = useState([])
  
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadType, setUploadType] = useState('Past Paper')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getAuthToken = async () => {
    return await window.Clerk.session.getToken()
  }

  useEffect(() => {
    fetchYears()
  }, [])

  useEffect(() => {
    if (selectedYear) {
      fetchCourses(selectedYear)
    } else {
      setCourses([])
      setSelectedCourse(null)
    }
  }, [selectedYear])

  useEffect(() => {
    if (selectedCourse) {
      fetchQuizzes(selectedCourse)
      fetchFiles(selectedCourse)
    } else {
      setQuizzes({ generated: [], uploaded: [] })
      setFiles([])
    }
  }, [selectedCourse])

  const fetchYears = async () => {
    try {
      const token = await getAuthToken()
      const response = await axios.get('/api/structure/years', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setYears(response.data)
    } catch (err) {
      setError('Failed to load years')
    }
  }

  const fetchCourses = async (yearId) => {
    try {
      const token = await getAuthToken()
      const response = await axios.get(`/api/structure/years/${yearId}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCourses(response.data)
    } catch (err) {
      setError('Failed to load courses')
    }
  }

  const fetchQuizzes = async (courseId) => {
    try {
      const token = await getAuthToken()
      const response = await axios.get(`/api/quizzes/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQuizzes(response.data)
    } catch (err) {
      setError('Failed to load quizzes')
    }
  }

  const fetchFiles = async (courseId) => {
    try {
      const token = await getAuthToken()
      const response = await axios.get(`/api/files/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFiles(response.data)
    } catch (err) {
      console.error('Failed to load files:', err)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = await getAuthToken()
      await axios.post('/api/quizzes/generate', {
        fileId: selectedFile,
        courseId: selectedCourse
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setShowGenerateModal(false)
      setSelectedFile(null)
      fetchQuizzes(selectedCourse)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadQuiz = async () => {
    if (!uploadFile || !uploadTitle) {
      setError('Please provide file and title')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = await getAuthToken()
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('courseId', selectedCourse)
      formData.append('title', uploadTitle)
      formData.append('type', uploadType)

      await axios.post('/api/quizzes/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setShowUploadModal(false)
      setUploadFile(null)
      setUploadTitle('')
      fetchQuizzes(selectedCourse)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Delete this quiz?')) return

    try {
      const token = await getAuthToken()
      await axios.delete(`/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchQuizzes(selectedCourse)
    } catch (err) {
      setError('Failed to delete quiz')
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-bold text-gray-900">Quizzes</h2>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-6">
              {/* Years Column */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Select Year</h3>
                <div className="space-y-2">
                  {years.map(year => (
                    <button
                      key={year._id}
                      onClick={() => setSelectedYear(year._id)}
                      className={`w-full text-left px-4 py-2 rounded transition ${
                        selectedYear === year._id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {year.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Courses Column */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Select Course</h3>
                {!selectedYear ? (
                  <p className="text-gray-500 text-sm">Select a year first</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map(course => (
                      <button
                        key={course._id}
                        onClick={() => setSelectedCourse(course._id)}
                        className={`w-full text-left px-4 py-2 rounded transition ${
                          selectedCourse === course._id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {course.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quizzes Column */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Quizzes</h3>
                  {selectedCourse && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Generate
                      </button>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Upload
                      </button>
                    </div>
                  )}
                </div>

                {!selectedCourse ? (
                  <p className="text-gray-500 text-sm">Select a course first</p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {/* Generated Quizzes */}
                    {quizzes.generated.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Auto-Generated</h4>
                        <div className="space-y-2">
                          {quizzes.generated.map(quiz => (
                            <div key={quiz._id} className="border rounded p-3 hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{quiz.title}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {quiz.totalQuestions} questions • {new Date(quiz.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button className="text-blue-600 hover:text-blue-700 text-sm">
                                    Take Quiz
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuiz(quiz._id)}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Quizzes */}
                    {quizzes.uploaded.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Papers</h4>
                        <div className="space-y-2">
                          {quizzes.uploaded.map(quiz => (
                            <div key={quiz._id} className="border rounded p-3 hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{quiz.title}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {quiz.type} • {new Date(quiz.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <a
                                  href={quiz.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  View
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {quizzes.generated.length === 0 && quizzes.uploaded.length === 0 && (
                      <p className="text-gray-500 text-sm">No quizzes yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Generate Quiz Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Generate Quiz</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <select
                value={selectedFile || ''}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Choose a file...</option>
                {files.map(file => (
                  <option key={file._id} value={file._id}>
                    {file.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Only text files are supported for quiz generation
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateQuiz}
                disabled={loading || !selectedFile}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Quiz Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Upload Past Paper</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., 2023 Final Exam"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option>Past Paper</option>
                  <option>Practice Quiz</option>
                  <option>Mock Exam</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadQuiz}
                disabled={loading || !uploadFile || !uploadTitle}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizPage
