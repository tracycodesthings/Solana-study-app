import { useState, useEffect, useRef } from 'react'
import { UserButton } from '@clerk/clerk-react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

function TutorPage() {
  const [years, setYears] = useState([])
  const [courses, setCourses] = useState([])
  const [conversations, setConversations] = useState([])
  
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const messagesEndRef = useRef(null)

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      fetchConversations(selectedCourse)
      setMessages([])
      setSelectedConversation(null)
    } else {
      setConversations([])
      setMessages([])
    }
  }, [selectedCourse])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchYears = async () => {
    try {
      const token = await getAuthToken()
      const response = await axios.get('/api/structure/years', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setYears(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError('Failed to load years')
      setYears([])
    }
  }

  const fetchCourses = async (yearId) => {
    try {
      const token = await getAuthToken()
      const response = await axios.get(`/api/structure/years/${yearId}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCourses(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError('Failed to load courses')
      setCourses([])
    }
  }

  const fetchConversations = async (courseId) => {
    try {
      const token = await getAuthToken()
      const response = await axios.get(`/api/tutor/conversations/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setConversations([])
    }
  }

  const loadConversation = async (conversationId) => {
    try {
      const token = await getAuthToken()
      const response = await axios.get(`/api/tutor/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(response.data.messages)
      setSelectedConversation(conversationId)
    } catch (err) {
      setError('Failed to load conversation')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !selectedCourse) {
      return
    }

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)
    setError('')

    // Add user message to UI immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }])

    try {
      const token = await getAuthToken()
      const response = await axios.post('/api/tutor/message', {
        courseId: selectedCourse,
        message: userMessage,
        conversationId: selectedConversation
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Add assistant response
      setMessages(prev => [...prev, response.data.message])
      
      // Update conversation ID if it's a new conversation
      if (!selectedConversation) {
        setSelectedConversation(response.data.conversationId)
        fetchConversations(selectedCourse)
      }
    } catch (err) {
      setError('Failed to send message')
      // Remove the optimistically added user message
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleNewConversation = () => {
    setSelectedConversation(null)
    setMessages([])
  }

  const handleDeleteConversation = async (conversationId) => {
    if (!confirm('Delete this conversation?')) return

    try {
      const token = await getAuthToken()
      await axios.delete(`/api/tutor/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (selectedConversation === conversationId) {
        handleNewConversation()
      }
      fetchConversations(selectedCourse)
    } catch (err) {
      setError('Failed to delete conversation')
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Tutor</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered study assistant</p>
              </div>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Sidebar - Year/Course Selection */}
            <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Select Course</h3>
                
                <select
                  value={selectedYear || ''}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose Year...</option>
                  {years.map(year => (
                    <option key={year._id} value={year._id}>{year.name}</option>
                  ))}
                </select>

                <select
                  value={selectedCourse || ''}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={!selectedYear}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose Course...</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>

              {/* Conversation History */}
              {selectedCourse && (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversations</h4>
                    <button
                      onClick={handleNewConversation}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      New Chat
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {conversations.map(conv => (
                      <div
                        key={conv._id}
                        className={`p-2 rounded cursor-pointer group ${
                          selectedConversation === conv._id
                            ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                        }`}
                      >
                        <div
                          onClick={() => loadConversation(conv._id)}
                          className="flex-1"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConversation(conv._id)
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 opacity-0 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
              {!selectedCourse ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">Select a course to start</p>
                    <p className="text-sm">Choose a year and course to chat with your study tutor</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-500 mt-8">
                        <svg className="w-12 h-12 mx-auto mb-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-lg font-medium mb-2">Start a conversation</p>
                        <p className="text-sm">Ask me anything about studying, exam prep, or study strategies!</p>
                        
                        <div className="mt-6 max-w-md mx-auto text-left bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Try asking:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• "How should I prepare for my exam?"</li>
                            <li>• "What are good study tips?"</li>
                            <li>• "Help me create a study schedule"</li>
                            <li>• "I'm struggling, what should I do?"</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-3xl rounded-lg px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {msg.role === 'assistant' && (
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                              </svg>
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Study Tutor</span>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                          <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    {error && (
                      <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded text-sm">
                        {error}
                      </div>
                    )}
                    
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask me anything about studying..."
                        disabled={loading}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                      />
                      <button
                        type="submit"
                        disabled={loading || !inputMessage.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TutorPage
