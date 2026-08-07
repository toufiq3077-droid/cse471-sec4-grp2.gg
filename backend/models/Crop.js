const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const cropSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Vegetable",
        "Fruit",
        "Grain",
        "Spice",
        "Pulses",
        "Flower",
        "Other",
      ],
      default: "Other",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Stock
    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: ["kg", "gram", "ton", "quintal", "piece", "dozen", "bundle"],
      default: "kg",
    },

    // Seasonal information
    season: {
      type: String,
      required: [true, "Season is required"],
      enum: ["Summer", "Winter", "Rainy", "Autumn", "Spring", "All Season"],
      default: "All Season",
    },
    harvestDate: {
      type: Date,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableUntil: {
      type: Date,
    },

    // Pricing
    pricePerUnit: {
      type: Number,
      required: [true, "Price per unit is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Images (multiple, via Cloudinary)
    images: {
      type: [imageSchema],
      validate: {
        validator: function (arr) {
          return arr.length <= 6;
        },
        message: "You can upload a maximum of 6 images per listing",
      },
      default: [],
    },

    status: {
      type: String,
      enum: ["Active", "Out of Stock", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// Auto-mark Out of Stock when quantity hits 0
cropSchema.pre("save", function (next) {
  if (this.stockQuantity === 0 && this.status === "Active") {
    this.status = "Out of Stock";
  }
  next();
});

cropSchema.index({ farmer: 1, createdAt: -1 });
cropSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Crop", cropSchema);
