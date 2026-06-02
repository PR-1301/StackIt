const mongoose = require('mongoose')
const Notification = require('../server/models/Notification')

describe('Notification model', () => {
  test('allows answer notifications with title and content payload fields', () => {
    const notification = new Notification({
      recipient: new mongoose.Types.ObjectId(),
      sender: new mongoose.Types.ObjectId(),
      type: 'answer',
      title: 'New Answer',
      content: 'A user answered your question',
      questionId: new mongoose.Types.ObjectId(),
      answerId: new mongoose.Types.ObjectId()
    })

    expect(notification.validateSync()).toBeUndefined()
    expect(notification.title).toBe('New Answer')
    expect(notification.content).toBe('A user answered your question')
  })

  test('rejects unsupported notification types', () => {
    const notification = new Notification({
      recipient: new mongoose.Types.ObjectId(),
      sender: new mongoose.Types.ObjectId(),
      type: 'unsupported'
    })

    expect(notification.validateSync().errors.type).toBeDefined()
  })
})
