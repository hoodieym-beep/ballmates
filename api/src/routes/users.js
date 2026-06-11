const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const MotmVote = require('../models/MotmVote');
const authMiddleware = require('../middleware/auth').auth;

const router = express.Router();
router.use(authMiddleware);

router.get('/me', (req, res) => res.json(req.user));

router.patch('/me', [
  body('name').optional().trim().notEmpty(),
  body('bio').optional().trim(),
  body('preferredPosition').optional().trim(),
  body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('locale').optional().trim(),
  body('pushToken').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const allowed = ['name', 'bio', 'preferredPosition', 'experienceLevel', 'locale', 'pushToken'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/me/stats', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const gamesPlayed = await Session.countDocuments({ participants: { $elemMatch: { userId } }, status: { $in: ['active', 'completed'] } });

    const userSessions = await Session.find({ participants: { $elemMatch: { userId } }, status: 'completed' }).select('_id').lean();
    const sessionIds = userSessions.map((s) => s._id);
    const motmWins = await MotmVote.aggregate([
      { $match: { sessionId: { $in: sessionIds } } },
      { $group: { _id: '$sessionId', votes: { $push: { nominatedUserId: '$nominatedUserId' } } } },
      {
        $addFields: {
          voteCount: {
            $map: {
              input: { $setUnion: [{ $map: { input: '$votes', as: 'v', in: '$$v.nominatedUserId' } }] },
              as: 'uid',
              in: { userId: '$$uid', count: { $size: { $filter: { input: '$votes', as: 'v', cond: { $eq: ['$$v.nominatedUserId', '$$uid'] } } } } },
            },
          },
        },
      },
      { $addFields: { maxVotes: { $max: '$voteCount.count' } } },
      { $match: { 'voteCount.userId': userId, 'voteCount.count': { $eq: '$maxVotes' } } },
      { $count: 'wins' },
    ]);

    const motmCount = motmWins.length > 0 ? motmWins[0].wins : 0;
    res.json({ gamesPlayed, motmCount });
  } catch (e) {
    next(e);
  }
});

// Get all players who share sessions with the current user (for starting new chats)
router.get('/me/players', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sessions = await Session.find({ 'participants.userId': userId })
      .select('participants')
      .lean();
    const seen = new Set();
    seen.add(String(userId));
    const playerIds = [];
    sessions.forEach((s) => {
      (s.participants || []).forEach((p) => {
        const pid = String(p.userId);
        if (!seen.has(pid)) {
          seen.add(pid);
          playerIds.push(p.userId);
        }
      });
    });
    const players = await User.find({ _id: { $in: playerIds } })
      .select('name avatar preferredPosition experienceLevel')
      .lean();
    res.json(players);
  } catch (e) {
    next(e);
  }
});

// Get a user's public profile by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -pushToken').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
