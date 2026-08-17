const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { placeOrder, getMyOrders, getOrderById, getOrderTracking } = require('../controllers/orderController');

router.post('/', authenticateToken, requireRole(['buyer']), placeOrder);
router.get('/mine', authenticateToken, requireRole(['buyer']), getMyOrders);
router.get('/:id/tracking', authenticateToken, getOrderTracking);
router.get('/:id', authenticateToken, getOrderById);

module.exports = router;
