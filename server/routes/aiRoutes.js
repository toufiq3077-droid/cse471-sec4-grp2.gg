const express = require('express');
const multer = require('multer');
const {
  diagnoseLeafDiseaseController,
  getDiagnosisHistoryController,
} = require('../controllers/ai/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/pjpeg',
  'image/x-png',
  'application/octet-stream',
]);

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp|jfif)$/i;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    const isMimeValid = file.mimetype && SUPPORTED_IMAGE_TYPES.has(file.mimetype.toLowerCase());
    const isExtValid = file.originalname && ALLOWED_EXTENSIONS.test(file.originalname.toLowerCase());

    if (!isMimeValid && !isExtValid) {
      const error = new Error('Unsupported file type. Only JPEG, PNG, and WEBP are allowed.');
      error.statusCode = 400;
      return cb(error, false);
    }

    return cb(null, true);
  },
});

function handleUpload(req, res, next) {
  upload.any()(req, res, (error) => {
    if (!error) {
      if (req.files && req.files.length > 0) {
        req.file = req.files[0];
      }
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
