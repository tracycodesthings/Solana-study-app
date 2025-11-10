import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

function MixedPapers() {
  const navigate = useNavigate()
  const [years, setYears] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [questionsPerCourse, setQuestionsPerCourse] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  const getAuthToken = async () => {
    return await window.Clerk.session.getToken()
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = await getAuthToken()
      
      // Fetch years
      const yearsRes = await axios.get('/api/structure/years', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setYears(yearsRes.data)

      // Fetch all courses
      const allCourses = []
      for (const year of yearsRes.data) {
        const coursesRes = await axios.get(`/api/structure/years/${year._id}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        allCourses.push(...coursesRes.data.map(c => ({ ...c, yearName: year.name })))
      }
      setCourses(allCourses)
    } catch (err) {
      setError('Failed to load courses')
    }
  }

  const handleCourseToggle = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handleGenerateMixedPaper = async () => {
    if (selectedCourses.length === 0) {
      setError('Please select at least one course')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = await getAuthToken()
      const response = await axios.post('/api/search/mixed-paper', {
        courseIds: selectedCourses,
        questionsPerCourse
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Store mixed paper data and navigate to a quiz-like interface
      sessionStorage.setItem('mixedPaper', JSON.stringify(response.data))
      navigate('/mixed-paper-player')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate mixed paper')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Search query must be at least 2 characters')
      return
    }

    setSearching(true)
    setError('')

    try {
      const token = await getAuthToken()
      const response = await axios.get(`/api/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSearchResults(response.data)
    } catch (err) {
      setError('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const groupedCourses = years.map(year => ({
    year: year.name,
    courses: courses.filter(c => c.yearId === year._id)
  })).filter(group => group.courses.length > 0)

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mixed Papers & Search</h2>
                <p className="text-sm text-gray-600">Generate custom practice papers and search your materials</p>
              </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mixed Paper Generator */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Generate Mixed Paper</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Select multiple courses to create a comprehensive practice paper with mixed questions
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Questions per course
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={questionsPerCourse}
                    onChange={(e) => setQuestionsPerCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="mb-4 max-h-96 overflow-y-auto border border-gray-200 rounded p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Courses ({selectedCourses.length} selected)
                  </label>
                  
                  {groupedCourses.map(group => (
                    <div key={group.year} className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{group.year}</h4>
                      <div className="space-y-2 ml-4">
                        {group.courses.map(course => (
                          <label key={course._id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedCourses.includes(course._id)}
                              onChange={() => handleCourseToggle(course._id)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{course.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {groupedCourses.length === 0 && (
                    <p className="text-gray-500 text-sm">No courses available yet</p>
                  )}
                </div>

                <button
                  onClick={handleGenerateMixedPaper}
                  disabled={loading || selectedCourses.length === 0}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Generating...' : `Generate Mixed Paper (${selectedCourses.length} courses)`}
                </button>
              </div>

              {/* Global Search */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Search Materials</h3>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Search across all your files, quizzes, and courses
                </p>

                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for files, quizzes, courses..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Search Results */}
                {searchResults && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {/* Files */}
                    {searchResults.files.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Files ({searchResults.files.length})</h4>
                        <div className="space-y-2">
                          {searchResults.files.map(file => (
                            <div key={file.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                              <p className="font-medium text-sm text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-600">{file.course}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quizzes */}
                    {searchResults.quizzes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Quizzes ({searchResults.quizzes.length})</h4>
                        <div className="space-y-2">
                          {searchResults.quizzes.map(quiz => (
                            <div key={quiz.id} className="p-3 bg-green-50 rounded border border-green-200">
                              <p className="font-medium text-sm text-gray-900">{quiz.title}</p>
                              <p className="text-xs text-gray-600">{quiz.course} • {quiz.questions} questions</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Courses */}
                    {searchResults.courses.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Courses ({searchResults.courses.length})</h4>
                        <div className="space-y-2">
                          {searchResults.courses.map(course => (
                            <div key={course.id} className="p-3 bg-purple-50 rounded border border-purple-200">
                              <p className="font-medium text-sm text-gray-900">{course.name}</p>
                              <p className="text-xs text-gray-600">{course.year}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.files.length === 0 && searchResults.quizzes.length === 0 && searchResults.courses.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No results found</p>
                    )}
                  </div>
                )}

                {!searchResults && (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p>Start typing to search</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MixedPapers
