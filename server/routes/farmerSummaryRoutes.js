const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { getFarmerMarketplaceSummary } = require('../controllers/farmerSummaryController');

const router = express.Router();

router.get('/', authenticateToken, requireRole(['farmer']), getFarmerMarketplaceSummary);

module.exports = router;
