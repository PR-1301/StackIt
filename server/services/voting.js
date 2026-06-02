const Notification = require('../models/Notification')

const REPUTATION_BY_VOTE = {
  upvote: 10,
  downvote: -2
}

class VoteError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

const getVoteStatus = (content, userId) => {
  const voterId = userId.toString()
  const upvoted = content.votes.upvotes.some(vote => vote.user.toString() === voterId)
  const downvoted = content.votes.downvotes.some(vote => vote.user.toString() === voterId)

  if (upvoted) return 'upvote'
  if (downvoted) return 'downvote'
  return null
}

const getReputationValue = voteType => REPUTATION_BY_VOTE[voteType] || 0

const applyVoteChange = (content, voterId, voteType) => {
  const previousVoteStatus = getVoteStatus(content, voterId)
  const nextVoteStatus = previousVoteStatus === voteType ? null : voteType
  const voterIdString = voterId.toString()

  content.votes.upvotes = content.votes.upvotes.filter(vote => vote.user.toString() !== voterIdString)
  content.votes.downvotes = content.votes.downvotes.filter(vote => vote.user.toString() !== voterIdString)

  if (nextVoteStatus === 'upvote') {
    content.votes.upvotes.push({ user: voterId })
  } else if (nextVoteStatus === 'downvote') {
    content.votes.downvotes.push({ user: voterId })
  }

  return {
    previousVoteStatus,
    voteStatus: nextVoteStatus,
    reputationDelta: getReputationValue(nextVoteStatus) - getReputationValue(previousVoteStatus)
  }
}

const createVoteNotification = async ({
  recipientId,
  senderId,
  voteType,
  contentType,
  questionId,
  answerId
}) => {
  if (!recipientId || recipientId.toString() === senderId.toString()) {
    return
  }

  try {
    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type: voteType,
      title: `${contentType === 'answer' ? 'Answer' : 'Question'} ${voteType}`,
      content: `Your ${contentType} was ${voteType === 'upvote' ? 'upvoted' : 'downvoted'}`,
      questionId,
      answerId
    })
  } catch (error) {
    console.error('Vote notification error:', error)
  }
}

const voteOnContent = async ({
  model,
  contentId,
  voter,
  voteType,
  contentType
}) => {
  if (!['upvote', 'downvote'].includes(voteType)) {
    throw new VoteError('Vote type must be upvote or downvote', 400)
  }

  const content = await model.findById(contentId).populate('author', 'username avatar reputation')

  if (!content || content.isDeleted) {
    throw new VoteError(`${contentType === 'answer' ? 'Answer' : 'Question'} not found`, 404)
  }

  if (!content.author || !content.author._id) {
    throw new VoteError(`${contentType === 'answer' ? 'Answer' : 'Question'} author not found`, 500)
  }

  if (!voter.canVote()) {
    throw new VoteError('Insufficient reputation to vote', 403)
  }

  if (content.author._id.toString() === voter._id.toString()) {
    throw new VoteError('You cannot vote on your own content', 403)
  }

  const { previousVoteStatus, voteStatus, reputationDelta } = applyVoteChange(content, voter._id, voteType)

  await content.save()

  if (reputationDelta !== 0 && typeof content.author.updateReputation === 'function') {
    await content.author.updateReputation(reputationDelta)
  }

  await content.populate('author', 'username avatar reputation')

  if (voteStatus === voteType && previousVoteStatus !== voteType) {
    await createVoteNotification({
      recipientId: content.author._id,
      senderId: voter._id,
      voteType,
      contentType,
      questionId: contentType === 'question' ? content._id : content.question,
      answerId: contentType === 'answer' ? content._id : undefined
    })
  }

  return {
    content,
    voteStatus,
    voteCount: content.voteCount,
    totalVotes: content.totalVotes
  }
}

const sendVoteResponse = (res, { content, voteStatus, voteCount, totalVotes, contentType }) => {
  res.status(200).json({
    message: 'Vote recorded successfully',
    voteStatus,
    voteCount,
    totalVotes,
    [contentType]: content
  })
}

module.exports = {
  VoteError,
  applyVoteChange,
  voteOnContent,
  sendVoteResponse
}
