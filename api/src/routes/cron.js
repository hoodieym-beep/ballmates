const express = require('express');
const { runReminders } = require('../cron/reminders');

const router = express.Router();

// Called by Vercel cron scheduler — protected by CRON_SECRET
router.post('/reminders', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers['authorization'];
    if (auth !== 'Bearer ' + secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  try {
    await runReminders();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
