require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { connectToDatabase } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const expertRoutes = require('./routes/expertRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const cropRoutes = require('./routes/cropRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (error) {
    return next(error);
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Khet-i server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
    statusCode = 500;
    message = 'Database connection failed. Please ensure MongoDB is running or configure MONGO_URI in server/.env';
  }

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Upload too large. Please use smaller files (max 25MB total per request).';
  }

  res.status(statusCode).json({ message });
});

module.exports = app;