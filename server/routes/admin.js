const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const User = require('../models/User')
const Question = require('../models/Question')
const Answer = require('../models/Answer')
const Tag = require('../models/Tag')
const Notification = require('../models/Notification')

// Admin middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// Get admin dashboard data
router.get('/dashboard', authenticateToken, adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalQuestions,
      totalAnswers,
      pendingContent,
      reportedContent,
      recentUsers,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      Answer.countDocuments(),
      Question.find({ status: 'pending' }).populate('author', 'username').limit(10),
      Question.find({ reports: { $exists: true, $ne: [] } }).populate('author', 'username').limit(10),
      User.find().sort({ createdAt: -1 }).limit(10).select('username email createdAt reputation'),
      Question.find().sort({ createdAt: -1 }).limit(10).populate('author', 'username')
    ])

    const stats = {
      totalUsers,
      totalQuestions,
      totalAnswers,
      mostPopularTag: 'javascript', // This would need to be calculated
      activeTags: await Tag.countDocuments({ isActive: true })
    }

    res.json({
      stats,
      pendingContent,
      reportedContent,
      recentUsers,
      recentActivity
    })
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get tags management data
router.get('/tags', authenticateToken, adminAuth, async (req, res) => {
  try {
    const tags = await Tag.find().sort({ questionCount: -1 })
    
    const stats = {
      totalTags: tags.length,
      taggedQuestions: tags.reduce((sum, tag) => sum + tag.questionCount, 0),
      mostPopularTag: tags[0]?.name || 'None',
      activeTags: tags.filter(tag => tag.isActive).length
    }

    res.json({ tags, stats })
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create tag
router.post('/tags', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { name, description, color } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' })
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: name.toLowerCase() })
    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' })
    }

    const tag = new Tag({
      name: name.toLowerCase(),
      description,
      color: color || '#3B82F6'
    })

    await tag.save()
    res.status(201).json(tag)
  } catch (error) {
    console.error('Error creating tag:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update tag
router.put('/tags/:id', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { name, description, color, isActive } = req.body
    const tag = await Tag.findById(req.params.id)

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' })
    }

    if (name) tag.name = name.toLowerCase()
    if (description !== undefined) tag.description = description
    if (color) tag.color = color
    if (isActive !== undefined) tag.isActive = isActive

    await tag.save()
    res.json(tag)
  } catch (error) {
    console.error('Error updating tag:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete tag
router.delete('/tags/:id', authenticateToken, adminAuth, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id)

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' })
    }

    // Check if tag is being used
    if (tag.questionCount > 0) {
      return res.status(400).json({ message: 'Cannot delete tag that is being used' })
    }

    await tag.deleteOne()
    res.json({ message: 'Tag deleted successfully' })
  } catch (error) {
    console.error('Error deleting tag:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Approve content
router.post('/:contentType/:contentId/approve', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params
    let content

    if (contentType === 'questions') {
      content = await Question.findByIdAndUpdate(
        contentId,
        { status: 'approved' },
        { new: true }
      )
    } else if (contentType === 'answers') {
      content = await Answer.findByIdAndUpdate(
        contentId,
        { status: 'approved' },
        { new: true }
      )
    }

    if (!content) {
      return res.status(404).json({ message: 'Content not found' })
    }

    res.json(content)
  } catch (error) {
    console.error('Error approving content:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Reject content
router.post('/:contentType/:contentId/reject', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params
    const { reason } = req.body
    let content

    if (contentType === 'questions') {
      content = await Question.findByIdAndUpdate(
        contentId,
        { 
          status: 'rejected',
          rejectionReason: reason
        },
        { new: true }
      )
    } else if (contentType === 'answers') {
      content = await Answer.findByIdAndUpdate(
        contentId,
        { 
          status: 'rejected',
          rejectionReason: reason
        },
        { new: true }
      )
    }

    if (!content) {
      return res.status(404).json({ message: 'Content not found' })
    }

    res.json(content)
  } catch (error) {
    console.error('Error rejecting content:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Ban user
router.post('/users/:userId/ban', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { reason, duration } = req.body
    const user = await User.findById(req.params.userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.isBanned = true
    user.banReason = reason
    user.banExpiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null

    await user.save()
    res.json(user)
  } catch (error) {
    console.error('Error banning user:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Unban user
router.post('/users/:userId/unban', authenticateToken, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.isBanned = false
    user.banReason = null
    user.banExpiresAt = null

    await user.save()
    res.json(user)
  } catch (error) {
    console.error('Error unbanning user:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete content
router.delete('/:contentType/:contentId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params
    let content

    if (contentType === 'questions') {
      content = await Question.findByIdAndDelete(contentId)
    } else if (contentType === 'answers') {
      content = await Answer.findByIdAndDelete(contentId)
    }

    if (!content) {
      return res.status(404).json({ message: 'Content not found' })
    }

    res.json({ message: 'Content deleted successfully' })
  } catch (error) {
    console.error('Error deleting content:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
