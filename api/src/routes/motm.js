const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const MotmVote = require('../models/MotmVote');
const Session = require('../models/Session');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/:id/motm', auth, [body('nominatedUserId').isMongoId()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const votingOpen = session.status === 'completed';
    if (!votingOpen) return res.status(400).json({ error: 'Voting is only open after the session has ended' });

    const isParticipant = session.participants.some((p) => p.userId.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

    const nominatedUserId = req.body.nominatedUserId;
    if (nominatedUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot vote for yourself' });
    }

    const nomineeIsParticipant = session.participants.some(
      (p) => p.userId.toString() === nominatedUserId.toString()
    );
    if (!nomineeIsParticipant) {
      return res.status(400).json({ error: 'Nominated user is not a participant' });
    }

    await MotmVote.findOneAndUpdate(
      { sessionId: req.params.id, voterId: req.user._id },
      {
        $set: {
          nominatedUserId: new mongoose.Types.ObjectId(nominatedUserId),
          createdAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Build updated vote data and broadcast to all session participants
    const allVotes = await MotmVote.find({ sessionId: req.params.id })
      .populate('nominatedUserId', 'name avatar')
      .lean();
    const counts = {};
    allVotes.forEach((v) => {
      const id = v.nominatedUserId?._id ? String(v.nominatedUserId._id) : null;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });

    const io = req.app.get('io');
    if (io) {
      io.to('session:' + req.params.id).emit('motm:updated', { votes: counts, list: allVotes, votingOpen: true });
    }

    res.status(200).json({ votes: counts, list: allVotes, votingOpen: true });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/motm', auth, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).select('status participants');
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isParticipant = session.participants.some((p) => p.userId.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

    const votingOpen = session.status === 'completed';
    const votes = await MotmVote.find({ sessionId: req.params.id }).populate('nominatedUserId', 'name avatar').lean();
    const counts = {};
    votes.forEach((v) => {
      const id = v.nominatedUserId && v.nominatedUserId._id ? String(v.nominatedUserId._id) : null;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    res.json({ votes: counts, list: votes, votingOpen });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
