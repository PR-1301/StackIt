jest.mock('../server/models/Answer', () => ({
  findById: jest.fn(),
  updateMany: jest.fn()
}))

jest.mock('../server/models/Question', () => ({
  findById: jest.fn()
}))

jest.mock('../server/models/User', () => ({
  findById: jest.fn()
}))

jest.mock('../server/models/Notification', () => ({
  create: jest.fn()
}))

const Answer = require('../server/models/Answer')
const Question = require('../server/models/Question')
const User = require('../server/models/User')
const Notification = require('../server/models/Notification')
const { acceptAnswer } = require('../server/services/answerAcceptance')

describe('answer acceptance service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('keeps question and answer acceptance state synchronized', async () => {
    const question = {
      _id: 'question-1',
      author: 'owner-1',
      acceptedAnswer: 'old-answer',
      isDeleted: false,
      save: jest.fn().mockResolvedValue()
    }
    const answer = {
      _id: 'answer-1',
      author: 'answer-author',
      question: 'question-1',
      isAccepted: false,
      isDeleted: false,
      save: jest.fn().mockResolvedValue()
    }
    const answerAuthor = {
      updateReputation: jest.fn().mockResolvedValue()
    }

    Question.findById.mockResolvedValue(question)
    Answer.findById.mockResolvedValue(answer)
    Answer.updateMany.mockResolvedValue({ modifiedCount: 1 })
    User.findById.mockResolvedValue(answerAuthor)
    Notification.create.mockResolvedValue({})

    const result = await acceptAnswer({
      questionId: 'question-1',
      answerId: 'answer-1',
      acceptedBy: 'owner-1'
    })

    expect(Answer.updateMany).toHaveBeenCalledWith(
      {
        question: 'question-1',
        _id: { $ne: 'answer-1' },
        isAccepted: true
      },
      {
        $set: { isAccepted: false },
        $unset: { acceptedAt: '', acceptedBy: '' }
      }
    )
    expect(answer.isAccepted).toBe(true)
    expect(answer.acceptedBy).toBe('owner-1')
    expect(answer.save).toHaveBeenCalled()
    expect(question.acceptedAnswer).toBe('answer-1')
    expect(question.save).toHaveBeenCalled()
    expect(answerAuthor.updateReputation).toHaveBeenCalledWith(15)
    expect(Notification.create).toHaveBeenCalledWith({
      recipient: 'answer-author',
      sender: 'owner-1',
      type: 'accepted',
      title: 'Answer Accepted',
      content: 'Your answer was accepted!',
      questionId: 'question-1',
      answerId: 'answer-1'
    })
    expect(result.wasAlreadyAccepted).toBe(false)
  })

  test('rejects accepting an answer that belongs to another question', async () => {
    Question.findById.mockResolvedValue({
      _id: 'question-1',
      author: 'owner-1',
      isDeleted: false
    })
    Answer.findById.mockResolvedValue({
      _id: 'answer-1',
      author: 'answer-author',
      question: 'other-question',
      isDeleted: false
    })

    await expect(acceptAnswer({
      questionId: 'question-1',
      answerId: 'answer-1',
      acceptedBy: 'owner-1'
    })).rejects.toMatchObject({
      message: 'Answer does not belong to this question',
      statusCode: 400
    })

    expect(Answer.updateMany).not.toHaveBeenCalled()
    expect(User.findById).not.toHaveBeenCalled()
    expect(Notification.create).not.toHaveBeenCalled()
  })
})
