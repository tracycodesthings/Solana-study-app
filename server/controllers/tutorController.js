import Conversation from '../models/Conversation.js'
import File from '../models/File.js'
import Course from '../models/Course.js'
import Quiz from '../models/Quiz.js'
import fs from 'fs/promises'
import path from 'path'

// AI-powered tutor using Gemini
const generateTutorResponse = async (question, courseId, userId) => {
  try {
    // Get course context
    const course = await Course.findOne({ _id: courseId, userId })
    const files = await File.find({ courseId, userId })
    const quizzes = await Quiz.find({ courseId, userId })
    
    // Build context for AI
    const contextInfo = `
Course: ${course?.name || 'Unknown course'}
Available materials: ${files.length} file(s), ${quizzes.length} quiz(zes)
Student question: ${question}

You are a helpful, encouraging study tutor. Provide concise, practical advice.
Focus on study strategies, exam preparation, motivation, and how to use available resources.
Keep responses under 200 words and use a friendly tone with emojis.
`
    
    // Try Gemini AI with available models
    const modelsToTry = [
      { name: 'gemini-2.5-flash', version: 'v1beta' },
      { name: 'gemini-2.0-flash', version: 'v1beta' },
      { name: 'gemini-flash-latest', version: 'v1beta' }
    ]
    
    for (const { name: modelName, version } of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`
        
        const requestBody = {
          contents: [{
            parts: [{
              text: contextInfo
            }]
          }]
        }
        
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        if (apiResponse.ok) {
          const data = await apiResponse.json()
          const response = data.candidates?.[0]?.content?.parts?.[0]?.text
          
          if (response) {
            console.log(`✓ Tutor response generated with ${modelName}`)
            return response
          }
        }
      } catch (err) {
        console.log(`Tutor AI error with ${modelName}:`, err.message)
        continue
      }
    }
    
    // Fallback to basic response if AI fails
    console.log('AI unavailable, using fallback response')
    return generateFallbackResponse(question, course, files, quizzes)
    
  } catch (error) {
    console.error('Tutor generation error:', error)
    return generateFallbackResponse(question, null, [], [])
  }
}

// Fallback pattern-based responses when AI is unavailable
const generateFallbackResponse = (question, course, files, quizzes) => {
  const lowerQuestion = question.toLowerCase()
  
  // Pattern matching for different question types
  
  // Quiz-related questions
  if (lowerQuestion.includes('quiz') || lowerQuestion.includes('test') || lowerQuestion.includes('practice')) {
    if (quizzes.length > 0) {
      return `I found ${quizzes.length} quiz(es) for ${course?.name || 'this course'}. Here are some tips:\n\n` +
        `📝 Start with the oldest quizzes to see your progress\n` +
        `📊 Review wrong answers carefully - they're the best learning opportunities\n` +
        `🎯 Take quizzes multiple times to reinforce concepts\n` +
        `💡 After each quiz, spend time understanding the explanations\n\n` +
        `Would you like me to suggest which quiz to take first?`
    }
    return `I don't see any quizzes for this course yet. You can:\n\n` +
      `1️⃣ Generate a quiz from your notes (go to Quizzes page)\n` +
      `2️⃣ Upload past papers to practice\n` +
      `3️⃣ Create your own study materials first\n\n` +
      `What would you like to do?`
  }
  
  // Study strategy questions
  if (lowerQuestion.includes('how to study') || lowerQuestion.includes('study tips') || lowerQuestion.includes('prepare')) {
    return `Here's an effective study strategy for ${course?.name || 'this course'}:\n\n` +
      `📚 **Review Phase** (30 mins)\n` +
      `• Read through your notes systematically\n` +
      `• Highlight key concepts and formulas\n` +
      `• Make summary cards for complex topics\n\n` +
      `✍️ **Active Practice** (45 mins)\n` +
      `• Take practice quizzes\n` +
      `• Solve past paper questions\n` +
      `• Write out explanations in your own words\n\n` +
      `🔄 **Review Mistakes** (15 mins)\n` +
      `• Analyze wrong answers\n` +
      `• Revisit weak topics\n` +
      `• Create targeted study notes\n\n` +
      `📊 You have ${files.length} file(s) and ${quizzes.length} quiz(es) available. Start with reviewing your notes!`
  }
  
  // Concept explanation requests
  if (lowerQuestion.includes('explain') || lowerQuestion.includes('what is') || lowerQuestion.includes('define')) {
    return `I can help you understand concepts better! Here's my approach:\n\n` +
      `1️⃣ Check your notes for this topic\n` +
      `2️⃣ Look at related quiz questions\n` +
      `3️⃣ Break down complex ideas into simple parts\n\n` +
      `I found ${files.length} file(s) in this course. Try searching through your notes for the specific concept. ` +
      `If you've uploaded materials about this topic, they should contain the explanation.\n\n` +
      `💡 Tip: After reading your notes, take a quiz on the topic to test your understanding!`
  }
  
  // Time management questions
  if (lowerQuestion.includes('time') || lowerQuestion.includes('schedule') || lowerQuestion.includes('when')) {
    return `⏰ **Smart Study Schedule Suggestions:**\n\n` +
      `**Morning Sessions (9-11 AM)**\n` +
      `• Best for complex topics and new material\n` +
      `• Your brain is fresh and focused\n\n` +
      `**Afternoon Sessions (2-4 PM)**\n` +
      `• Good for practice quizzes\n` +
      `• Review and consolidation\n\n` +
      `**Evening Sessions (7-9 PM)**\n` +
      `• Light review of the day's material\n` +
      `• Quick quiz practice\n\n` +
      `🎯 Aim for 2-3 focused 30-minute sessions rather than one long marathon. ` +
      `Take 5-minute breaks between sessions!`
  }
  
  // Exam preparation questions
  if (lowerQuestion.includes('exam') || lowerQuestion.includes('final') || lowerQuestion.includes('revision')) {
    return `📖 **Exam Preparation Strategy:**\n\n` +
      `**2 Weeks Before:**\n` +
      `• Review all notes systematically\n` +
      `• Create summary sheets for each topic\n` +
      `• Identify weak areas\n\n` +
      `**1 Week Before:**\n` +
      `• Take all available practice quizzes\n` +
      `• Review wrong answers thoroughly\n` +
      `• Focus on weak topics\n\n` +
      `**3 Days Before:**\n` +
      `• Light review of summary sheets\n` +
      `• Practice past papers under exam conditions\n` +
      `• Get good sleep!\n\n` +
      `📊 Current resources: ${files.length} files, ${quizzes.length} quizzes. Make sure you've practiced all available materials!`
  }
  
  // Motivation and encouragement
  if (lowerQuestion.includes('difficult') || lowerQuestion.includes('hard') || lowerQuestion.includes('struggling') || 
      lowerQuestion.includes('help') || lowerQuestion.includes('confused')) {
    return `I understand studying can be challenging! Here's what I recommend:\n\n` +
      `💪 **You've got this!** Everyone finds some topics difficult at first.\n\n` +
      `**Break it down:**\n` +
      `• Start with the easiest concepts first\n` +
      `• Build confidence with small wins\n` +
      `• Gradually tackle harder material\n\n` +
      `**Use active learning:**\n` +
      `• Take quizzes to test yourself\n` +
      `• Explain concepts out loud\n` +
      `• Make your own examples\n\n` +
      `📚 Focus on understanding, not memorizing. Take breaks when frustrated. ` +
      `You have ${files.length} resources available - start with one concept at a time!`
  }
  
  // Files and resources questions
  if (lowerQuestion.includes('file') || lowerQuestion.includes('note') || lowerQuestion.includes('resource') || 
      lowerQuestion.includes('material')) {
    return `📁 **Your Course Materials:**\n\n` +
      `You currently have ${files.length} file(s) uploaded for ${course?.name || 'this course'}.\n\n` +
      `**Tips for using your materials:**\n` +
      `• Organize files by topic for easy access\n` +
      `• Review notes before taking quizzes\n` +
      `• Add new materials as you progress\n` +
      `• Generate quizzes from your notes to test understanding\n\n` +
      `💡 The more organized your materials, the easier it is to study effectively!`
  }
  
  // Progress and tracking
  if (lowerQuestion.includes('progress') || lowerQuestion.includes('improvement') || lowerQuestion.includes('track')) {
    return `📈 **Tracking Your Progress:**\n\n` +
      `**Current Status:**\n` +
      `• ${files.length} study materials uploaded\n` +
      `• ${quizzes.length} quizzes available\n` +
      `• Course: ${course?.name || 'Selected course'}\n\n` +
      `**How to measure improvement:**\n` +
      `• Take quizzes regularly and track scores\n` +
      `• Review your quiz results to identify patterns\n` +
      `• Focus on topics where you score below 70%\n` +
      `• Retake quizzes to see improvement\n\n` +
      `🎯 Consistent practice is key to improvement!`
  }
  
  // Default helpful response
  return `I'm here to help you study for ${course?.name || 'this course'}! Here's what I can assist with:\n\n` +
    `📚 **Study Strategies** - Ask me "how to study" or "study tips"\n` +
    `📝 **Quiz Help** - Ask about practice quizzes and test preparation\n` +
    `⏰ **Time Management** - Ask about study schedules\n` +
    `📖 **Exam Prep** - Ask about exam preparation strategies\n` +
    `💪 **Motivation** - Ask when you're struggling\n\n` +
    `**Your Resources:**\n` +
    `• ${files.length} study files\n` +
    `• ${quizzes.length} practice quizzes\n\n` +
    `Try asking me something like:\n` +
    `• "How should I prepare for my exam?"\n` +
    `• "What are good study tips?"\n` +
    `• "I'm struggling with this course, help!"\n\n` +
    `What would you like to know?`
}

