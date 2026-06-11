const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth').auth;
const rateLimit = require('express-rate-limit');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 900000, max: 20, message: { error: 'Too many attempts' } });

router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('bio').optional().trim(),
  body('preferredPosition').optional().trim(),
  body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const { email, password, name, bio, preferredPosition, experienceLevel } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      name,
      ...(bio != null && bio !== '' && { bio: bio.trim() }),
      ...(preferredPosition != null && preferredPosition !== '' && { preferredPosition: preferredPosition.trim() }),
      ...(experienceLevel && { experienceLevel }),
      termsAcceptedAt: req.body.acceptTerms ? new Date() : null,
    });
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d').trim();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn });
    const u = user.toObject();
    delete u.passwordHash;
    res.status(201).json({ user: u, token });
  } catch (e) {
    next(e);
  }
});

router.post('/login', authLimiter, [body('email').isEmail().normalizeEmail(), body('password').exists()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d').trim();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn });
    const u = user.toObject();
    delete u.passwordHash;
    res.json({ user: u, token });
  } catch (e) {
    next(e);
  }
});

router.get('/me', authMiddleware, (req, res) => res.json(req.user));

module.exports = router;
