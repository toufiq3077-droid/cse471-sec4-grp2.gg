const mongoose = require("mongoose");

const consultationMessageSchema = new mongoose.Schema(
  {
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderRole: {
      type: String,
      enum: ["farmer", "expert"],
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    readByFarmer: {
      type: Boolean,
      default: false,
    },

    readByExpert: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

consultationMessageSchema.index({ consultationId: 1, createdAt: 1 });

module.exports = mongoose.model("ConsultationMessage", consultationMessageSchema);
