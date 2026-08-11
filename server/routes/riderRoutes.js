const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  getAvailableOrders,
  getMyDeliveries,
  acceptOrder,
  updateDeliveryStatus,
} = require('../controllers/riderController');

router.use(authenticateToken);
router.use(requireRole(['rider']));

router.get('/available', getAvailableOrders);
router.get('/deliveries', getMyDeliveries);
router.post('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/status', updateDeliveryStatus);

module.exports = router;
