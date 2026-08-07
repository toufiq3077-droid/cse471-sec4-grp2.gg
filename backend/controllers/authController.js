const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not set. Tokens cannot be generated.");
    if (process.env.NODE_ENV !== "production") {
      // Development fallback only
      return jwt.sign({ id, role }, "local_fallback_secret", {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      });
    }
    throw new Error("JWT secret not configured");
  }

  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sanitize = (user) => ({
  _id: user._id,
  role: user.role,
  name: user.name,
  email: user.email,
  phone: user.phone,
  farmName: user.farmName,
  address: user.address,
  token: generateToken(user._id, user.role),
});

// @desc    Register a new user (farmer or buyer)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  let { name, email, password, phone, role, farmName, address } = req.body;

  // normalize inputs
  email = (email || "").toString().trim().toLowerCase();
  name = (name || "").toString().trim();
  phone = (phone || "").toString().trim();
  role = (role || "").toString().trim().toLowerCase();

  if (!name || !email || !password || !phone || !role) {
    res.status(400);
    throw new Error("Name, email, password, phone and role are required");
  }

  if (!["farmer", "buyer"].includes(role)) {
    res.status(400);
    throw new Error("Role must be either 'farmer' or 'buyer'");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    role,
    name,
    email,
    password,
    phone,
    farmName: role === "farmer" ? farmName : undefined,
    address,
  });

  res.status(201).json({ success: true, data: sanitize(user) });
});

// @desc    Login user (farmer or buyer)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  res.json({ success: true, data: sanitize(user) });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// @desc    Update logged-in user's profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("Account not found");
  }

  user.name = req.body.name ?? user.name;
  user.phone = req.body.phone ?? user.phone;
  if (user.role === "farmer") {
    user.farmName = req.body.farmName ?? user.farmName;
  }
  if (req.body.address) {
    user.address = { ...(user.address?.toObject?.() || {}), ...req.body.address };
  }

  const updated = await user.save();
  res.json({ success: true, data: updated });
});

module.exports = { registerUser, loginUser, getProfile, updateProfile };
