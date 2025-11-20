import axios from 'axios'

// Use proxy for API calls (Vite will proxy /api to http://localhost:5000)
const API_URL = ''

// Get auth token from Clerk
const getAuthToken = async () => {
  const token = await window.Clerk?.session?.getToken()
  return token
}

// ========== YEAR APIs ==========

export const getYears = async () => {
  const token = await getAuthToken()
  const response = await axios.get(`${API_URL}/api/structure/years`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export const createYear = async (name) => {
  const token = await getAuthToken()
  const response = await axios.post(`${API_URL}/api/structure/years`, 
    { name },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export const deleteYear = async (yearId) => {
  const token = await getAuthToken()
  await axios.delete(`${API_URL}/api/structure/years/${yearId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// ========== COURSE APIs ==========

export const getCourses = async (yearId) => {
  const token = await getAuthToken()
  const url = yearId 
    ? `${API_URL}/api/structure/courses?yearId=${yearId}`
    : `${API_URL}/api/structure/courses`
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export const createCourse = async (name, yearId) => {
  const token = await getAuthToken()
  const response = await axios.post(`${API_URL}/api/structure/courses`, 
    { name, yearId },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export const deleteCourse = async (courseId) => {
  const token = await getAuthToken()
  await axios.delete(`${API_URL}/api/structure/courses/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// ========== FILE APIs ==========

export const getFiles = async (courseId) => {
  const token = await getAuthToken()
  const response = await axios.get(`${API_URL}/api/files/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export const uploadFile = async (file, courseId, onProgress) => {
  const token = await getAuthToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('courseId', courseId)

  const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    }
  })
  return response.data
}

export const deleteFile = async (fileId) => {
  const token = await getAuthToken()
  await axios.delete(`${API_URL}/api/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const renameFile = async (fileId, name) => {
  const token = await getAuthToken()
  const response = await axios.put(`${API_URL}/api/files/${fileId}`,
    { name },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export const addLink = async (courseId, name, url, linkType) => {
  const token = await getAuthToken()
  const response = await axios.post(`${API_URL}/api/files/add-link`, 
    { courseId, name, url, linkType },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}
