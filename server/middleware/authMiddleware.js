import { clerkClient } from '@clerk/clerk-sdk-node'

// Middleware to verify Clerk authentication
export const requireAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(sessionToken)
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    // Get user information
    const user = await clerkClient.users.getUser(session.userId)
    
    // Attach user info to request
    req.auth = {
      userId: user.id,
      sessionId: session.id,
      user: user
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

// Optional: Middleware to get user if authenticated, but don't require it
export const optionalAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return next()
    }

    const session = await clerkClient.sessions.verifySession(sessionToken)
    
    if (session) {
      const user = await clerkClient.users.getUser(session.userId)
      req.auth = {
        userId: user.id,
        sessionId: session.id,
        user: user
      }
    }

    next()
  } catch (error) {
    // Continue without auth if verification fails
    next()
  }
}
