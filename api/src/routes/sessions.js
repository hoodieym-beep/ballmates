const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Returns all sessions the logged-in user is part of (active + completed + cancelled)
router.get('/mine', auth, async (req, res, next) => {
  try {
    const sessions = await Session.find({ 'participants.userId': req.user._id })
      .populate('organiserId', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .sort({ date: -1 })
      .lean();
    res.json(sessions);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const q = { status: 'active' };
    if (req.query.dateFrom) {
      q.date = q.date || {};
      q.date.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      q.date = q.date || {};
      q.date.$lte = new Date(req.query.dateTo);
    }
    if (req.query.beginnerFriendly === 'true') q.isBeginnerFriendly = true;
    if (req.query.hasReferee === 'true') q.hasReferee = true;
    const sessions = await Session.find(q)
      .populate('organiserId', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .sort({ date: 1 })
      .lean();
    res.json(sessions);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await Session.findById(req.params.id)
      .populate('organiserId', 'name avatar email')
      .populate('participants.userId', 'name avatar')
      .lean();
    if (!s) return res.status(404).json({ error: 'Session not found' });
    res.json(s);
  } catch (e) {
    next(e);
  }
});

router.post('/', auth, [
  body('pitch').isObject(),
  body('pitch.name').notEmpty(),
  body('pitch.address').notEmpty(),
  body('pitch.lat').isNumeric(),
  body('pitch.lng').isNumeric(),
  body('date').isISO8601(),
  body('time').notEmpty(),
  body('maxPlayers').isInt({ min: 2 }),
  body('rules').optional().trim(),
  body('hasReferee').optional().isBoolean(),
  body('isBeginnerFriendly').optional().isBoolean(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const session = await Session.create({
      ...req.body,
      organiserId: req.user._id,
      participants: [{ userId: req.user._id, role: 'organiser' }],
    });
    const populated = await Session.findById(session._id)
      .populate('organiserId', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .lean();
    res.status(201).json(populated);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    const isOrganiser = s.participants.some(
      (p) => p.userId.toString() === req.user._id.toString() && p.role === 'organiser'
    );
    if (!isOrganiser) return res.status(403).json({ error: 'Only organiser can update' });
    const allowed = ['pitch', 'date', 'time', 'maxPlayers', 'rules', 'hasReferee', 'isBeginnerFriendly'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) s[k] = req.body[k]; });
    await s.save();
    const populated = await Session.findById(s._id)
      .populate('organiserId', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .lean();
    res.json(populated);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    const isOrganiser = s.participants.some(
      (p) => p.userId.toString() === req.user._id.toString() && p.role === 'organiser'
    );
    if (!isOrganiser) return res.status(403).json({ error: 'Only organiser can cancel' });
    s.status = 'cancelled';
    await s.save();
    res.json({ message: 'Session cancelled' });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/complete', auth, async (req, res, next) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    const isOrganiser = s.participants.some(
      (p) => p.userId.toString() === req.user._id.toString() && p.role === 'organiser'
    );
    if (!isOrganiser) return res.status(403).json({ error: 'Only organiser can end session' });
    if (s.status !== 'active') return res.status(400).json({ error: 'Session is not active' });
    s.status = 'completed';
    await s.save();
    const populated = await Session.findById(s._id)
      .populate('organiserId', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .lean();

    const io = req.app.get('io');
    if (io) {
      io.to('session:' + req.params.id).emit('session:completed', populated);
    }

    res.json(populated);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/join', auth, async (req, res, next) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    if (s.status !== 'active') return res.status(400).json({ error: 'Session is not active' });
    if (!req.user.codeOfConductAcceptedAt) return res.status(403).json({ error: 'You must accept the code of conduct before joining sessions' });
    const already = s.participants.some((p) => p.userId.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ error: 'Already joined' });
    if (s.participants.length >= s.maxPlayers) return res.status(400).json({ error: 'Session is full' });
    s.participants.push({ userId: req.user._id, role: 'player' });
    await s.save();
    const populated = await Session.findById(s._id)
      .populate('organiserId', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .lean();
    res.json(populated);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/leave', auth, async (req, res, next) => {
  try {
    const s = await Session.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    const organiser = s.participants.find((p) => p.role === 'organiser');
    if (organiser && organiser.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Organiser cannot leave; cancel session instead' });
    }
    s.participants = s.participants.filter((p) => p.userId.toString() !== req.user._id.toString());
    await s.save();
    const populated = await Session.findById(s._id)
      .populate('organiserId', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .lean();
    res.json(populated);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
