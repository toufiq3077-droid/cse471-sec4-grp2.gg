const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const apiKey = process.env.CLOUDINARY_API_KEY || "";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
const placeholderPattern = /^(your_|replace_)/i;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const getCloudinaryConfigError = () => {
  const missing = [];
  const placeholders = [];

  if (!cloudName) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!apiKey) missing.push("CLOUDINARY_API_KEY");
  if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");

  if (cloudName && placeholderPattern.test(cloudName)) placeholders.push("CLOUDINARY_CLOUD_NAME");
  if (apiKey && placeholderPattern.test(apiKey)) placeholders.push("CLOUDINARY_API_KEY");
  if (apiSecret && placeholderPattern.test(apiSecret)) placeholders.push("CLOUDINARY_API_SECRET");

  const invalid = [...missing, ...placeholders];

  if (invalid.length > 0) {
    return `Cloudinary is not configured correctly. Set ${invalid.join(", ")} in backend/.env with your real values before uploading crop images.`;
  }

  return null;
};

// Storage engine for crop listing images
const cropImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "khet-i/crops",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
  },
});

// Storage engine for farmer profile / NID images (used by auth)
const profileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "khet-i/farmers",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit", quality: "auto" }],
  },
});

module.exports = { cloudinary, cropImageStorage, profileImageStorage, getCloudinaryConfigError };
