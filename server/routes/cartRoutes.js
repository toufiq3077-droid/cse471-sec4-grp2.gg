const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

router.get('/', authenticateToken, requireRole(['buyer']), getCart);
router.post('/items', authenticateToken, requireRole(['buyer']), addToCart);
router.put('/items/:cropId', authenticateToken, requireRole(['buyer']), updateCartItem);
router.delete('/items/:cropId', authenticateToken, requireRole(['buyer']), removeCartItem);
router.delete('/', authenticateToken, requireRole(['buyer']), clearCart);

module.exports = router;
