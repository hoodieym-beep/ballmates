const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const Session = require('../models/Session');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.post('/', [
  body('sessionId').notEmpty(),
  body('reason').trim().notEmpty(),
  body('description').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const session = await Session.findById(req.body.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const report = await Report.create({
      sessionId: req.body.sessionId,
      reporterId: req.user._id,
      reason: req.body.reason,
      description: req.body.description || '',
    });
    res.status(201).json(report);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
