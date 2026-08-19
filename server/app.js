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
const riderRoutes = require('./routes/riderRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const farmerSummaryRoutes = require('./routes/farmerSummaryRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cropPlannerRoutes = require('./routes/cropPlannerRoutes');

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

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Khet-i backend API is live and running' });
});

app.get('/api', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Khet-i API endpoints available' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Khet-i server is running' });
});

// Mount routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/farmer-summary', farmerSummaryRoutes);
app.use('/api/farmer-summary', farmerSummaryRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/crop-plans', cropPlannerRoutes);

// Also mount without /api prefix for direct serverless function routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);
app.use('/experts', expertRoutes);
app.use('/consultations', consultationRoutes);
app.use('/crops', cropRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/riders', riderRoutes);
app.use('/weather', weatherRoutes);
app.use('/geocode', geocodeRoutes);
app.use('/notifications', notificationRoutes);
app.use('/crop-plans', cropPlannerRoutes);

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
