import Quiz from '../models/Quiz.js'
import UploadedQuiz from '../models/UploadedQuiz.js'
import QuizAttempt from '../models/QuizAttempt.js'
import Course from '../models/Course.js'
import File from '../models/File.js'
import fs from 'fs/promises'
import path from 'path'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import mammoth from 'mammoth'
import xlsx from 'xlsx'
import { createWorker } from 'tesseract.js'
import Canvas from 'canvas'
import { GoogleGenerativeAI } from '@google/generative-ai'
import JSZip from 'jszip'
import axios from 'axios'
import { cloudinary, hasCloudinaryConfig } from '../config/cloudinary.js'

const { createCanvas, loadImage, Image } = Canvas

// Make Image available globally for pdfjs-dist
if (!globalThis.Image) {
  globalThis.Image = Image
}

// Setup canvas for pdfjs-dist
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height)
    return {
      canvas,
      context: canvas.getContext('2d')
    }
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width
    canvasAndContext.canvas.height = height
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0
    canvasAndContext.canvas.height = 0
    canvasAndContext.canvas = null
    canvasAndContext.context = null
  }
}

// OCR function for scanned PDFs and images
const extractTextWithOCR = async (fileBuffer, fileType) => {
  let worker = null
  
  try {
    console.log('Starting OCR process...')
    
    // Create Tesseract worker
    worker = await createWorker('eng')
    
    if (fileType === 'pdf') {
      // Convert PDF pages to images and OCR each page
      const uint8Array = new Uint8Array(fileBuffer)
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
      const pdf = await loadingTask.promise
      
      let ocrText = ''
      const maxPages = Math.min(pdf.numPages, 5) // Limit to 5 pages
      const canvasFactory = new NodeCanvasFactory()
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        console.log(`OCR processing page ${pageNum}/${maxPages}`)
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.5 })
        
        const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)
        
        await page.render({ 
          canvasContext: canvasAndContext.context,
          viewport: viewport,
          canvasFactory: canvasFactory
        }).promise
        
        // Get image buffer from canvas
        const imageBuffer = canvasAndContext.canvas.toBuffer('image/png')
        
        // Use worker to recognize text from buffer
        const { data: { text } } = await worker.recognize(imageBuffer)
        
        ocrText += text + '\n'
        console.log(`Page ${pageNum} extracted ${text.length} characters`)
        
        // Clean up
        canvasFactory.destroy(canvasAndContext)
      }
      
      console.log('OCR completed, total extracted text length:', ocrText.length)
      return ocrText
    } else {
      // For image files
      console.log('Processing image file with OCR...')
      const { data: { text } } = await worker.recognize(fileBuffer)
      console.log('OCR completed, extracted text length:', text.length)
      return text
    }
  } catch (ocrError) {
    console.error('OCR error:', ocrError)
    throw new Error('OCR failed: ' + ocrError.message)
  } finally {
    if (worker) {
      await worker.terminate()
    }
  }
}

