require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { runReminders } = require('./cron/reminders');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const motmRoutes = require('./routes/motm');
const reminderRoutes = require('./routes/reminders');
const reportRoutes = require('./routes/reports');
const cronRoutes = require('./routes/cron');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

const jwt = require('jsonwebtoken');

io.on('connection', (socket) => {
  // Join personal room so we can push private messages
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.userId) socket.join('user:' + decoded.userId);
    } catch (_) {}
  }

  socket.on('join:session', (sessionId) => socket.join('session:' + sessionId));
  socket.on('leave:session', (sessionId) => socket.leave('session:' + sessionId));
});

app.use(cors());
app.use(express.json());

// Ensure DB is connected before every request (cached after first call)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    res.status(503).json({ error: 'Database unavailable' });
  }
});

app.get('/health', async (req, res) => {
  try {
    await connectDB();
    const mongoose = require('mongoose');
    const dbOk = mongoose.connection.readyState === 1;
    res.status(dbOk ? 200 : 503).json({ ok: dbOk, db: dbOk ? 'connected' : 'disconnected' });
  } catch (e) {
    res.status(503).json({ ok: false, db: 'disconnected', error: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sessions', motmRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cron', cronRoutes);

app.use(errorHandler);

// Run reminders every minute (local dev; Vercel still uses /api/cron/reminders endpoint)
cron.schedule('* * * * *', async () => {
  try {
    await connectDB();
    await runReminders();
  } catch (e) {
    console.error('Reminder cron error:', e.message);
  }
});

// Only start HTTP server when run directly (local dev), not in serverless
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
