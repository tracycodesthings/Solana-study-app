#!/usr/bin/env node

/**
 * Production Environment Validator
 * Checks if all required environment variables are set
 */

const requiredEnvVars = {
  backend: [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'CLERK_SECRET_KEY',
    'CLERK_PUBLISHABLE_KEY',
    'GEMINI_API_KEY',
    'ALLOWED_ORIGINS'
  ],
  frontend: [
    'VITE_API_URL',
    'VITE_CLERK_PUBLISHABLE_KEY'
  ]
}

function validateEnv(vars, envType) {
  console.log(`\n🔍 Checking ${envType} environment variables...`)
  
  const missing = []
  const found = []
  
  vars.forEach(varName => {
    if (process.env[varName]) {
      found.push(varName)
      console.log(`  ✅ ${varName}`)
    } else {
      missing.push(varName)
      console.log(`  ❌ ${varName} - MISSING`)
    }
  })
  
  return { missing, found }
}

function main() {
  console.log('🚀 Solana Study App - Environment Validator')
  console.log('=' .repeat(50))
  
  // Determine which environment to check
  const isBackend = process.env.MONGODB_URI !== undefined
  const isFrontend = process.env.VITE_API_URL !== undefined
  
  let allValid = true
  
  if (isBackend) {
    const result = validateEnv(requiredEnvVars.backend, 'Backend')
    if (result.missing.length > 0) {
      allValid = false
      console.log(`\n⚠️  Missing ${result.missing.length} required variable(s)`)
      console.log('Please set the following in your .env file:')
      result.missing.forEach(v => console.log(`  - ${v}`))
    }
  }
  
  if (isFrontend) {
    const result = validateEnv(requiredEnvVars.frontend, 'Frontend')
    if (result.missing.length > 0) {
      allValid = false
      console.log(`\n⚠️  Missing ${result.missing.length} required variable(s)`)
      console.log('Please set the following in your .env file:')
      result.missing.forEach(v => console.log(`  - ${v}`))
    }
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (allValid) {
    console.log('✅ All required environment variables are set!')
    console.log('🚀 Ready for deployment!')
    process.exit(0)
  } else {
    console.log('❌ Environment validation failed!')
    console.log('📝 See .env.example for reference')
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { validateEnv, requiredEnvVars }
