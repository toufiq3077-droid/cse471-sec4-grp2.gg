const express = require("express");
const {
  createCrop,
  getMyCrops,
  getCropById,
  updateCrop,
  deleteCropImage,
  deleteCrop,
  getAllActiveCrops,
} = require("../controllers/cropController");
const { protect, authorize } = require("../middleware/auth");
const { uploadCropImages } = require("../middleware/upload");

const router = express.Router();

// Wraps multer so its errors flow into the central error handler
const handleUpload = (req, res, next) => {
  uploadCropImages(req, res, (err) => {
    if (err) {
      err.status = 400;
      return next(err);
    }
    next();
  });
};

// Public marketplace browsing (used by buyers)
router.get("/", getAllActiveCrops);

// Farmer's own listings - must come before "/:id"
router.get("/mine", protect, authorize("farmer"), getMyCrops);

router.post("/", protect, authorize("farmer"), handleUpload, createCrop);

router
  .route("/:id")
  .get(getCropById)
  .put(protect, authorize("farmer"), handleUpload, updateCrop)
  .delete(protect, authorize("farmer"), deleteCrop);

router.delete("/:id/images/:publicId", protect, authorize("farmer"), deleteCropImage);

module.exports = router;
