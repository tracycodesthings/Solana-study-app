import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Dashboard from './pages/Dashboard'
import FilesPage from './pages/FilesPage'
import QuizPage from './pages/QuizPage'
import QuizPlayer from './components/QuizPlayer'
import TutorPage from './pages/TutorPage'
import MixedPapers from './pages/MixedPapers'
import MixedPaperPlayer from './components/MixedPaperPlayer'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/files"
          element={
            <>
              <SignedIn>
                <FilesPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/quizzes"
          element={
            <>
              <SignedIn>
                <QuizPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/quiz/:quizId"
          element={
            <>
              <SignedIn>
                <QuizPlayer />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/tutor"
          element={
            <>
              <SignedIn>
                <TutorPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/mixed-papers"
          element={
            <>
              <SignedIn>
                <MixedPapers />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/mixed-paper-player"
          element={
            <>
              <SignedIn>
                <MixedPaperPlayer />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
