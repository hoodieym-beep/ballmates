const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remindAt: { type: Date, required: true },
  sent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

reminderSchema.index({ remindAt: 1, sent: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
