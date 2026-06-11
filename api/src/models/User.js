const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  bio: { type: String, default: '', trim: true },
  avatar: { type: String, default: null },
  preferredPosition: { type: String, default: '' },
  experienceLevel: { type: String, default: 'intermediate', enum: ['beginner', 'intermediate', 'advanced'] },
  locale: { type: String, default: 'en' },
  pushToken: { type: String, default: null },
  termsAcceptedAt: { type: Date, default: null },
  codeOfConductAcceptedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
