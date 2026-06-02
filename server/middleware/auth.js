const jwt = require('jsonwebtoken')
const User = require('../models/User')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Access token required' })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured')
      return res.status(500).json({ message: 'Server configuration error' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: 'Token expired' })
    }

    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ message: 'Token not active' })
    }

    console.error('Unexpected auth error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    
    if (!token) {
      return next(new Error('Authentication error'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return next(new Error('Authentication error'))
    }

    socket.userId = user._id.toString()
    socket.user = user
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

module.exports = {
  authenticateToken,
  authenticateSocket,
  requireAdmin
} 
