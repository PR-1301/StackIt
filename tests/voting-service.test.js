const mongoose = require('mongoose')
const Notification = require('../server/models/Notification')
const { applyVoteChange, voteOnContent } = require('../server/services/voting')

const objectId = () => new mongoose.Types.ObjectId()

describe('voting service', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('toggles votes and returns the correct reputation delta', () => {
    const voterId = objectId()
    const content = {
      votes: {
        upvotes: [],
        downvotes: [{ user: voterId }]
      }
    }

    const result = applyVoteChange(content, voterId, 'upvote')

    expect(result).toEqual({
      previousVoteStatus: 'downvote',
      voteStatus: 'upvote',
      reputationDelta: 12
    })
    expect(content.votes.upvotes).toHaveLength(1)
    expect(content.votes.downvotes).toHaveLength(0)
  })

  test('rejects voters without enough reputation before saving', async () => {
    const authorId = objectId()
    const content = {
      _id: objectId(),
      author: { _id: authorId },
      isDeleted: false,
      votes: { upvotes: [], downvotes: [] },
      save: jest.fn()
    }
    const model = {
      findById: jest.fn(() => ({
        populate: jest.fn().mockResolvedValue(content)
      }))
    }
    const voter = {
      _id: objectId(),
      canVote: jest.fn(() => false)
    }

    await expect(voteOnContent({
      model,
      contentId: content._id,
      voter,
      voteType: 'upvote',
      contentType: 'question'
    })).rejects.toMatchObject({
      message: 'Insufficient reputation to vote',
      statusCode: 403
    })

    expect(content.save).not.toHaveBeenCalled()
  })

  test('updates reputation on the populated author document', async () => {
    jest.spyOn(Notification, 'create').mockResolvedValue({})

    const authorId = objectId()
    const voterId = objectId()
    const content = {
      _id: objectId(),
      author: {
        _id: authorId,
        updateReputation: jest.fn().mockResolvedValue(undefined)
      },
      isDeleted: false,
      votes: { upvotes: [], downvotes: [] },
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(undefined),
      get voteCount() {
        return this.votes.upvotes.length - this.votes.downvotes.length
      },
      get totalVotes() {
        return this.votes.upvotes.length + this.votes.downvotes.length
      }
    }
    const model = {
      findById: jest.fn(() => ({
        populate: jest.fn().mockResolvedValue(content)
      }))
    }
    const voter = {
      _id: voterId,
      canVote: jest.fn(() => true)
    }

    const result = await voteOnContent({
      model,
      contentId: content._id,
      voter,
      voteType: 'upvote',
      contentType: 'question'
    })

    expect(content.author.updateReputation).toHaveBeenCalledWith(10)
    expect(result.voteStatus).toBe('upvote')
    expect(result.voteCount).toBe(1)
  })
})
