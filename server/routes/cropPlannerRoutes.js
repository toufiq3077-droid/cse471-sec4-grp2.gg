const express = require('express');
const {
  getCropPresets,
  getMyPlans,
  getPlanById,
  createCropPlan,
  toggleTask,
  convertToListing,
  deleteCropPlan,
} = require('../controllers/cropPlannerController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public / Authenticated presets
router.get('/presets', authenticateToken, getCropPresets);

// Farmer Crop Plans endpoints
router.get('/', authenticateToken, requireRole(['farmer', 'admin']), getMyPlans);
router.post('/', authenticateToken, requireRole(['farmer', 'admin']), createCropPlan);
router.get('/:id', authenticateToken, requireRole(['farmer', 'admin']), getPlanById);
router.patch('/:id/tasks/:taskId/toggle', authenticateToken, requireRole(['farmer', 'admin']), toggleTask);
router.post('/:id/convert-to-listing', authenticateToken, requireRole(['farmer', 'admin']), convertToListing);
router.delete('/:id', authenticateToken, requireRole(['farmer', 'admin']), deleteCropPlan);

module.exports = router;
