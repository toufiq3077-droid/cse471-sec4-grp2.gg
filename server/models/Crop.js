const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    farmerName: {
      type: String,
      default: '',
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['vegetables', 'fruits', 'grains', 'dairy', 'poultry', 'fish', 'others'],
      default: 'vegetables',
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'dozen', 'piece', 'bag', 'liter'],
      default: 'kg',
    },
    quantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: 0,
      default: 0,
    },
    photos: {
      type: [String],
      default: [],
    },
    location: {
      district: { type: String, default: '' },
      city: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['available', 'out_of_stock'],
      default: 'available',
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

cropSchema.index({ name: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Crop', cropSchema);
