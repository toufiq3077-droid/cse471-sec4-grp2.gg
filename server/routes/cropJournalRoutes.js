const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { createEntry, getEntries, updateEntry, deleteEntry } = require('../controllers/cropJournalController');

router.use(authenticateToken, requireRole(['farmer']));
router.route('/').get(getEntries).post(createEntry);
router.route('/:id').put(updateEntry).delete(deleteEntry);

module.exports = router;
