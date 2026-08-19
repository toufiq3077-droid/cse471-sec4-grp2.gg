const mongoose = require('mongoose');

const cropJournalSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    crop: {
      type: String,
      required: true,
      index: true,
      trim: true,
      maxlength: 150,
    },
    date: {
      type: Date,
      required: [true, 'Entry date is required'],
    },
    growthStage: {
      type: String,
      required: [true, 'Growth stage is required'],
      trim: true,
      maxlength: 100,
    },
    note: {
      type: String,
      required: [true, 'Farming note is required'],
      trim: true,
      maxlength: 5000,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

cropJournalSchema.index({ farmer: 1, crop: 1, date: -1 });

module.exports = mongoose.model('CropJournal', cropJournalSchema);
