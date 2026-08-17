const express = require('express');
const router = express.Router();
const { getAllUsers, getPlatformStats, toggleVerifyUser } = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Protect all admin routes with authentication and admin role guard
router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/users', getAllUsers);
router.get('/stats', getPlatformStats);
router.put('/users/:id/verify', toggleVerifyUser);

module.exports = router;
