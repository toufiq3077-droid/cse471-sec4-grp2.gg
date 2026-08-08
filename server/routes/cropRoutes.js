const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  getCategories,
  getCrops,
  getCropById,
  getMyCrops,
  createCrop,
  updateCrop,
  deleteCrop,
} = require('../controllers/cropController');

router.get('/categories', getCategories);
router.get('/mine', authenticateToken, requireRole(['farmer', 'admin']), getMyCrops);
router.get('/:id', getCropById);
router.get('/', getCrops);

router.post('/', authenticateToken, requireRole(['farmer']), createCrop);
router.put('/:id', authenticateToken, requireRole(['farmer']), updateCrop);
router.delete('/:id', authenticateToken, requireRole(['farmer']), deleteCrop);

module.exports = router;
