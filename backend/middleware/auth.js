const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const getTokenFromHeader = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

// Protect routes - verifies JWT and attaches the logged-in user (farmer or buyer) to req.user
const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "local_fallback_secret");

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      res.status(401);
      throw new Error("Account not found");
    }

    if (!req.user.isActive) {
      res.status(403);
      throw new Error("This account has been deactivated");
    }

    // Back-compat alias: existing farmer-only controllers read req.farmer
    req.farmer = req.user;

    return next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed or expired");
  }
});

// Like protect, but does not fail if there's no/invalid token.
// Lets checkout work for both logged-in buyers and anonymous guests.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "local_fallback_secret");
    const user = await User.findById(decoded.id).select("-password");
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Invalid/expired token on an optional route - just continue as guest
  }
  next();
});

// Restrict a route to one or more roles, e.g. authorize("farmer")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, no user context");
  }
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`This action is only available to: ${roles.join(", ")}`);
  }
  next();
};

module.exports = { protect, optionalAuth, authorize };
