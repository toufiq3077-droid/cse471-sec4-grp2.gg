const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const expertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      required: true,
      trim: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
    },

    fee: {
      type: Number,
      required: true,
      min: 0,
    },

    phone: {
      type: String,
      default: "",
    },

    linkedIn: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    certifications: [
      {
        type: String,
      },
    ],

    availability: {
      Monday: availabilitySchema,
      Tuesday: availabilitySchema,
      Wednesday: availabilitySchema,
      Thursday: availabilitySchema,
      Friday: availabilitySchema,
      Saturday: availabilitySchema,
      Sunday: availabilitySchema,
    },

    rating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    totalConsultations: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

expertSchema.index({
  name: "text",
  specialization: "text",
});

module.exports = mongoose.model("Expert", expertSchema);