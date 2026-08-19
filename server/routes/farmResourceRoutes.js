const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { getResources, createResource, updateResource, deleteResource } = require('../controllers/farmResourceController');

router.use(authenticateToken, requireRole(['farmer']));
router.route('/').get(getResources).post(createResource);
router.route('/:id').put(updateResource).delete(deleteResource);

module.exports = router;
