const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { acceptAnswer } = require('../services/answerAcceptance');

// Import controllers
const answersController = require('../controllers/answersController');

// Create an answer
router.post('/:questionId', authenticateToken, async (req, res) => {
  try {
    console.log('📩 POST /api/answers/:questionId called')
    console.log('📩 Params:', req.params)
    console.log('📩 Body:', req.body)
    console.log('📩 User:', req.user)
    console.log('📩 Full URL:', req.originalUrl)
    
    const { content } = req.body
    const { questionId } = req.params
    
    if (!content) {
      console.log('❌ Content validation failed: content is required')
      return res.status(400).json({ message: 'Content is required.' })
    }
    
    console.log('📩 Looking for question with ID:', questionId)
    const question = await Question.findById(questionId)
    
    if (!question) {
      console.log('❌ Question not found with ID:', questionId)
      return res.status(404).json({ message: 'Question not found.' })
    }
    
    console.log('📩 Question found:', question.title)
    console.log('📩 Creating answer with content length:', content.length)
    
    const answer = await Answer.create({
      content,
      author: req.user._id,
      question: questionId,
    })
    
    console.log('📩 Answer created successfully with ID:', answer._id)
    
    // Answer count is automatically updated by Answer model pre-save middleware
    // Notify question author (if not self)
    if (String(question.author) !== String(req.user._id)) {
      console.log('📩 Creating notification for question author')
      try {
        await Notification.create({
          recipient: question.author,
          sender: req.user._id,
          type: 'answer',
          title: 'New Answer',
          content: `${req.user.username} answered your question: "${question.title}"`,
          questionId: question._id,
          answerId: answer._id,
        })
        console.log('📢 Answer notification created successfully')
      } catch (error) {
        console.error('❌ Error creating answer notification:', error)
      }
    }
    
    await answer.populate('author', 'username avatar reputation')
    console.log('✅ Answer created and populated successfully:', answer._id)
    res.status(201).json(answer)
  } catch (err) {
    console.error('❌ Error in POST /api/answers/:questionId:', err)
    console.error('❌ Error stack:', err.stack)
    res.status(500).json({ message: 'Internal Server Error', error: err.message })
  }
})

// Get all answers for a question
router.get('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const answers = await Answer.find({ question: questionId })
      .populate('author', 'username avatar reputation')
      .sort({ createdAt: 1 });
    res.json(answers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch answers', error: err.message });
  }
});

// Update an answer
router.put('/:answerId', authenticateToken, async (req, res) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;
    const answer = await Answer.findById(answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found.' });
    if (String(answer.author) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this answer.' });
    }
    answer.content = content || answer.content;
    await answer.save();
    await answer.populate('author', 'username avatar reputation');
    res.json(answer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update answer', error: err.message });
  }
});

// Delete an answer
router.delete('/:answerId', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/answers/:answerId called')
    console.log('🗑️ Answer ID:', req.params.answerId)
    console.log('🗑️ User ID:', req.user._id)
    
    const { answerId } = req.params;
    const answer = await Answer.findById(answerId);
    
    if (!answer || answer.isDeleted) {
      console.log('❌ Answer not found or already deleted')
      return res.status(404).json({ message: 'Answer not found.' });
    }
    
    if (String(answer.author) !== String(req.user._id)) {
      console.log('❌ User not authorized to delete this answer')
      return res.status(403).json({ message: 'Not authorized to delete this answer.' });
    }
    
    console.log('✅ User authorized, proceeding with deletion')
    // Answer count is automatically updated by Answer model pre-delete middleware
    await answer.deleteOne();
    console.log('✅ Answer deleted successfully')
    
    res.json({ message: 'Answer deleted successfully' });
  } catch (err) {
    console.error('❌ Delete answer error:', err)
    res.status(500).json({ message: 'Failed to delete answer', error: err.message });
  }
});

// Upvote an answer
router.post('/:answerId/upvote', authenticateToken, answersController.upvoteAnswer);

// Downvote an answer
router.post('/:answerId/downvote', authenticateToken, answersController.downvoteAnswer);

// Accept an answer (only question owner)
router.post('/:answerId/accept', authenticateToken, async (req, res) => {
  try {
    const { answerId } = req.params;
    const answer = await Answer.findById(answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found.' });

    const { answer: acceptedAnswer } = await acceptAnswer({
      questionId: answer.question,
      answerId,
      acceptedBy: req.user._id
    });

    res.json({ message: 'Answer accepted.', acceptedAnswer: acceptedAnswer._id });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Failed to accept answer' });
  }
});

module.exports = router;
