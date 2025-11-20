# 📚 Solana - AI-Powered Study Platform

> A comprehensive learning management system with AI quiz generation, smart tutoring, and advanced file processing capabilities.

[![Deploy Status](https://img.shields.io/badge/status-production-success)](https://github.com/tracycodesthings/Solana-study-app)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

## ✨ Features

- 🤖 **AI Quiz Generation** - Generate quizzes from uploaded study materials using Google Gemini AI
- 💬 **Smart Tutor** - AI-powered chatbot for personalized learning assistance
- 📄 **Multi-Format Support** - Upload PDFs, Word docs, PowerPoint, images, and more
- 📊 **Progress Tracking** - Monitor quiz performance with visual analytics
- 🔐 **Secure Authentication** - Clerk-powered user management
- 🎯 **Organized Content** - Structure learning by years, courses, and topics
- 📱 **Responsive Design** - Beautiful UI that works on all devices

## 🚀 Tech Stack

### Frontend
- **React 19** - Modern UI library with lazy loading & code splitting
- **Vite** - Lightning-fast build tool with HMR
- **Tailwind CSS 4** - Utility-first styling
- **Clerk** - Authentication & user management
- **React Router DOM** - Client-side routing
- **Recharts** - Data visualization
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client

### Backend
- **Node.js + Express 5** - RESTful API server
- **MongoDB + Mongoose** - Database with ODM
- **Google Gemini AI** - AI quiz generation
- **Multer** - File upload handling
- **Helmet** - Security headers
- **Morgan** - Request logging
- **Rate Limiting** - API protection
- **PDF Processing** - pdfjs-dist, pdf2json
- **Document Processing** - Mammoth (Word), JSZip (PowerPoint)
- **OCR** - Tesseract.js for image text extraction

## 📁 Project Structure

```
SOLANA/
├── client/          # React frontend
│   ├── src/
│   ├── public/
│   ├── .env
│   └── vite.config.js
├── server/          # Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   └── server.js
└── .gitignore
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Clerk account ([clerk.dev](https://clerk.dev))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd SOLANA
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Configure environment variables**
   
   **Client** (`client/.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

   **Server** (`server/.env`):
   ```env
   PORT=5000
   CLERK_SECRET_KEY=your_clerk_secret_key
   MONGODB_URI=mongodb://localhost:27017/solanadb
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # If running locally
   mongod
   ```

5. **Run the application**

   **Backend** (Terminal 1):
   ```bash
   cd server
   npm run dev
   ```

   **Frontend** (Terminal 2):
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔐 Clerk Setup

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Copy your **Publishable Key** → client `.env`
4. Copy your **Secret Key** → server `.env`

## 📋 Available Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server
- `npm run dev` - Start with auto-reload
- `npm start` - Start production server

## 🎯 Features Roadmap

- [x] **Phase 1**: Project setup, authentication
- [ ] **Phase 2**: Clerk integration
- [ ] **Phase 3**: File & folder management
- [ ] **Phase 4**: Quiz system
- [ ] **Phase 5**: Quiz player & corrections
- [ ] **Phase 6**: Smart tutor (keyword search)
- [ ] **Phase 7**: Progress tracking
- [ ] **Phase 8**: Search & mixed papers
- [ ] **Phase 9**: UI/UX polish

## 📝 License

ISC

---

Built with ❤️ for smarter learning
