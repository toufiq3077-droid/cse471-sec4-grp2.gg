const mongoose = require('mongoose');

const farmResourceSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Seeds', 'Fertilizer', 'Pesticide', 'Other'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
  },
  { timestamps: true }
);

farmResourceSchema.index({ farmer: 1, purchaseDate: -1 });

module.exports = mongoose.model('FarmResource', farmResourceSchema);
