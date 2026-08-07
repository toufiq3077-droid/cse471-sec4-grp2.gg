const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "crops");
fs.mkdirSync(uploadDir, { recursive: true });

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed"), false);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extensionsByMimeType = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    // Derive the extension from the accepted MIME type so generated filenames
    // stay URL-safe and never inherit a path-like original filename.
    const ext = extensionsByMimeType[file.mimetype] || ".jpg";
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const createUploadError = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

const uploadCropImages = (req, res, next) => {
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
  }).array("images", 6)(req, res, next);
};

const uploadProfileImage = (req, res, next) => {
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 },
  }).single("profileImage")(req, res, next);
};

module.exports = { uploadCropImages, uploadProfileImage };
