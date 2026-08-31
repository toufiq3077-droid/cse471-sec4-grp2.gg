const mongoose = require('mongoose');

const globalCache = global.__khetIConnectionCache || {
  conn: null,
  promise: null,
};

global.__khetIConnectionCache = globalCache;

async function connectToDatabase() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

      if (isProduction) {
        throw new Error('MONGO_URI is not configured in Vercel environment variables');
      }

      globalCache.promise = mongoose.connect('mongodb://127.0.0.1:27017/khet-i').then((connection) => connection);
      globalCache.conn = await globalCache.promise;
      return globalCache.conn;
    }

    globalCache.promise = mongoose.connect(mongoUri).then((connection) => connection);
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

module.exports = {
  connectToDatabase,
};