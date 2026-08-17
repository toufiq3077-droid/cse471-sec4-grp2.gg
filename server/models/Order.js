const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    farmerName: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      default: 'kg',
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['mock_bkash', 'cash_on_delivery'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const coordinateSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    label: { type: String, default: '' },
  },
  { _id: false }
);

const trackingLegSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    originName: { type: String, default: '' },
    destinationName: { type: String, default: '' },
    distanceMeters: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const trackingSchema = new mongoose.Schema(
  {
    riderLocation: {
      type: locationSchema,
      default: {},
    },
    pickupLocation: {
      type: locationSchema,
      default: {},
    },
    deliveryLocation: {
      type: locationSchema,
      default: {},
    },
    routeCoordinates: {
      type: [coordinateSchema],
      default: [],
    },
    legs: {
      type: [trackingLegSchema],
      default: [],
    },
    distanceMeters: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    demoStartedAt: {
      type: Date,
      default: null,
    },
    isFallback: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyerName: {
      type: String,
      default: '',
    },
    buyerPhone: {
      type: String,
      default: '',
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    riderName: {
      type: String,
      default: '',
    },
    riderPhone: {
      type: String,
      default: '',
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    riderEarning: {
      type: Number,
      default: null,
    },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      district: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    deliveryPoint: {
      type: locationSchema,
      default: {},
    },
    items: [orderItemSchema],
    itemCount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    payment: paymentSchema,
    tracking: {
      type: trackingSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
