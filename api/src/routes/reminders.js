const express = require('express');
const { body, validationResult } = require('express-validator');
const Reminder = require('../models/Reminder');
const Session = require('../models/Session');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/sessions/:id/remind', async (req, res, next) => {
  try {
    const exists = await Reminder.exists({
      sessionId: req.params.id,
      userId: req.user._id,
      sent: false,
    });
    res.json({ exists: !!exists });
  } catch (e) {
    next(e);
  }
});

router.post('/sessions/:id/remind', [
  body('remindAt').isISO8601(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const isParticipant = session.participants.some((p) => p.userId.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });
    const reminder = await Reminder.create({
      sessionId: req.params.id,
      userId: req.user._id,
      remindAt: new Date(req.body.remindAt),
    });
    res.status(201).json(reminder);
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const list = await Reminder.find({ userId: req.user._id, sent: false })
      .populate('sessionId', 'date time pitch')
      .sort({ remindAt: 1 })
      .lean();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// Called when the user opens the app — returns any due reminders and marks them sent
router.post('/check', async (req, res, next) => {
  try {
    const due = await Reminder.find({
      userId: req.user._id,
      remindAt: { $lte: new Date() },
      sent: false,
    })
      .populate('sessionId', 'date time pitch')
      .lean();

    if (due.length) {
      const ids = due.map((r) => r._id);
      await Reminder.updateMany({ _id: { $in: ids } }, { sent: true });
    }

    res.json(due);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
