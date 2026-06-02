const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const Comment = require('../models/Comment')
const Question = require('../models/Question')
const Answer = require('../models/Answer')
const Notification = require('../models/Notification')

// Create a comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { contentType, contentId, content } = req.body

    if (!contentType || !contentId || !content) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const comment = new Comment({
      author: req.user._id,
      contentType,
      contentId,
      content
    })

    await comment.save()

    // Populate author info
    await comment.populate('author', 'username')

    // Update the parent content's comment count
    if (contentType === 'question') {
      const question = await Question.findById(contentId).populate('author', 'username');
      if (question) {
        await Question.findByIdAndUpdate(contentId, { $inc: { commentCount: 1 } });
        
        // Create notification for question author (if not self)
        if (question.author._id.toString() !== req.user._id.toString()) {
          try {
            const notification = await Notification.create({
              recipient: question.author._id,
              sender: req.user._id,
              type: 'comment',
              questionId: question._id,
              commentId: comment._id
            });
            console.log('📩 Notification created:', notification);
          } catch (error) {
            console.error('❌ Error creating question comment notification:', error);
          }
        }
      }
    } else if (contentType === 'answer') {
      const answer = await Answer.findById(contentId).populate('author', 'username');
      if (answer) {
        await Answer.findByIdAndUpdate(contentId, { $inc: { commentCount: 1 } });
        
        // Create notification for answer author (if not self)
        if (answer.author._id.toString() !== req.user._id.toString()) {
          try {
            const notification = await Notification.create({
              recipient: answer.author._id,
              sender: req.user._id,
              type: 'comment',
              questionId: answer.question,
              answerId: answer._id,
              commentId: comment._id
            });
            console.log('📩 Notification created:', notification);
          } catch (error) {
            console.error('❌ Error creating answer comment notification:', error);
          }
        }
      }
    }

    res.status(201).json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get comments for content
router.get('/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params

    const comments = await Comment.find({ contentType, contentId })
      .populate('author', 'username')
      .sort({ createdAt: -1 })

    res.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update a comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Check if user owns the comment or is admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    comment.content = content
    comment.updatedAt = Date.now()
    await comment.save()

    await comment.populate('author', 'username')
    res.json(comment)
  } catch (error) {
    console.error('Error updating comment:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete a comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Check if user owns the comment or is admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Update the parent content's comment count
    if (comment.contentType === 'question') {
      await Question.findByIdAndUpdate(comment.contentId, { $inc: { commentCount: -1 } })
    } else if (comment.contentType === 'answer') {
      await Answer.findByIdAndUpdate(comment.contentId, { $inc: { commentCount: -1 } })
    }

    await comment.deleteOne()
    res.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