// Extract text from various file types
const extractTextFromFile = async (fileBuffer, mimeType) => {
  try {
    console.log('Extracting text from file type:', mimeType)
    
    // PDF files
    if (mimeType === 'application/pdf') {
      console.log('Processing PDF file...')
      const uint8Array = new Uint8Array(fileBuffer)
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
      const pdf = await loadingTask.promise
      
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => item.str).join(' ')
        text += pageText + '\n'
      }
      
      console.log(`Extracted ${text.length} characters from PDF`)
      
      // If no text extracted, try OCR
      if (text.trim().length < 100) {
        console.log('No text found in PDF, attempting OCR...')
        text = await extractTextWithOCR(fileBuffer, 'pdf')
      }
      
      return text
    }
    
    // Word documents
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing DOCX file...')
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      return result.value
    }
    
    // PowerPoint files
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
        mimeType === 'application/octet-stream' || 
        mimeType === 'application/vnd.ms-powerpoint') {
      console.log('Processing PowerPoint file...')
      try {
        const zip = await JSZip.loadAsync(fileBuffer)
        let text = ''
        
        // Extract text from all slide XML files
        const slideFiles = Object.keys(zip.files).filter(name => 
          name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
        )
        
        for (const slidePath of slideFiles) {
          const slideXml = await zip.files[slidePath].async('text')
          // Extract text between <a:t> tags (text content in PowerPoint XML)
          const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g)
          if (textMatches) {
            textMatches.forEach(match => {
              const textContent = match.replace(/<\/?a:t>/g, '')
              text += textContent + ' '
            })
            text += '\n'
          }
        }
        
        console.log(`Extracted ${text.length} characters from PowerPoint`)
        return text
      } catch (err) {
        console.error('PowerPoint extraction error:', err.message)
        throw new Error('Failed to extract text from PowerPoint file')
      }
    }
    
    // Excel files
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        mimeType === 'application/vnd.ms-excel') {
      console.log('Processing Excel file...')
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' })
      let text = ''
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        text += xlsx.utils.sheet_to_txt(sheet) + '\n'
      })
      return text
    }
    
    // CSV files
    if (mimeType === 'text/csv') {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      return xlsx.utils.sheet_to_txt(sheet)
    }
    
    // Image files - use OCR
    if (mimeType.startsWith('image/')) {
      console.log('Image file detected, using OCR...')
      return await extractTextWithOCR(fileBuffer, 'image')
    }
    
    // Plain text files
    if (mimeType.startsWith('text/')) {
      return fileBuffer.toString('utf-8')
    }
    
    // Try to read as text for other types
    try {
      return fileBuffer.toString('utf-8')
    } catch (e) {
      throw new Error('Unsupported file type for text extraction')
    }
  } catch (error) {
    throw new Error(`Failed to extract text from file: ${error.message}`)
  }
}

