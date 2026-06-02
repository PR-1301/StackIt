const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['answer', 'comment', 'upvote', 'downvote', 'accepted'],
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  answerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
})

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, read: 1 })
notificationSchema.index({ createdAt: -1 })

// Virtuals for population
notificationSchema.virtual('question', {
  ref: 'Question',
  localField: 'questionId',
  foreignField: '_id',
  justOne: true
})
notificationSchema.virtual('answer', {
  ref: 'Answer',
  localField: 'answerId',
  foreignField: '_id',
  justOne: true
})
notificationSchema.virtual('comment', {
  ref: 'Comment',
  localField: 'commentId',
  foreignField: '_id',
  justOne: true
})

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true })
notificationSchema.set('toObject', { virtuals: true })

// Methods
notificationSchema.methods.markAsRead = async function() {
  this.read = true
  this.readAt = new Date()
  return this.save()
}

notificationSchema.methods.markAsUnread = async function() {
  this.read = false
  this.readAt = null
  return this.save()
}

// Static methods
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this({
    recipient: data.recipient,
    sender: data.sender,
    type: data.type,
    title: data.title,
    content: data.content,
    questionId: data.questionId,
    answerId: data.answerId,
    commentId: data.commentId
  })
  return notification.save()
}

notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  )
}

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, read: false })
}

// Pre-save middleware to limit notifications per user
notificationSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Keep only last 100 notifications per user
    const count = await this.constructor.countDocuments({ recipient: this.recipient })
    if (count >= 100) {
      const oldestNotification = await this.constructor
        .findOne({ recipient: this.recipient })
        .sort({ createdAt: 1 })
      if (oldestNotification) {
        await oldestNotification.deleteOne()
      }
    }
  }
  next()
})

module.exports = mongoose.model('Notification', notificationSchema)
