const mongoose = require("mongoose");

let mongoMemoryServer;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async (uri, retries = 5, delayMs = 2000) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/khet-i";

  try {
    await connectWithRetry(uri);
  } catch (error) {
    // In development, try an in-memory MongoDB fallback so the app can run
    if (process.env.NODE_ENV !== "production") {
      try {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        mongoMemoryServer = await MongoMemoryServer.create();
        const memoryUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(memoryUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB connected via in-memory server: ${conn.connection.host}`);
        return;
      } catch (memoryError) {
        console.error(`MongoDB connection failed: ${error.message}`);
        console.error(`In-memory MongoDB fallback failed: ${memoryError.message}`);
        process.exit(1);
      }
    }

    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
