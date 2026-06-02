const Answer = require('../models/Answer');
const { voteOnContent, sendVoteResponse } = require('../services/voting');

// Upvote Answer
exports.upvoteAnswer = async (req, res) => {
  try {
    const result = await voteOnContent({
      model: Answer,
      contentId: req.params.answerId,
      voter: req.user,
      voteType: 'upvote',
      contentType: 'answer'
    });

    sendVoteResponse(res, { ...result, contentType: 'answer' });
  } catch (error) {
    console.error('❌ Upvote error:', error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Server error', error: error.message });
  }
};

// Downvote Answer
exports.downvoteAnswer = async (req, res) => {
  try {
    const result = await voteOnContent({
      model: Answer,
      contentId: req.params.answerId,
      voter: req.user,
      voteType: 'downvote',
      contentType: 'answer'
    });

    sendVoteResponse(res, { ...result, contentType: 'answer' });
  } catch (error) {
    console.error('❌ Downvote error:', error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Server error', error: error.message });
  }
}; 
