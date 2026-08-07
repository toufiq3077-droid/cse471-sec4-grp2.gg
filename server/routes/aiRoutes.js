const express = require('express');
const multer = require('multer');
const {
  diagnoseLeafDiseaseController,
  getDiagnosisHistoryController,
} = require('../controllers/ai/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (!SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
      const error = new Error('Unsupported file type. Only JPEG, PNG, and WEBP are allowed.');
      error.statusCode = 400;
      return cb(error, false);
    }

    return cb(null, true);
  },
});

function handleUpload(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Image size must be 5MB or smaller.',
      });
    }

    return next(error);
  });
}

router.post('/diagnose', authenticateToken, handleUpload, diagnoseLeafDiseaseController);
router.get('/history', authenticateToken, getDiagnosisHistoryController);

module.exports = router;
