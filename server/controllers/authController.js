const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'kheti_secret_key_dev';
  return jwt.sign(
    {
      id: user._id,
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    secret,
    { expiresIn: '7d' }
  );
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
async function registerUser(req, res, next) {
  try {
    const { name, email, password, role, phone, address, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const allowedRoles = ['farmer', 'buyer', 'expert', 'rider', 'admin'];
    const assignedRole = role && allowedRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'farmer';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      phone: phone || '',
      address: address || {},
      bio: bio || '',
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user,
    });
  } catch (error) {
    return next(error);
  }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    return next(error);
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
async function getMe(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

// @desc    Update profile details
// @route   PUT /api/auth/profile
// @access  Private
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const { name, phone, address, bio, profileImage } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = { ...user.address, ...address };
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    return next(error);
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
}

// @desc    Admin login with hardcoded admin credentials
// @route   POST /api/auth/admin-login
// @access  Public
async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Find or create the admin user in the database
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      adminUser = await User.create({
        name: 'Administrator',
        email: 'admin@khet-i.system',
        password: hashedPassword,
        role: 'admin',
        phone: '',
        address: {},
        bio: 'System Administrator',
      });
    }

    const token = generateToken(adminUser);

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      user: adminUser,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registerUser,
  loginUser,
  adminLogin,
  getMe,
  updateProfile,
  changePassword,
};
