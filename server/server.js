require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectToDatabase } = require('./config/db');
const { initSocketServer } = require('./services/socketService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io real-time engine
initSocketServer(server);

async function startServer() {
  try {
    await connectToDatabase();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️  MongoDB connection warning:', error.message);
    console.warn('⚠️  Please ensure MongoDB is running locally on port 27017 or set MONGO_URI in server/.env');
  }

  server.listen(PORT, () => {
    console.log(`🚀 Khet-i backend server running on http://localhost:${PORT}`);
  });
}

startServer();

module.exports = app;
