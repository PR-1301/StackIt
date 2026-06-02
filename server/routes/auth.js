const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const axios = require('axios')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  })
}

const getServerBaseUrl = (req) => {
  return (process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')
}

const getClientBaseUrl = () => {
  return (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')
}

const getRedirectUri = (provider, req) => {
  const envKey = `${provider.toUpperCase()}_CALLBACK_URL`
  return process.env[envKey] || `${getServerBaseUrl(req)}/api/auth/${provider}/callback`
}

const createOAuthState = (provider, extra = {}) => {
  return jwt.sign({
    provider,
    nonce: crypto.randomBytes(16).toString('hex'),
    ...extra
  }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '10m'
  })
}

const verifyOAuthState = (state, provider) => {
  const decoded = jwt.verify(state, process.env.JWT_SECRET || 'your-secret-key')
  if (decoded.provider !== provider) {
    throw new Error('OAuth state provider mismatch')
  }
  return decoded
}

const base64Url = (buffer) => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const createPkcePair = () => {
  const verifier = base64Url(crypto.randomBytes(32))
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

const getProviderConfig = (provider, req) => {
  const configs = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: getRedirectUri('google', req),
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'openid email profile'
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      redirectUri: getRedirectUri('twitter', req),
      authorizationUrl: 'https://x.com/i/oauth2/authorize',
      tokenUrl: 'https://api.x.com/2/oauth2/token',
      scope: 'users.read tweet.read'
    }
  }

  return configs[provider]
}

const requireProviderConfig = (provider, req, res) => {
  const config = getProviderConfig(provider, req)
  if (!config || !config.clientId || !config.clientSecret) {
    const callbackUrl = getRedirectUri(provider, req)
    console.error(`OAuth ${provider} is missing credentials. Expected callback URL: ${callbackUrl}`)
    res.status(503).json({
      message: `${provider} OAuth is not configured`,
      required: [
        `${provider.toUpperCase()}_CLIENT_ID`,
        `${provider.toUpperCase()}_CLIENT_SECRET`,
        `${provider.toUpperCase()}_CALLBACK_URL`
      ],
      callbackUrl
    })
    return null
  }
  return config
}

const sanitizeUsername = (value, fallback) => {
  const source = value || fallback || 'oauth_user'
  let username = source
    .toString()
    .split('@')[0]
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20)

  if (username.length < 3) {
    username = `user_${username}`.slice(0, 20)
  }

  return username || `user_${crypto.randomBytes(4).toString('hex')}`
}

const getAvailableUsername = async (baseUsername) => {
  const base = sanitizeUsername(baseUsername)

  for (let index = 0; index < 100; index += 1) {
    const suffix = index === 0 ? '' : `_${index}`
    const candidate = `${base.slice(0, 20 - suffix.length)}${suffix}`
    const existingUser = await User.findOne({ username: candidate })

    if (!existingUser) {
      return candidate
    }
  }

  return `user_${crypto.randomBytes(7).toString('hex')}`.slice(0, 20)
}

const findOrCreateOAuthUser = async (provider, profile) => {
  const providerIdPath = `oauthProviders.${provider}.id`
  let user = await User.findOne({ [providerIdPath]: profile.id })

  if (!user && profile.email && !profile.email.endsWith('@oauth.stackit.local')) {
    user = await User.findOne({ email: profile.email.toLowerCase() })
  }

  if (!user) {
    const oauthProviders = provider === 'google'
      ? { google: { id: profile.id, email: profile.email } }
      : { twitter: { id: profile.id, username: profile.username } }

    user = await User.create({
      username: await getAvailableUsername(profile.username || profile.name || profile.email),
      email: profile.email.toLowerCase(),
      password: crypto.randomBytes(32).toString('hex'),
      avatar: profile.avatar || '',
      isVerified: !!profile.isVerified,
      oauthProviders
    })
    return user
  }

  user.oauthProviders = user.oauthProviders || {}
  if (provider === 'google') {
    user.oauthProviders.google = {
      id: profile.id,
      email: profile.email
    }
  } else {
    user.oauthProviders.twitter = {
      id: profile.id,
      username: profile.username
    }
  }

  if (!user.avatar && profile.avatar) {
    user.avatar = profile.avatar
  }

  if (profile.isVerified) {
    user.isVerified = true
  }

  user.lastSeen = new Date()
  await user.save()
  return user
}

const exchangeGoogleCode = async (config, code) => {
  const tokenResponse = await axios.post(config.tokenUrl, new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code'
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
  })

  const profile = profileResponse.data
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    username: profile.email || profile.name,
    avatar: profile.picture,
    isVerified: profile.verified_email
  }
}