// AI-powered quiz generation from notes
const generateQuestionsWithAI = async (text, numQuestions = 10) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables')
    }
    
    const prompt = `You are a quiz generator. Generate ${numQuestions} multiple choice questions based on the following study notes. 
    
Each question MUST have:
- A clear question
- Exactly 5 options (A, B, C, D, E)
- The correct answer letter

Format EXACTLY as follows (no extra text):
Question 1: [question text]
a. [option]
b. [option]
c. [option]
d. [option]
e. [option]
Answer: [letter]

Question 2: [question text]
...

Study Notes:
${text.substring(0, 15000)}

Generate ${numQuestions} questions now:`

    console.log('Using direct REST API call to Gemini...')
    console.log('Text being sent to AI (first 500 chars):', text.substring(0, 500))
    console.log('Total text length:', text.length)
    
    // First, check what models are available
    try {
      console.log('Checking available models...')
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
      const listResponse = await fetch(listUrl)
      if (listResponse.ok) {
        const data = await listResponse.json()
        const modelNames = data.models?.filter(m => m.supportedGenerationMethods?.includes('generateContent')).map(m => m.name) || []
        console.log('Available models for generateContent:', modelNames.join(', '))
      } else {
        console.log('Could not list models - response:', listResponse.status)
      }
    } catch (err) {
      console.log('Could not list models:', err.message)
    }
    
    // Try different models with v1beta API - using the actual available models
    const modelsToTry = [
      { name: 'gemini-2.5-flash', version: 'v1beta' },
      { name: 'gemini-2.0-flash', version: 'v1beta' },
      { name: 'gemini-flash-latest', version: 'v1beta' },
      { name: 'gemini-2.5-pro', version: 'v1beta' },
      { name: 'gemini-pro-latest', version: 'v1beta' }
    ]
    let response = null
    
    for (const { name: modelName, version } of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName} with ${version}`)
        const apiUrl = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`
        
        const requestBody = {
          contents: [{
            parts: [{
              text: prompt
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
        
        if (!apiResponse.ok) {
          const errorText = await apiResponse.text()
          console.log(`✗ ${modelName} (${version}) failed:`, errorText.substring(0, 200))
          continue
        }
        
        const data = await apiResponse.json()
        response = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (response) {
          console.log(`✓ Success with ${modelName} (${version})`)
          break
        }
      } catch (err) {
        console.log(`✗ ${modelName} (${version}) error:`, err.message)
      }
    }
    
    if (!response) {
      throw new Error('All models failed. Your API key may not have access to Gemini models.')
    }
    
    console.log('AI Response received:', response.substring(0, 500))
    const parsedQuestions = extractQuestionsFromText(response)
    console.log(`Successfully parsed ${parsedQuestions.length} questions from AI response`)
    return parsedQuestions
  } catch (error) {
    console.error('AI generation error details:', error)
    throw new Error('Failed to generate questions with AI: ' + error.message)
  }
}

// Simple quiz generation from text content (for pre-formatted quizzes)
const extractQuestionsFromText = (text) => {
  const questions = []
  
  console.log('=== Extracting Questions ===')
  console.log('Text length:', text.length)
  
  // Clean text but KEEP answer markers for detection
  text = text.replace(/\bcon\s*fi\s*dentiality/gi, 'confidentiality')
          .replace(/\bo\s*ff\s*/gi, 'off')
          .replace(/\bpat+ient/gi, 'patient')
          .replace(/Complete\s+Marked\s+out\s+of\s+[\d\.]+/gi, '')
          .replace(/by\s+Haron\s+Sami/gi, '')
  
  // Split by "Question XX" to get individual questions
  const blocks = text.split(/Question\s+\d+/i)
  
  console.log(`Found ${blocks.length - 1} question blocks`)
  
  for (let i = 1; i < blocks.length; i++) {
    const originalBlock = blocks[i]
    
    // FIRST: Detect correct answer from the original block BEFORE cleaning
    let detectedLetter = null
    const patterns = [
      /Answere?\s*([A-E])\b/i,
      /\bAnswer[:\s]*([A-E])\b/i,
      /Correct[:\s]*([A-E])\b/i,
      /\b([A-E])\s*is\s*correct/i
    ]
    
    for (const pattern of patterns) {
      const match = originalBlock.match(pattern)
      if (match) {
        detectedLetter = match[1].toUpperCase()
        console.log(`  Found answer marker: ${detectedLetter}`)
        break
      }
    }
    
    // NOW clean the block for extraction
    const block = originalBlock.replace(/Answere?\s*[A-E]/gi, '')
    
    // Find where options start (look for "a.")
    const optionsStartIndex = block.search(/\ba\.\s+/)
    if (optionsStartIndex === -1) continue
    
    // Extract question text (everything before "a.")
    const questionText = block.substring(0, optionsStartIndex)
      .trim()
      .replace(/\s+/g, ' ')
    
    if (questionText.length < 20) continue
    
    // Extract options by finding their positions
    const optionsText = block.substring(optionsStartIndex)
    
    // Find all option positions
    const findOptionPos = (letter) => {
      const regex = new RegExp(`\\b${letter}\\.\\s+`, 'i')
      const match = optionsText.match(regex)
      return match ? optionsText.indexOf(match[0]) : -1
    }
    
    const posA = 0 // We know 'a.' starts at position 0
    const posB = findOptionPos('b')
    const posC = findOptionPos('c')
    const posD = findOptionPos('d')
    const posE = findOptionPos('e')
    
    if (posB === -1 || posC === -1 || posD === -1) {
      console.log(`✗ Missing required options in block ${i}`)
      continue
    }
    
    // Extract text between positions
    const extractBetween = (start, end) => {
      const text = optionsText.substring(start, end > 0 ? end : optionsText.length)
      // Remove the option letter prefix (a., b., etc)
      return text.replace(/^[a-e]\.\s+/i, '')
        .replace(/Answere?\s*[A-E]/gi, '')
        .replace(/by\s+Haron\s+Sami/gi, '')
        .trim()
        .replace(/\s+/g, ' ')
    }
    
    const options = [
      extractBetween(posA, posB),
      extractBetween(posB, posC),
      extractBetween(posC, posD),
      extractBetween(posD, posE > 0 ? posE : -1)
    ]
    
    // Add option E if it exists
    if (posE > 0) {
      console.log(`  Option E found at position ${posE}`)
      let eText = optionsText.substring(posE)
      eText = eText.replace(/^e\.\s+/i, '')
      
      console.log(`  Raw E text (first 200 chars): ${eText.substring(0, 200)}`)
      
      // Look for patterns that indicate start of next question or answer
      // Pattern 0: "Answer:" or "Answere:" (most common end of options)
      const answerPattern = eText.match(/\s*Answere?:\s*[A-E]/i)
      
      // Pattern 1: Lowercase word + space + Capital word (3+ chars) that starts a sentence
      //            Examples: "cue Groupthink", "drive Motivation", "learning Behavior"
      const sentenceStart = eText.match(/[a-z]+\s+[A-Z][a-z]{2,}\s+(is|was|are|were|can|will|should|may|has|have|had)\s/)
      
      // Pattern 2: period/punctuation + space + capital letter (clear sentence boundary)
      const periodCap = eText.match(/[.!?]\s+[A-Z]/)
      
      // Pattern 3: question words at start of new sentence
      const questionWord = eText.match(/[.!?]?\s+(Which|What|Who|Where|When|Why|How|The|In|By)\s+/)
      
      // Pattern 4: "A " pattern (question starting with "A")
      const patternA = eText.match(/[a-z]\s+A\s+[a-z]/)
      
      let cutIndex = -1
      
      // Check for Answer pattern first (most reliable end marker)
      if (answerPattern && answerPattern.index > 2) {
        cutIndex = answerPattern.index
        console.log(`  E text cut at Answer pattern (position ${cutIndex})`)
      }
      // Check sentence start pattern
      else if (sentenceStart && sentenceStart.index > 5) {
        // Cut right before the capital word
        const capitalWordStart = eText.substring(sentenceStart.index).search(/[A-Z]/)
        cutIndex = sentenceStart.index + capitalWordStart
        console.log(`  E text cut at sentence start pattern (position ${cutIndex}): "${eText.substring(cutIndex, cutIndex + 30)}"`)
      } 
      // Then check for clear period + capital
      else if (periodCap && periodCap.index > 5) {
        cutIndex = periodCap.index + 1
        console.log(`  E text cut at period+capital (position ${cutIndex})`)
      }
      // Then check for question words
      else if (questionWord && questionWord.index > 5) {
        cutIndex = questionWord.index + (questionWord[0].startsWith('.') ? 1 : 0)
        console.log(`  E text cut at question word (position ${cutIndex})`)
      }
      // Finally check A pattern
      else if (patternA && patternA.index > 10) {
        cutIndex = patternA.index + 1
        console.log(`  E text cut at 'A' pattern (position ${cutIndex})`)
      }
      
      if (cutIndex > 0) {
        eText = eText.substring(0, cutIndex)
      } else {
        // Fallback: take 80 chars max at word boundary
        if (eText.length > 80) {
          eText = eText.substring(0, 80)
          const lastSpace = eText.lastIndexOf(' ')
          if (lastSpace > 50) {
            eText = eText.substring(0, lastSpace)
          }
          console.log(`  E text truncated to ${eText.length} chars`)
        }
      }
      
      eText = eText
        .replace(/Answere?\s*[A-E]/gi, '')
        .replace(/by\s+Haron\s+Sami/gi, '')
        .trim()
        .replace(/\s+/g, ' ')
      
      console.log(`  Cleaned E text length: ${eText.length}`)
      console.log(`  E text: ${eText}`)
      
      if (eText.length > 2 && eText.length < 250) {
        options.push(eText)
        console.log(`  ✓ Added option E`)
      } else {
        console.log(`  ✗ Option E rejected - length: ${eText.length}`)
      }
    } else {
      console.log(`  No option E found (posE = ${posE})`)
    }
    
    // Validate - options should be reasonable length
    const validOptions = options.filter(opt => opt.length >= 3 && opt.length <= 250)
    
    if (validOptions.length < 4) {
      console.log(`✗ Invalid options in block ${i} - only ${validOptions.length} valid options`)
      validOptions.forEach((opt, idx) => console.log(`    ${idx}: ${opt.substring(0, 50)}`))
      continue
    }
    
    // Set correct answer based on detected letter (detected earlier before cleaning)
    let correctAnswer = validOptions[0]
    
    if (detectedLetter) {
      const markedIndex = detectedLetter.charCodeAt(0) - 65 // A=0, B=1, etc
      if (markedIndex >= 0 && markedIndex < validOptions.length) {
        correctAnswer = validOptions[markedIndex]
        console.log(`  ✓ Correct answer: ${detectedLetter} (${correctAnswer.substring(0, 40)}...)`)
      } else {
        console.log(`  ⚠ Detected answer ${detectedLetter} but only have ${validOptions.length} options`)
      }
    } else {
      console.log(`  ⚠ No answer marker detected, defaulting to option A`)
    }
    
    console.log(`✓ Question ${questions.length + 1}: "${questionText.substring(0, 60)}..."`)
    validOptions.forEach((opt, idx) => {
      const letter = String.fromCharCode(97 + idx)
      const marker = opt === correctAnswer ? ' ← CORRECT' : ''
      console.log(`  ${letter}. ${opt.substring(0, 60)}...${marker}`)
    })
    
    questions.push({
      type: 'MCQ',
      question: questionText,
      options: validOptions,
      correctAnswer: correctAnswer,
      explanation: 'Review your notes for the correct answer'
    })
  }
  
  console.log(`Total extracted: ${questions.length} questions\n`)
  
  return questions
}

// Generate quiz from notes
export const generateQuiz = async (req, res) => {
  try {
    console.log('📥 Quiz generation request received:', {
      body: req.body,
      userId: req.auth?.userId
    })
    
    const { fileId, courseId, numQuestions } = req.body
    
    if (!fileId || fileId === '' || !courseId || courseId === '') {
      console.error('❌ Missing or empty required fields:', { fileId, courseId })
      return res.status(400).json({ 
        error: 'File ID and Course ID are required',
        received: { fileId, courseId }
      })
    }

    // Validate MongoDB ObjectId format
    const ObjectIdPattern = /^[0-9a-fA-F]{24}$/
    if (!ObjectIdPattern.test(fileId)) {
      console.error('❌ Invalid fileId format:', fileId)
      return res.status(400).json({ 
        error: 'Invalid file ID format',
        received: { fileId }
      })
    }
    if (!ObjectIdPattern.test(courseId)) {
      console.error('❌ Invalid courseId format:', courseId)
      return res.status(400).json({ 
        error: 'Invalid course ID format',
        received: { courseId }
      })
    }
    
    const maxQuestions = parseInt(numQuestions) || 0 // 0 means extract all
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      console.error('❌ Course not found:', { courseId, userId: req.auth.userId })
      return res.status(404).json({ error: 'Course not found' })
    }
    console.log('✅ Course found:', course.name)
    
    // Get file
    const file = await File.findOne({ _id: fileId, userId: req.auth.userId })
    if (!file) {
      console.error('❌ File not found:', { fileId, userId: req.auth.userId })
      return res.status(404).json({ error: 'File not found' })
    }
    console.log('✅ File found:', file.name)
    
    // Read file content
    let content = ''
    try {
      let fileBuffer
      
      console.log('🔍 File details:', {
        name: file.name,
        url: file.url,
        cloudinaryId: file.cloudinaryId,
        mimeType: file.mimeType,
        size: file.size
      })
      
      // Check if file is from Cloudinary or any external URL (starts with http)
      if (file.url.startsWith('http://') || file.url.startsWith('https://')) {
        console.log('📥 Attempting to download from URL:', file.url)
        
        try {
          // Try direct download first
          const response = await axios.get(file.url, { 
            responseType: 'arraybuffer',
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 300
          })
          fileBuffer = Buffer.from(response.data)
          console.log('✅ Downloaded', response.data.byteLength, 'bytes')
        } catch (downloadError) {
          console.error('❌ Direct download failed:', {
            status: downloadError.response?.status,
            statusText: downloadError.response?.statusText,
            message: downloadError.message,
            url: file.url
          })
          
          // If Cloudinary and we have cloudinaryId, try using Cloudinary SDK
          if (file.cloudinaryId && hasCloudinaryConfig) {
            console.log('🔄 Attempting Cloudinary SDK download with multiple resource types...')
            
            // Try different resource types as Cloudinary categorizes files differently
            const resourceTypes = ['raw', 'image', 'video', 'auto']
            let downloaded = false
            
            for (const resourceType of resourceTypes) {
              try {
                // Extract public_id from cloudinaryId (it might have folder prefix)
                const publicId = file.cloudinaryId.replace(/^solana-uploads\//, '')
                
                // Try with folder prefix first
                let cloudinaryUrl = cloudinary.url(`solana-uploads/${publicId}`, {
                  resource_type: resourceType,
                  type: 'upload',
                  secure: true
                })
                console.log(`📥 Trying Cloudinary URL with folder and resource_type '${resourceType}':`, cloudinaryUrl)
                
                let cloudResponse
                try {
                  cloudResponse = await axios.get(cloudinaryUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    validateStatus: (status) => status === 200
                  })
                } catch (e) {
                  // Try without folder prefix
                  console.log(`📥 Retrying without folder prefix...`)
                  cloudinaryUrl = cloudinary.url(publicId, {
                    resource_type: resourceType,
                    type: 'upload',
                    secure: true
                  })
                  console.log(`📥 Trying URL:`, cloudinaryUrl)
                  cloudResponse = await axios.get(cloudinaryUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    validateStatus: (status) => status === 200
                  })
                }
                
                fileBuffer = Buffer.from(cloudResponse.data)
                console.log(`✅ Downloaded from Cloudinary (${resourceType}):`, cloudResponse.data.byteLength, 'bytes')
                downloaded = true
                break
              } catch (cloudError) {
                console.log(`❌ Resource type '${resourceType}' failed: ${cloudError.response?.status || cloudError.message}`)
                // Continue to next resource type
              }
            }
            
            if (!downloaded) {
              // Last resort: Try to use Cloudinary admin API to check if resource exists
              console.log('🔍 Checking if resource exists in Cloudinary...')
              try {
                const resourceInfo = await cloudinary.api.resource(file.cloudinaryId, {
                  resource_type: 'raw'
                }).catch(() => cloudinary.api.resource(file.cloudinaryId, {
                  resource_type: 'image'
                }))
                
                console.log('ℹ️ Resource found in Cloudinary:', {
                  public_id: resourceInfo.public_id,
                  secure_url: resourceInfo.secure_url,
                  resource_type: resourceInfo.resource_type
                })
                
                // Try downloading from the secure_url returned by the API
                const finalResponse = await axios.get(resourceInfo.secure_url, {
                  responseType: 'arraybuffer',
                  timeout: 30000
                })
                fileBuffer = Buffer.from(finalResponse.data)
                console.log('✅ Downloaded using Cloudinary API resource info')
                downloaded = true
              } catch (apiError) {
                console.error('❌ Cloudinary API check failed:', apiError.message)
              }
            }
            
            if (!downloaded) {
              throw new Error(`File not found in Cloudinary (tried all methods). The file may have been deleted, the cloudinaryId '${file.cloudinaryId}' is incorrect, or you may be using a different Cloudinary account. Please re-upload the file.`)
            }
          } else {
            throw new Error(`Cannot download file: ${downloadError.response?.status || downloadError.message}. The file URL might be invalid, private, or expired. Please try re-uploading the file.`)
          }
        }
      } else {
        // Local file
        console.log('📁 Reading local file:', file.url)
        const filePath = path.join(process.cwd(), file.url)
        fileBuffer = await fs.readFile(filePath)
      }
      
      // Determine mimetype from file extension if not stored
      let mimetype = file.mimeType || file.mimetype
      if (!mimetype) {
        const ext = path.extname(file.name || file.url).toLowerCase()
        const mimetypeMap = {
          '.pdf': 'application/pdf',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.doc': 'application/msword',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.xls': 'application/vnd.ms-excel',
          '.csv': 'text/csv',
          '.txt': 'text/plain',
          '.md': 'text/markdown',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif'
        }
        mimetype = mimetypeMap[ext] || 'application/octet-stream'
        console.log(`Detected mimetype from extension ${ext}: ${mimetype}`)
      }
      
      // Extract text based on file type
      content = await extractTextFromFile(fileBuffer, mimetype)
      
      console.log('Extracted text length:', content.length)
    } catch (err) {
      console.error('File extraction error:', err)
      return res.status(400).json({ error: `Cannot extract text from file: ${err.message}` })
    }
    
    // Try to extract existing questions first
    let questions = extractQuestionsFromText(content)
    console.log(`Extracted ${questions.length} formatted questions from file`)
    
    // If no questions found, use AI to generate from notes
    if (questions.length === 0) {
      console.log('No formatted questions found. Using AI to generate from notes...')
      console.log('Content preview:', content.substring(0, 200))
      try {
        const numToGenerate = maxQuestions > 0 ? maxQuestions : 10
        console.log(`Requesting ${numToGenerate} questions from AI...`)
        questions = await generateQuestionsWithAI(content, numToGenerate)
        console.log(`AI generated ${questions.length} questions`)
      } catch (aiError) {
        console.error('AI generation failed:', aiError)
        return res.status(400).json({ 
          error: 'Could not extract or generate questions. Make sure your file contains either formatted quiz questions or study notes.',
          details: aiError.message 
        })
      }
    } else {
      // Limit to requested number if specified (for extracted questions)
      if (maxQuestions > 0 && questions.length > maxQuestions) {
        questions = questions.slice(0, maxQuestions)
      }
    }
    
    if (questions.length === 0) {
      return res.status(400).json({ error: 'Failed to generate questions from the file content.' })
    }
    
    // Create quiz
    const quiz = await Quiz.create({
      title: `Quiz from ${file.name}`,
      courseId,
      userId: req.auth.userId,
      questions,
      generatedFrom: file.name
    })
    
    console.log('✅ Quiz created successfully:', quiz._id)
    res.status(201).json(quiz)
  } catch (error) {
    console.error('❌ Quiz generation error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Get quizzes by course (both generated and uploaded)
export const getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    
    // Get auto-generated quizzes
    const generatedQuizzes = await Quiz.find({ 
      courseId, 
      userId: req.auth.userId 
    }).sort({ createdAt: -1 })
    
    // Get uploaded quizzes
    const uploadedQuizzes = await UploadedQuiz.find({ 
      courseId, 
      userId: req.auth.userId 
    }).sort({ uploadedAt: -1 })
    
    res.json({
      generated: generatedQuizzes,
      uploaded: uploadedQuizzes
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get single quiz
export const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    
    const quiz = await Quiz.findOne({ 
      _id: quizId, 
      userId: req.auth.userId 
    })
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    
    res.json(quiz)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Submit quiz (for Phase 5 - Quiz Player)
export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    const { answers } = req.body
    
    const quiz = await Quiz.findOne({ _id: quizId, userId: req.auth.userId })
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    
    // Calculate score
    let correctCount = 0
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index]
      const isCorrect = userAnswer === question.correctAnswer
      if (isCorrect) correctCount++
      
      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      }
    })
    
    const score = (correctCount / quiz.questions.length) * 100
    
    // Save quiz attempt for progress tracking
    await QuizAttempt.create({
      userId: req.auth.userId,
      quizId: quiz._id,
      courseId: quiz.courseId,
      score: parseFloat(score.toFixed(2)),
      correctCount,
      totalQuestions: quiz.questions.length,
      answers: results
    })
    
    res.json({
      score: score.toFixed(2),
      correctCount,
      totalQuestions: quiz.questions.length,
      results
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Upload manual quiz
export const uploadManualQuiz = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const { courseId, title, type } = req.body
    
    if (!courseId || !title) {
      // Cleanup - only for local files
      if (!hasCloudinaryConfig && req.file.path) {
        await fs.unlink(req.file.path).catch(err => console.error('Cleanup error:', err))
      }
      return res.status(400).json({ error: 'Course ID and title are required' })
    }
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.auth.userId })
    if (!course) {
      // Cleanup - only for local files
      if (!hasCloudinaryConfig && req.file.path) {
        await fs.unlink(req.file.path).catch(err => console.error('Cleanup error:', err))
      }
      return res.status(404).json({ error: 'Course not found' })
    }
    
    // Determine file URL based on storage type
    const fileUrl = hasCloudinaryConfig 
      ? req.file.path // Cloudinary URL
      : `/uploads/${req.file.filename}` // Local path
    
    // Create uploaded quiz record
    const uploadedQuiz = await UploadedQuiz.create({
      title: title.trim(),
      type: type || 'Past Paper',
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      courseId,
      userId: req.auth.userId,
      cloudinaryId: hasCloudinaryConfig ? req.file.filename : undefined
    })
    
    res.status(201).json(uploadedQuiz)
  } catch (error) {
    console.error('Upload quiz error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    
    const quiz = await Quiz.findOne({ _id: quizId, userId: req.auth.userId })
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }
    
    await Quiz.deleteOne({ _id: quizId })
    res.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
