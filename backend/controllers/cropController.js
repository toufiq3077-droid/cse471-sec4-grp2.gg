const path = require("path");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const Crop = require("../models/Crop");

// @desc    Create a new crop listing (with images)
// @route   POST /api/crops
// @access  Private (Farmer)
const createCrop = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    description,
    stockQuantity,
    unit,
    season,
    harvestDate,
    availableFrom,
    availableUntil,
    pricePerUnit,
    discountPercent,
  } = req.body;

  if (!name || !category || stockQuantity === undefined || !unit || !season || pricePerUnit === undefined) {
    res.status(400);
    throw new Error(
      "name, category, stockQuantity, unit, season and pricePerUnit are required"
    );
  }

  const images = (req.files || []).map((file) => {
    const relativePath = path.posix.join("/uploads/crops", file.filename);
    return {
      url: relativePath,
      publicId: file.filename,
    };
  });

  const crop = await Crop.create({
    farmer: req.user._id,
    name,
    category,
    description,
    stockQuantity,
    unit,
    season,
    harvestDate: harvestDate || undefined,
    availableFrom: availableFrom || undefined,
    availableUntil: availableUntil || undefined,
    pricePerUnit,
    discountPercent: discountPercent || 0,
    images,
  });

  res.status(201).json({ success: true, data: crop });
});

// @desc    Get all crop listings for the logged-in farmer (with search/filter/pagination)
// @route   GET /api/crops/mine
// @access  Private (Farmer)
const getMyCrops = asyncHandler(async (req, res) => {
  const { status, season, category, search, page = 1, limit = 10 } = req.query;

  const query = { farmer: req.user._id };
  if (status) query.status = status;
  if (season) query.season = season;
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);

  const [crops, total] = await Promise.all([
    Crop.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Crop.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: crops.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: crops,
  });
});

// @desc    Get single crop listing by id
// @route   GET /api/crops/:id
// @access  Public
const getCropById = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id).populate(
    "farmer",
    "name farmName phone address"
  );

  if (!crop) {
    res.status(404);
    throw new Error("Crop listing not found");
  }

  res.json({ success: true, data: crop });
});

// @desc    Update a crop listing (fields + optionally add new images)
// @route   PUT /api/crops/:id
// @access  Private (Farmer - owner only)
const updateCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);

  if (!crop) {
    res.status(404);
    throw new Error("Crop listing not found");
  }

  if (crop.farmer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this listing");
  }

  const updatableFields = [
    "name",
    "category",
    "description",
    "stockQuantity",
    "unit",
    "season",
    "harvestDate",
    "availableFrom",
    "availableUntil",
    "pricePerUnit",
    "discountPercent",
    "status",
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) crop[field] = req.body[field];
  });

  // If stock is manually raised above 0 while status was Out of Stock, reactivate
  if (Number(crop.stockQuantity) > 0 && crop.status === "Out of Stock") {
    crop.status = "Active";
  }

  // Append any newly uploaded images (max 6 total)
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => {
      const relativePath = path.posix.join("/uploads/crops", file.filename);
      return {
        url: relativePath,
        publicId: file.filename,
      };
    });
    crop.images = [...crop.images, ...newImages].slice(0, 6);
  }

  const updated = await crop.save();
  res.json({ success: true, data: updated });
});

// @desc    Delete one image from a crop listing (removes from Cloudinary too)
// @route   DELETE /api/crops/:id/images/:publicId
// @access  Private (Farmer - owner only)
const deleteCropImage = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);

  if (!crop) {
    res.status(404);
    throw new Error("Crop listing not found");
  }

  if (crop.farmer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to modify this listing");
  }

  const { publicId } = req.params;
  const imageExists = crop.images.some((img) => img.publicId === publicId);

  if (!imageExists) {
    res.status(404);
    throw new Error("Image not found on this listing");
  }

  const imageToRemove = crop.images.find((img) => img.publicId === publicId);
  if (imageToRemove) {
    const absolutePath = path.join(__dirname, "..", imageToRemove.url.replace(/^\//, ""));
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }

  crop.images = crop.images.filter((img) => img.publicId !== publicId);
  await crop.save();

  res.json({ success: true, data: crop });
});

// @desc    Delete a crop listing entirely (removes all images from Cloudinary)
// @route   DELETE /api/crops/:id
// @access  Private (Farmer - owner only)
const deleteCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);

  if (!crop) {
    res.status(404);
    throw new Error("Crop listing not found");
  }

  if (crop.farmer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this listing");
  }

  await Promise.all(
    crop.images.map((img) => {
      const absolutePath = path.join(__dirname, "..", img.url.replace(/^\//, ""));
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    })
  );

  await crop.deleteOne();

  res.json({ success: true, message: "Crop listing deleted", data: { _id: req.params.id } });
});

// @desc    Public marketplace browse of active crop listings (for Module 2 later)
// @route   GET /api/crops
// @access  Public
const getAllActiveCrops = asyncHandler(async (req, res) => {
  const { category, season, search, page = 1, limit = 12 } = req.query;

  const query = { status: "Active" };
  if (category) query.category = category;
  if (season) query.season = season;
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);

  const [crops, total] = await Promise.all([
    Crop.find(query)
      .populate("farmer", "name farmName address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Crop.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: crops.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: crops,
  });
});

module.exports = {
  createCrop,
  getMyCrops,
  getCropById,
  updateCrop,
  deleteCropImage,
  deleteCrop,
  getAllActiveCrops,
};
