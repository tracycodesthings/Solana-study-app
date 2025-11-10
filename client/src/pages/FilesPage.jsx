import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/clerk-react'
import Sidebar from '../components/Sidebar'
import FileUpload from '../components/FileUpload'
import { getYears, createYear, deleteYear, getCourses, createCourse, deleteCourse, getFiles, deleteFile, renameFile } from '../Api/files'

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
  const [newYearName, setNewYearName] = useState('')
  const [newCourseName, setNewCourseName] = useState('')

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
    try {
      await createYear(newYearName)
      setNewYearName('')
      setShowYearModal(false)
      loadYears()
    } catch (error) {
      console.error('Error creating year:', error)
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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-bold text-gray-900">Files & Folders</h2>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Years Column */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Years</h3>
                  <button
                    onClick={() => setShowYearModal(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    + Add Year
                  </button>
                </div>
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    <p className="text-gray-500 text-sm">Loading...</p>
                  ) : years.length === 0 ? (
                    <p className="text-gray-500 text-sm">No years yet</p>
                  ) : (
                    years.map((year) => (
                      <div
                        key={year._id}
                        className={`p-3 rounded cursor-pointer flex justify-between items-center ${
                          selectedYear === year._id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => loadCourses(year._id)}
                      >
                        <span className="font-medium">{year.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteYear(year._id)
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Courses Column */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Courses</h3>
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
                    <p className="text-gray-500 text-sm">Select a year first</p>
                  ) : courses.length === 0 ? (
                    <p className="text-gray-500 text-sm">No courses yet</p>
                  ) : (
                    courses.map((course) => (
                      <div
                        key={course._id}
                        className={`p-3 rounded cursor-pointer flex justify-between items-center ${
                          selectedCourse === course._id ? 'bg-green-100 border border-green-300' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => loadFiles(course._id)}
                      >
                        <span className="font-medium">{course.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCourse(course._id)
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Files Column */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Files</h3>
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
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {!selectedCourse ? (
                    <p className="text-gray-500 text-sm">Select a course first</p>
                  ) : files.length === 0 ? (
                    <p className="text-gray-500 text-sm">No files yet</p>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file._id}
                        className="p-3 rounded hover:bg-gray-100 flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file._id)}
                          className="text-red-600 hover:text-red-800"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Add New Year</h3>
            <form onSubmit={handleCreateYear}>
              <input
                type="text"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                placeholder="e.g., Year 1, 2024-2025"
                className="w-full px-3 py-2 border rounded mb-4"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Add New Course</h3>
            <form onSubmit={handleCreateCourse}>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="e.g., Mathematics, Physics"
                className="w-full px-3 py-2 border rounded mb-4"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
