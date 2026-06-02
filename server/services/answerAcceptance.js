const Answer = require('../models/Answer')
const Question = require('../models/Question')
const User = require('../models/User')
const Notification = require('../models/Notification')

const idsEqual = (left, right) => String(left) === String(right)

const acceptAnswer = async ({ questionId, answerId, acceptedBy }) => {
  const question = await Question.findById(questionId)
  if (!question || question.isDeleted) {
    const error = new Error('Question not found')
    error.statusCode = 404
    throw error
  }

  const answer = await Answer.findById(answerId)
  if (!answer || answer.isDeleted) {
    const error = new Error('Answer not found')
    error.statusCode = 404
    throw error
  }

  if (!idsEqual(answer.question, question._id)) {
    const error = new Error('Answer does not belong to this question')
    error.statusCode = 400
    throw error
  }

  if (!idsEqual(question.author, acceptedBy)) {
    const error = new Error('Only the question author can accept answers')
    error.statusCode = 403
    throw error
  }

  const wasAlreadyAccepted = question.acceptedAnswer &&
    idsEqual(question.acceptedAnswer, answer._id) &&
    answer.isAccepted

  await Answer.updateMany(
    {
      question: question._id,
      _id: { $ne: answer._id },
      isAccepted: true
    },
    {
      $set: { isAccepted: false },
      $unset: { acceptedAt: '', acceptedBy: '' }
    }
  )

  answer.isAccepted = true
  answer.acceptedAt = answer.acceptedAt || new Date()
  answer.acceptedBy = acceptedBy
  await answer.save()

  question.acceptedAnswer = answer._id
  await question.save()

  if (!wasAlreadyAccepted) {
    const answerAuthor = await User.findById(answer.author)
    if (answerAuthor) {
      await answerAuthor.updateReputation(15)
    }

    if (!idsEqual(answer.author, acceptedBy)) {
      await Notification.create({
        recipient: answer.author,
        sender: acceptedBy,
        type: 'accepted',
        title: 'Answer Accepted',
        content: 'Your answer was accepted!',
        questionId: question._id,
        answerId: answer._id
      })
    }
  }

  return { question, answer, wasAlreadyAccepted }
}

module.exports = {
  acceptAnswer
}
