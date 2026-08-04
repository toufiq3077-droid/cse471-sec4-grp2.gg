const mongoose = require('mongoose');

const diseaseLogSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    diseaseName: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    symptoms: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      required: true,
      trim: true,
    },
    organicTreatment: {
      type: String,
      required: true,
      trim: true,
    },
    chemicalTreatment: {
      type: String,
      required: true,
      trim: true,
    },
    fertilizer: {
      type: String,
      required: true,
      trim: true,
    },
    prevention: {
      type: String,
      required: true,
      trim: true,
    },
    irrigationAdvice: {
      type: String,
      required: true,
      trim: true,
    },
    harvestSafety: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DiseaseLog', diseaseLogSchema);
