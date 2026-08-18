const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['fertilization', 'irrigation', 'pest_control', 'weeding', 'harvest', 'general'],
      default: 'general',
    },
    dueDay: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const stageSchema = new mongoose.Schema(
  {
    stageName: {
      type: String,
      required: true,
    },
    startDay: {
      type: Number,
      required: true,
    },
    endDay: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    description: {
      type: String,
      default: '',
    },
    tasks: [taskSchema],
  },
  { _id: true }
);

const cropPlanSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
    },
    variety: {
      type: String,
      default: 'Standard Local Variety',
      trim: true,
    },
    category: {
      type: String,
      enum: ['vegetables', 'fruits', 'grains', 'others'],
      default: 'vegetables',
    },
    fieldArea: {
      type: Number,
      required: [true, 'Field area is required'],
      min: [0.01, 'Area must be greater than 0'],
    },
    areaUnit: {
      type: String,
      enum: ['acres', 'decimals', 'bigha', 'hectares'],
      default: 'acres',
    },
    plantingDate: {
      type: Date,
      required: [true, 'Planting date is required'],
    },
    targetHarvestDate: {
      type: Date,
      required: true,
    },
    totalGrowthDays: {
      type: Number,
      required: true,
    },
    estimatedYieldKg: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'harvested', 'listed', 'cancelled'],
      default: 'active',
      index: true,
    },
    marketplaceCropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      default: null,
    },
    stages: [stageSchema],
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CropPlan', cropPlanSchema);
