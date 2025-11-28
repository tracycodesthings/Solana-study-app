import { useState, useEffect } from 'react'
import { UserButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import EmptyState from '../components/EmptyState'

const API_URL = import.meta.env.VITE_API_URL || ''

function Dashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState(null)
  const [quizPerformance, setQuizPerformance] = useState([])
  const [coursePerformance, setCoursePerformance] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [weakAreas, setWeakAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  const getAuthToken = async () => {
    try {
      if (!window.Clerk?.session) {
        throw new Error('Not authenticated. Please sign in again.')
      }
      const token = await window.Clerk.session.getToken()
      if (!token) {
        throw new Error('Failed to get authentication token')
      }
      return token
    } catch (err) {
      console.error('Auth token error:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = await getAuthToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [statsRes, performanceRes, courseRes, activityRes, weakRes] = await Promise.all([
        axios.get(`${API_URL}/api/progress/dashboard`, { headers }),
        axios.get(`${API_URL}/api/progress/quiz-performance?days=14`, { headers }),
        axios.get(`${API_URL}/api/progress/course-performance`, { headers }),
        axios.get(`${API_URL}/api/progress/recent-activity?limit=5`, { headers }),
        axios.get(`${API_URL}/api/progress/weak-areas`, { headers })
      ])

      setStats(statsRes.data)
      setQuizPerformance(performanceRes.data)
      setCoursePerformance(courseRes.data)
      setRecentActivity(activityRes.data)
      setWeakAreas(weakRes.data)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return
    }

    setSearching(true)

    try {
      const token = await getAuthToken()
      const response = await axios.get(`${API_URL}/api/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSearchResults(response.data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Welcome, {user?.firstName || 'User'}!
                </span>
                <UserButton afterSignOutUrl="/sign-in" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 transition-all hover:shadow-xl"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Files</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.totalFiles || 0}</dd>
                    </dl>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 transition-all hover:shadow-xl"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Quizzes Taken</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.totalQuizzes || 0}</dd>
                    </dl>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 transition-all hover:shadow-xl"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Average Score</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.averageScore || 0}%</dd>
                    </dl>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 transition-all hover:shadow-xl"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Courses</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.totalCourses || 0}</dd>
                    </dl>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 transition-all hover:shadow-xl"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Study Streak</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.studyStreak || 0} days</dd>
                    </dl>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Quiz Performance Over Time */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiz Performance (Last 14 Days)</h3>
                {quizPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={quizPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" fontSize={12} stroke="#9CA3AF" />
                      <YAxis domain={[0, 100]} fontSize={12} stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="averageScore" stroke="#3B82F6" name="Avg Score" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-16">No quiz data yet. Start taking quizzes to see your progress!</p>
                )}
              </div>

              {/* Course Performance */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Performance</h3>
                {coursePerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={coursePerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="courseName" fontSize={12} stroke="#9CA3AF" />
                      <YAxis domain={[0, 100]} fontSize={12} stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="averageScore" fill="#10B981" name="Avg Score" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-16">No course data yet.</p>
                )}
              </div>
            </div>

            {/* Recent Activity & Weak Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                </div>
                <div className="p-6">
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map(activity => (
                        <div key={activity.id} className="flex items-center justify-between border-b dark:border-gray-700 pb-3 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{activity.quizTitle}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{activity.courseName}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(activity.completedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${activity.score >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {activity.score}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{activity.correctCount}/{activity.totalQuestions}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Weak Areas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Areas to Improve</h3>
                </div>
                <div className="p-6">
                  {weakAreas.length > 0 ? (
                    <div className="space-y-4">
                      {weakAreas.map((area, index) => (
                        <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                          <p className="font-medium text-gray-900 dark:text-white">{area.courseName}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{area.attemptsCount} attempts</p>
                            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{area.averageScore}%</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 Spend more time reviewing this course</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">Great job! All courses above 70%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 mb-8">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Search Your Materials</h3>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Search across all your files, quizzes, and courses
              </p>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for files, quizzes, courses..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || searchQuery.trim().length < 2}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Files ({searchResults.files.length})</h4>
                      <div className="space-y-2">
                        {searchResults.files.map(file => (
                          <div key={file.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{file.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{file.course}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quizzes */}
                  {searchResults.quizzes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Quizzes ({searchResults.quizzes.length})</h4>
                      <div className="space-y-2">
                        {searchResults.quizzes.map(quiz => (
                          <div key={quiz.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{quiz.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{quiz.course} • {quiz.questions} questions</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Courses */}
                  {searchResults.courses.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Courses ({searchResults.courses.length})</h4>
                      <div className="space-y-2">
                        {searchResults.courses.map(course => (
                          <div key={course.id} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{course.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{course.filesCount} files • {course.quizzesCount} quizzes</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchResults.files.length === 0 && searchResults.quizzes.length === 0 && searchResults.courses.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 mb-8">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    to="/files"
                    className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Upload Files
                      </span>
                    </div>
                  </Link>

                  <Link
                    to="/quizzes"
                    className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Take Quiz
                      </span>
                    </div>
                  </Link>

                  <Link
                    to="/tutor"
                    className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Smart Tutor
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activity yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by uploading your first file.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
