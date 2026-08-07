const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["farmer", "buyer"],
      required: [true, "Role is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    // Farmer-only field
    farmName: {
      type: String,
      trim: true,
      default: "",
    },

    // Shared address (farm address for farmers, default shipping address for buyers)
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      upazila: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      details: { type: String, default: "" },
    },

    profileImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
