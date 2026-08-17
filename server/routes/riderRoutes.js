const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  getAvailableOrders,
  getMyDeliveries,
  acceptOrder,
  updateDeliveryStatus,
  getEarnings,
  getPayouts,
  requestPayout,
} = require('../controllers/riderController');

router.use(authenticateToken);
router.use(requireRole(['rider']));

router.get('/available', getAvailableOrders);
router.get('/deliveries', getMyDeliveries);
router.get('/earnings', getEarnings);
router.get('/payouts', getPayouts);
router.post('/payouts', requestPayout);
router.post('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/status', updateDeliveryStatus);

module.exports = router;
