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
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khet-i';
    globalCache.promise = mongoose.connect(mongoUri).then((connection) => connection);
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

module.exports = {
  connectToDatabase,
};