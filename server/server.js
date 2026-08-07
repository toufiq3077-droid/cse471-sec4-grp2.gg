require('dotenv').config();
const app = require('./app');
const { connectToDatabase } = require('./config/db');
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectToDatabase();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️  MongoDB connection warning:', error.message);
    console.warn('⚠️  Please ensure MongoDB is running locally on port 27017 or set MONGO_URI in server/.env');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Khet-i backend server running on http://localhost:${PORT}`);
  });
}

startServer();

module.exports = app;
