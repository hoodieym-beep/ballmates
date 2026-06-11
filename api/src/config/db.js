const mongoose = require('mongoose');

// Cache connection across serverless invocations
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn('No MONGODB_URI or MONGO_URI set — using localhost fallback');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri || 'mongodb://localhost:27017/ballmates');
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
