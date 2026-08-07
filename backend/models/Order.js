const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    pricePerUnit: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Set when the order was placed by a logged-in buyer account; left empty for guest checkout
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    buyerName: {
      type: String,
      required: [true, "Buyer name is required"],
      trim: true,
    },
    buyerEmail: {
      type: String,
      required: [true, "Buyer email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email"],
    },
    buyerPhone: {
      type: String,
      required: [true, "Buyer phone is required"],
      trim: true,
    },
    shippingAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Digital Payment"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Processing", "Confirmed", "Completed", "Cancelled"],
      default: "Processing",
    },
    orderItems: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: [true, "Order total amount is required"],
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
