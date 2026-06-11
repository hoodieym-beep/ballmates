const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Session = require('../models/Session');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const messageLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, message: { error: 'Too many messages' } });

router.use(auth);

router.get('/sessions/:sessionId/messages', async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const isParticipant = session.participants.some((p) => p.userId.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const messages = await Message.find({ sessionId: req.params.sessionId, type: 'group' })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json(messages.reverse());
  } catch (e) {
    next(e);
  }
});

router.post(
  '/sessions/:sessionId/messages',
  messageLimiter,
  [body('body').trim().notEmpty().isLength({ max: 2000 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
      const session = await Session.findById(req.params.sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      const isParticipant = session.participants.some((p) => p.userId.toString() === req.user._id.toString());
      if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });
      const msg = await Message.create({
        sessionId: req.params.sessionId,
        senderId: req.user._id,
        type: 'group',
        body: req.body.body,
      });
      const populated = await Message.findById(msg._id).populate('senderId', 'name avatar').lean();

      const io = req.app.get('io');
      if (io) {
        io.to('session:' + req.params.sessionId).emit('message:new', populated);
      }

      res.status(201).json(populated);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/private', async (req, res, next) => {
  try {
    const otherUserId = req.query.with;
    if (!otherUserId) {
      const myId = req.user._id.toString();
      const convoMessages = await Message.find({
        type: 'private',
        $or: [
          { senderId: req.user._id },
          { recipientId: req.user._id },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      const latestByUserId = new Map();
      convoMessages.forEach((msg) => {
        const sender = msg.senderId ? msg.senderId.toString() : null;
        const recipient = msg.recipientId ? msg.recipientId.toString() : null;
        const otherId = sender === myId ? recipient : sender;
        if (!otherId || latestByUserId.has(otherId)) return;
        latestByUserId.set(otherId, {
          latestMessage: msg.body,
          latestMessageAt: msg.createdAt,
        });
      });

      const allIds = Array.from(latestByUserId.keys());
      const User = require('../models/User');
      const users = await User.find({ _id: { $in: allIds } }).select('name avatar').lean();

      const byId = new Map(users.map((u) => [u._id.toString(), u]));
      const payload = [];
      allIds.forEach((id) => {
        const u = byId.get(id);
        if (!u) return;
        const latest = latestByUserId.get(id) || {};
        payload.push({
          ...u,
          latestMessage: latest.latestMessage || '',
          latestMessageAt: latest.latestMessageAt || null,
        });
      });

      return res.json(payload);
    }

    const messages = await Message.find({
      type: 'private',
      $or: [
        { senderId: req.user._id, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: req.user._id },
      ],
    })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();
    res.json(messages);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/private',
  messageLimiter,
  [body('recipientId').notEmpty(), body('body').trim().notEmpty().isLength({ max: 2000 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
      const msg = await Message.create({
        senderId: req.user._id,
        recipientId: req.body.recipientId,
        type: 'private',
        body: req.body.body,
      });
      const populated = await Message.findById(msg._id).populate('senderId', 'name avatar').lean();

      const io = req.app.get('io');
      if (io) {
        io.to('user:' + req.body.recipientId).emit('private:message', populated);
        io.to('user:' + req.body.recipientId).emit('private:message:list');
      }

      res.status(201).json(populated);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
