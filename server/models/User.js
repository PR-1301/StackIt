const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  oauthProviders: {
    google: {
      id: String,
      email: String
    },
    twitter: {
      id: String,
      username: String
    }
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  reputation: {
    type: Number,
    default: 1
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  badges: [{
    name: String,
    description: String,
    awardedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  lastSeen: {
    type: Date,
    default: Date.now
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  }
}, {
  timestamps: true
})

// Indexes
userSchema.index({ username: 1 })
userSchema.index({ email: 1 })
userSchema.index({ reputation: -1 })
userSchema.index({ 'oauthProviders.google.id': 1 }, { sparse: true })
userSchema.index({ 'oauthProviders.twitter.id': 1 }, { sparse: true })

// Virtual for question count
userSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'author',
  count: true
})

// Virtual for answer count
userSchema.virtual('answerCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'author',
  count: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Update reputation method
userSchema.methods.updateReputation = async function(points) {
  this.reputation = Math.max(1, this.reputation + points)
  return this.save()
}

// Check if user can perform action based on reputation
userSchema.methods.canVote = function() {
  return this.reputation >= 15
}

userSchema.methods.canComment = function() {
  return this.reputation >= 50
}

userSchema.methods.canEditOthers = function() {
  return this.reputation >= 2000
}

userSchema.methods.canModerate = function() {
  return this.reputation >= 10000 || this.role === 'moderator' || this.role === 'admin'
}

// JSON serialization
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

module.exports = mongoose.model('User', userSchema)
