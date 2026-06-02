const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const Notification = require('../models/Notification')

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username')
      .populate('question', 'title')
      .populate('answer', 'content')
      .populate('comment', 'content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Notification.countDocuments({ recipient: req.user._id })
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      read: false 
    })

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    // Check if user owns the notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    notification.read = true
    notification.readAt = Date.now()
    await notification.save()

    res.json(notification)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: Date.now() }
    )

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    // Check if user owns the notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await notification.deleteOne()
    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id, 
      read: false 
    })

    res.json({ unreadCount: count })
  } catch (error) {
    console.error('Error getting unread count:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
