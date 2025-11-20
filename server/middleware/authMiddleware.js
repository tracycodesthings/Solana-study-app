import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node'

// Middleware to verify Clerk authentication
export const requireAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    // Verify the JWT token (networkless verification)
    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
      clockSkewInMs: 30000 // Allow 30 second clock skew (your system clock seems off)
    })
    
    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Attach user info to request
    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
      claims: payload
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({ error: 'Authentication failed', details: error.message })
  }
}

// Optional: Middleware to get user if authenticated, but don't require it
export const optionalAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return next()
    }

    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY
    })
    
    if (payload && payload.sub) {
      req.auth = {
        userId: payload.sub,
        sessionId: payload.sid,
        claims: payload
      }
    }

    next()
  } catch (error) {
    // Continue without auth if verification fails
    next()
  }
}
