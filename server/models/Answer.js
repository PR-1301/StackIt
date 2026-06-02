const mongoose = require('mongoose')

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    minlength: 20
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  votes: {
    upvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    downvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: Date,
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'offensive', 'other']
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
answerSchema.index({ question: 1, createdAt: 1 })
answerSchema.index({ author: 1, createdAt: -1 })
answerSchema.index({ 'votes.upvotes': -1 })
answerSchema.index({ isAccepted: 1 })

// Virtual for vote count
answerSchema.virtual('voteCount').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length
})

// Virtual for total votes
answerSchema.virtual('totalVotes').get(function() {
  return this.votes.upvotes.length + this.votes.downvotes.length
})

// Methods
answerSchema.methods.addVote = async function(userId, voteType) {
  const userVoteIndex = this.votes.upvotes.findIndex(vote => vote.user.toString() === userId.toString())
  const userDownvoteIndex = this.votes.downvotes.findIndex(vote => vote.user.toString() === userId.toString())

  // Remove existing vote
  if (userVoteIndex > -1) {
    this.votes.upvotes.splice(userVoteIndex, 1)
  }
  if (userDownvoteIndex > -1) {
    this.votes.downvotes.splice(userDownvoteIndex, 1)
  }

  // Add new vote
  if (voteType === 'upvote') {
    this.votes.upvotes.push({ user: userId })
  } else if (voteType === 'downvote') {
    this.votes.downvotes.push({ user: userId })
  }

  return this.save()
}

answerSchema.methods.removeVote = async function(userId) {
  this.votes.upvotes = this.votes.upvotes.filter(vote => vote.user.toString() !== userId.toString())
  this.votes.downvotes = this.votes.downvotes.filter(vote => vote.user.toString() !== userId.toString())
  return this.save()
}

answerSchema.methods.accept = async function(acceptedBy) {
  this.isAccepted = true
  this.acceptedAt = new Date()
  this.acceptedBy = acceptedBy
  return this.save()
}

answerSchema.methods.unaccept = async function() {
  this.isAccepted = false
  this.acceptedAt = null
  this.acceptedBy = null
  return this.save()
}

answerSchema.methods.softDelete = async function(deletedBy) {
  this.isDeleted = true
  this.deletedAt = new Date()
  this.deletedBy = deletedBy
  return this.save()
}

// Pre-save middleware to update question's answer count
answerSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Increment answer count on question
    const Question = mongoose.model('Question')
    await Question.findByIdAndUpdate(this.question, { $inc: { answerCount: 1 } })
  }
  next()
})

// Pre-delete middleware to decrement question's answer count
answerSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const Question = mongoose.model('Question')
  const update = { $inc: { answerCount: -1 } }

  if (this.isAccepted) {
    update.$unset = { acceptedAnswer: '' }
  }

  await Question.findByIdAndUpdate(this.question, update)
  next()
})

// JSON serialization
answerSchema.methods.toJSON = function() {
  const answer = this.toObject()
  answer.voteCount = this.voteCount
  answer.totalVotes = this.totalVotes
  return answer
}

module.exports = mongoose.model('Answer', answerSchema)
