const mongoose = require('mongoose');

const motmVoteSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nominatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

motmVoteSchema.index({ sessionId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('MotmVote', motmVoteSchema);
