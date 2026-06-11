const Reminder = require('../models/Reminder');
const User = require('../models/User');
const Expo = require('expo-server-sdk').Expo;

const expo = new Expo();

async function runReminders() {
  const reminders = await Reminder.find({ remindAt: { $lte: new Date() }, sent: false })
    .populate('sessionId', 'date time pitch')
    .lean();

  if (!reminders.length) return;

  const userIds = [...new Set(reminders.map((r) => String(r.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select('pushToken').lean();
  const userMap = {};
  users.forEach((u) => { userMap[String(u._id)] = u; });

  const messages = [];
  const remindersToMark = [];

  reminders.forEach((rem) => {
    const user = userMap[String(rem.userId)];
    remindersToMark.push(rem._id);
    if (!user || !user.pushToken || !Expo.isExpoPushToken(user.pushToken)) return;
    const session = rem.sessionId;
    const body = session
      ? 'Reminder: Session at ' + (session.pitch?.name) + ' on ' + new Date(session.date).toLocaleDateString() + ' at ' + session.time
      : 'Reminder: You have a session soon.';
    messages.push({ to: user.pushToken, sound: 'default', body });
  });

  await Promise.all([
    messages.length ? expo.sendPushNotificationsAsync(messages) : Promise.resolve(),
    Reminder.updateMany({ _id: { $in: remindersToMark } }, { sent: true }),
  ]);
}

module.exports = { runReminders };