// Send message to tutor
export const sendMessage = async (req, res) => {
  try {
    const { courseId, message, conversationId } = req.body
    
    if (!courseId || !message) {
      return res.status(400).json({ error: 'Course ID and message are required' })
    }
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    
    let conversation
    
    if (conversationId) {
      // Continue existing conversation
      conversation = await Conversation.findOne({ 
        _id: conversationId, 
        userId: req.auth.userId 
      })
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' })
      }
    } else {
      // Create new conversation
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '')
      conversation = await Conversation.create({
        userId: req.auth.userId,
        courseId,
        title,
        messages: []
      })
    }
    
    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message
    })
    
    // Generate tutor response
    const response = await generateTutorResponse(message, courseId, req.auth.userId)
    
    // Add assistant response
    conversation.messages.push({
      role: 'assistant',
      content: response
    })
    
    await conversation.save()
    
    res.json({
      conversationId: conversation._id,
      message: {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Tutor error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get conversation history
export const getConversations = async (req, res) => {
  try {
    const { courseId } = req.params
    
    const conversations = await Conversation.find({ 
      userId: req.auth.userId,
      courseId 
    })
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt')
    
    res.json(conversations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get single conversation
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params
    
    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      userId: req.auth.userId 
    }).populate('courseId', 'name')
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    
    res.json(conversation)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params
    
    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      userId: req.auth.userId 
    })
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    
    await Conversation.deleteOne({ _id: conversationId })
    res.json({ message: 'Conversation deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
