const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const User = require('../models/User')
const Question = require('../models/Question')
const Answer = require('../models/Answer')

// Get user profile by username
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get user's questions and answers
    const [questions, answers] = await Promise.all([
      Question.find({ author: user._id })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(10),
      Answer.find({ author: user._id })
        .populate('question', 'title')
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(10)
    ])

    // Calculate user stats
    const stats = {
      totalViews: questions.reduce((sum, q) => sum + q.viewCount, 0),
      acceptedAnswers: answers.filter(a => a.isAccepted).length,
      totalVotes: questions.reduce((sum, q) => sum + q.votes.upvotes.length + q.votes.downvotes.length, 0) +
                 answers.reduce((sum, a) => sum + a.votes.upvotes.length + a.votes.downvotes.length, 0),
      questionsThisMonth: questions.filter(q => {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return q.createdAt > monthAgo
      }).length,
      totalActivity: questions.length + answers.length,
      recentActivity: [
        ...questions.map(q => ({
          type: 'question',
          description: `Asked "${q.title}"`,
          date: q.createdAt
        })),
        ...answers.map(a => ({
          type: 'answer',
          description: `Answered "${a.question.title}"`,
          date: a.createdAt
        }))
      ].sort((a, b) => b.date - a.date).slice(0, 10)
    }

    res.json({
      user,
      questions,
      answers,
      stats
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get current user's profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, bio } = req.body
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

    if (email) user.email = email
    if (bio !== undefined) user.bio = bio

    await user.save()

    // Return user without password
    const userResponse = user.toObject()
    delete userResponse.password

    res.json({ user: userResponse })
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
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

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.preferences = { ...user.preferences, ...req.body }
    await user.save()

    res.json({ message: 'Preferences updated successfully' })
  } catch (error) {
    console.error('Error updating preferences:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Delete user's questions and answers
    await Promise.all([
      Question.deleteMany({ author: user._id }),
      Answer.deleteMany({ author: user._id })
    ])

    // Delete user
    await user.deleteOne()

    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Error deleting account:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
