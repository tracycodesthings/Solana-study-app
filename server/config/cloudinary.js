import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

// Check if Cloudinary is configured
const hasCloudinaryConfig = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
)

let storage
let cloudinaryInstance = null

if (hasCloudinaryConfig) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })

  cloudinaryInstance = cloudinary

  // Configure Cloudinary storage for Multer
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'solana-uploads',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'xlsx', 'xls'],
      resource_type: 'auto',
      public_id: (req, file) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        return `${file.fieldname}-${uniqueSuffix}`
      }
    }
  })

  console.log('✅ Cloudinary storage configured')
} else {
  // Fallback to local disk storage
  console.warn('⚠️  Cloudinary not configured, using local storage (files will be lost on Render)')
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, process.env.UPLOAD_DIR || './uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + '-' + file.originalname)
    }
  })
}

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

export { cloudinaryInstance as cloudinary, upload, hasCloudinaryConfig }
