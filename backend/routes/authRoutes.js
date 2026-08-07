const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { uploadProfileImage } = require("../middleware/upload");
const User = require("../models/User");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Optional: separate endpoint to upload/replace profile image
router.put("/profile/image", protect, (req, res, next) => {
  uploadProfileImage(req, res, async (err) => {
    if (err) return next(err);
    try {
      const user = await User.findById(req.user._id);
      if (req.file) {
        user.profileImage = { url: req.file.path, publicId: req.file.filename };
        await user.save();
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  });
});

module.exports = router;
