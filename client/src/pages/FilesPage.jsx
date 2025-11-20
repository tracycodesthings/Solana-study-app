import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/clerk-react'
import Sidebar from '../components/Sidebar'
import FileUpload from '../components/FileUpload'
import { getYears, createYear, deleteYear, getCourses, createCourse, deleteCourse, getFiles, deleteFile, renameFile, addLink } from '../Api/files'

function FilesPage() {
  const [years, setYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showYearModal, setShowYearModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [newYearName, setNewYearName] = useState('')
  const [newCourseName, setNewCourseName] = useState('')
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState('note')

  useEffect(() => {
    loadYears()
  }, [])

  const loadYears = async () => {
    try {
      const data = await getYears()
      setYears(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading years:', error)
      setLoading(false)
    }
  }

  const loadCourses = async (yearId) => {
    try {
      const data = await getCourses(yearId)
      setCourses(data)
      setSelectedYear(yearId)
      setSelectedCourse(null)
      setFiles([])
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const loadFiles = async (courseId) => {
    try {
      const data = await getFiles(courseId)
      setFiles(data)
      setSelectedCourse(courseId)
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const handleCreateYear = async (e) => {
    e.preventDefault()
    console.log('Creating year:', newYearName)
    try {
      const result = await createYear(newYearName)
      console.log('Year created:', result)
      setNewYearName('')
      setShowYearModal(false)
      loadYears()
    } catch (error) {
      console.error('Error creating year:', error)
      alert('Failed to create year: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    if (!selectedYear) return
    try {
      await createCourse(newCourseName, selectedYear)
      setNewCourseName('')
      setShowCourseModal(false)
      loadCourses(selectedYear)
    } catch (error) {
      console.error('Error creating course:', error)
    }
  }

  const handleDeleteYear = async (yearId) => {
    if (!confirm('Delete this year and all its courses?')) return
    try {
      await deleteYear(yearId)
      loadYears()
      setSelectedYear(null)
      setCourses([])
      setFiles([])
    } catch (error) {
      console.error('Error deleting year:', error)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course and all its files?')) return
    try {
      await deleteCourse(courseId)
      loadCourses(selectedYear)
      setSelectedCourse(null)
      setFiles([])
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return
    try {
      await deleteFile(fileId)
      loadFiles(selectedCourse)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const handleFileUploaded = () => {
    setShowUploadModal(false)
    if (selectedCourse) {
      loadFiles(selectedCourse)
    }
  }

  const handleAddLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) {
      alert('Please provide both name and URL')
      return
    }
    
    try {
      await addLink(selectedCourse, linkName, linkUrl, linkType)
      setShowLinkModal(false)
      setLinkName('')
      setLinkUrl('')
      setLinkType('note')
      loadFiles(selectedCourse)
    } catch (error) {
      console.error('Error adding link:', error)
      alert('Failed to add link: ' + (error.response?.data?.error || error.message))
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Files & Folders</h2>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Years Column */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Years</h3>
                  <button
                    onClick={() => setShowYearModal(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    + Add Year
                  </button>
                </div>
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
                  ) : years.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No years yet</p>
                  ) : (
                    years.map((year) => (
                      <div
                        key={year._id}
                        className={`p-3 rounded cursor-pointer flex justify-between items-center transition-colors ${
                          selectedYear === year._id ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => loadCourses(year._id)}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{year.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteYear(year._id)
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Courses Column */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Courses</h3>
                  <button
                    onClick={() => setShowCourseModal(true)}
                    disabled={!selectedYear}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedYear
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    + Add Course
                  </button>
                </div>
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {!selectedYear ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Select a year first</p>
                  ) : courses.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No courses yet</p>
                  ) : (
                    courses.map((course) => (
                      <div
                        key={course._id}
                        className={`p-3 rounded cursor-pointer flex justify-between items-center transition-colors ${
                          selectedCourse === course._id ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => loadFiles(course._id)}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{course.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCourse(course._id)
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Files Column */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Files & Links</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      disabled={!selectedCourse}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedCourse
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      + Upload File
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {!selectedCourse ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Select a course first</p>
                  ) : files.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No files yet</p>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file._id}
                        className="p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center transition-colors"
                      >
                        <div className="flex-1">
                          {file.isLink ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600 dark:text-blue-400">🔗</span>
                                <a 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {file.name}
                                </a>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">{file.linkType === 'note' ? 'Note' : 'Past Paper'}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-sm text-gray-900 dark:text-white">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowYearModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add New Year</h3>
            <form onSubmit={handleCreateYear}>
              <input
                type="text"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                placeholder="e.g., Year 1, 2024-2025"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCourseModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add New Course</h3>
            <form onSubmit={handleCreateCourse}>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="e.g., Mathematics, Physics"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && selectedCourse && (
        <FileUpload
          courseId={selectedCourse}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleFileUploaded}
        />
      )}

    </div>
  )
}

export default FilesPage
