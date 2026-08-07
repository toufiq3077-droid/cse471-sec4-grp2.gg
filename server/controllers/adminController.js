const User = require('../models/User');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
async function getAllUsers(req, res, next) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    return next(error);
  }
}

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Private/Admin
async function getPlatformStats(req, res, next) {
  try {
    const totalUsers = await User.countDocuments();
    const farmers = await User.countDocuments({ role: 'farmer' });
    const buyers = await User.countDocuments({ role: 'buyer' });
    const experts = await User.countDocuments({ role: 'expert' });
    const riders = await User.countDocuments({ role: 'rider' });
    const admins = await User.countDocuments({ role: 'admin' });

    return res.status(200).json({
      stats: {
        totalUsers,
        farmers,
        buyers,
        experts,
        riders,
        admins,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// @desc    Verify or unverify user account
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
async function toggleVerifyUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    return res.status(200).json({
      message: `User ${user.isVerified ? 'verified' : 'unverified'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllUsers,
  getPlatformStats,
  toggleVerifyUser,
};
