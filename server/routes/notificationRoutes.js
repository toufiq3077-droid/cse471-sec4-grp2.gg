const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.patch('/read-all', authenticateToken, markAllAsRead);
router.patch('/:id/read', authenticateToken, markAsRead);

module.exports = router;