const exchangeTwitterCode = async (config, code, codeVerifier) => {
  const basicAuth = Buffer
    .from(`${config.clientId}:${config.clientSecret}`)
    .toString('base64')

  const tokenResponse = await axios.post(config.tokenUrl, new URLSearchParams({
    client_id: config.clientId,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier
  }), {
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  const profileResponse = await axios.get('https://api.x.com/2/users/me', {
    params: {
      'user.fields': 'profile_image_url'
    },
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
  })

  const profile = profileResponse.data.data
  return {
    id: profile.id,
    email: `twitter_${profile.id}@oauth.stackit.local`,
    name: profile.name,
    username: profile.username,
    avatar: profile.profile_image_url,
    isVerified: false
  }
}

const redirectWithOAuthError = (res, provider, error) => {
  const callbackUrl = new URL('/auth/callback', getClientBaseUrl())
  callbackUrl.searchParams.set('provider', provider)
  callbackUrl.searchParams.set('error', error)
  return res.redirect(callbackUrl.toString())
}

// @route   GET /api/auth/:provider
// @desc    Start OAuth login with Google or Twitter/X
// @access  Public
router.get('/:provider(google|twitter)', (req, res) => {
  const { provider } = req.params
  const config = requireProviderConfig(provider, req, res)
  if (!config) return

  const pkce = provider === 'twitter' ? createPkcePair() : null
  const state = createOAuthState(provider, pkce ? { codeVerifier: pkce.verifier } : {})
  const authorizationUrl = new URL(config.authorizationUrl)

  authorizationUrl.searchParams.set('client_id', config.clientId)
  authorizationUrl.searchParams.set('redirect_uri', config.redirectUri)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('scope', config.scope)
  authorizationUrl.searchParams.set('state', state)

  if (provider === 'google') {
    authorizationUrl.searchParams.set('access_type', 'offline')
    authorizationUrl.searchParams.set('prompt', 'select_account')
  }

  if (pkce) {
    authorizationUrl.searchParams.set('code_challenge', pkce.challenge)
    authorizationUrl.searchParams.set('code_challenge_method', 'S256')
  }

  res.redirect(authorizationUrl.toString().replace(/\+/g, '%20'))
})

// @route   GET /api/auth/:provider/callback
// @desc    Complete OAuth login with Google or Twitter/X
// @access  Public
router.get('/:provider(google|twitter)/callback', async (req, res) => {
  const { provider } = req.params
  const { code, state, error } = req.query

  if (error) {
    return redirectWithOAuthError(res, provider, error)
  }

  if (!code || !state) {
    return redirectWithOAuthError(res, provider, 'missing_oauth_response')
  }

  const config = requireProviderConfig(provider, req, res)
  if (!config) return

  try {
    const decodedState = verifyOAuthState(state, provider)
    const profile = provider === 'google'
      ? await exchangeGoogleCode(config, code)
      : await exchangeTwitterCode(config, code, decodedState.codeVerifier)

    if (!profile.email) {
      return redirectWithOAuthError(res, provider, 'missing_email')
    }

    const user = await findOrCreateOAuthUser(provider, profile)

    if (user.isBanned) {
      return redirectWithOAuthError(res, provider, 'account_banned')
    }

    const token = generateToken(user._id)
    const callbackUrl = `${getClientBaseUrl()}/auth/callback#token=${encodeURIComponent(token)}&provider=${encodeURIComponent(provider)}`
    return res.redirect(callbackUrl)
  } catch (callbackError) {
    console.error(`${provider} OAuth callback error:`, callbackError.response?.data || callbackError)
    return redirectWithOAuthError(res, provider, 'oauth_callback_failed')
  }
})

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { username, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' })
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already taken' })
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        reputation: user.reputation,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Email not registered' })
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        message: 'Account is banned',
        reason: user.banReason
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Password is incorrect' })
    }

    // Update last seen
    user.lastSeen = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        reputation: user.reputation,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('questionCount')
      .populate('answerCount')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        reputation: user.reputation,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        badges: user.badges,
        isVerified: user.isVerified,
        preferences: user.preferences,
        createdAt: user.createdAt,
        questionCount: user.questionCount,
        answerCount: user.answerCount
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  authenticateToken,
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { username, bio, avatar, preferences } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if username is already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username })
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' })
      }
      user.username = username
    }

    if (bio !== undefined) user.bio = bio
    if (avatar !== undefined) user.avatar = avatar
    if (preferences) {
      if (preferences.emailNotifications !== undefined) {
        user.preferences.emailNotifications = preferences.emailNotifications
      }
      if (preferences.theme !== undefined) {
        user.preferences.theme = preferences.theme
      }
    }

    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        reputation: user.reputation,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  authenticateToken,
  body('currentPassword')
    .exists()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
