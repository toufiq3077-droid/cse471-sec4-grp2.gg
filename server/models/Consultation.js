const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
    },

    consultationDate: {
      type: Date,
      required: true,
    },

    timeSlot: {
      type: String,
      required: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    fee: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "completed",
        "cancelled"
      ],
      default: "pending",
    },

    payment: {
      method: {
        type: String,
        enum: ["mock_bkash", "cash_on_delivery"],
        default: null,
      },
      status: {
        type: String,
        enum: ["unpaid", "paid", "refunded", "failed"],
        default: "unpaid",
      },
      transactionId: {
        type: String,
        default: "",
      },
      paidAt: {
        type: Date,
        default: null,
      },
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    endedBy: {
      type: String,
      enum: ["farmer", "expert", "admin", null],
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate booking
consultationSchema.index(
  {
    expertId: 1,
    consultationDate: 1,
    timeSlot: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Consultation", consultationSchema);
