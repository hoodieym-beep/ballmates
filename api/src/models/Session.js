const mongoose = require('mongoose');

const pitchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  organiserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pitch: { type: pitchSchema, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  maxPlayers: { type: Number, required: true, min: 2 },
  rules: { type: String, default: '' },
  hasReferee: { type: Boolean, default: false },
  isBeginnerFriendly: { type: Boolean, default: true },
  status: { type: String, default: 'active', enum: ['active', 'cancelled', 'completed'] },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['organiser', 'player'], default: 'player' },
    joinedAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

sessionSchema.index({ date: 1, status: 1 });
sessionSchema.index({ 'pitch.lat': 1, 'pitch.lng': 1 });

module.exports = mongoose.model('Session', sessionSchema);
