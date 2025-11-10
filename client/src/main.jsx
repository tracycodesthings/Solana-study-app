import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import { DarkModeProvider } from './contexts/DarkModeContext'

// Clerk Publishable Key
const PUBLISHABLE_KEY = 'pk_test_aGVscGVkLWZveGhvdW5kLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <DarkModeProvider>
        <App />
      </DarkModeProvider>
    </ClerkProvider>
  </StrictMode>,
)
