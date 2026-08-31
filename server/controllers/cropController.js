const Crop = require('../models/Crop');
const User = require('../models/User');

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'dairy', 'poultry', 'fish', 'others'];
const MAX_PHOTOS = 5;
const MAX_PHOTO_CHARS = 2 * 1024 * 1024;

function validatePhotos(photos) {
  if (photos === undefined || photos === null) {
    return { photos: [] };
  }
  if (!Array.isArray(photos)) {
    return { error: 'photos must be an array' };
  }
  if (photos.length > MAX_PHOTOS) {
    return { error: `Maximum ${MAX_PHOTOS} photos allowed` };
  }
  for (const photo of photos) {
    if (typeof photo !== 'string' || !photo.startsWith('data:image/')) {
      return { error: 'Each photo must be a base64 data image' };
    }
    if (photo.length > MAX_PHOTO_CHARS) {
      return { error: 'Each photo must be 1.5MB or smaller' };
    }
  }
  return { photos };
}

// @desc    List crop categories
// @route   GET /api/crops/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    return res.json({ success: true, categories: CATEGORIES });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a crop listing
// @route   POST /api/crops
// @access  Private (farmer)
exports.createCrop = async (req, res) => {
  try {
    const farmerId = req.user?.id || req.user?._id;
    const { name, category, description, price, unit, quantity, photos } = req.body;

    if (!name || price === undefined || price === null || quantity === undefined || quantity === null) {
      return res.status(400).json({ success: false, message: 'Name, price, and quantity are required' });
    }
    if (Number(price) < 0 || Number(quantity) < 0) {
      return res.status(400).json({ success: false, message: 'Price and quantity must be non-negative' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Please choose a valid category' });
    }

    const photoResult = validatePhotos(photos);
    if (photoResult.error) {
      return res.status(400).json({ success: false, message: photoResult.error });
    }

    const farmer = await User.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    const quantityNumber = Number(quantity);

    const crop = await Crop.create({
      farmerId,
      farmerName: farmer.name || '',
      name,
      category,
      description: description || '',
      price: Number(price),
      unit: unit || 'kg',
      quantity: quantityNumber,
      photos: photoResult.photos,
      location: {
        district: farmer.address?.district || '',
        city: farmer.address?.city || '',
      },
      status: quantityNumber > 0 ? 'available' : 'out_of_stock',
    });

    return res.status(201).json({
      success: true,
      message: 'Crop listing created successfully',
      crop,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Browse crop listings (paginated, searchable, filterable)
// @route   GET /api/crops
// @access  Public
exports.getCrops = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 9, 1), 48);
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const sort = req.query.sort || 'newest';

    const query = { status: 'available' };

    if (search) {
      query.$text = { $search: search };
    }
    if (category && CATEGORIES.includes(category)) {
      query.category = category;
    }

    const sortOption =
      sort === 'price_low' ? { price: 1 } : sort === 'price_high' ? { price: -1 } : { createdAt: -1 };

    const [crops, total] = await Promise.all([
      Crop.find(query, { photos: { $slice: 1 } })
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit),
      Crop.countDocuments(query),
    ]);

    return res.json({
      success: true,
      crops,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get a single crop listing
// @route   GET /api/crops/:id
// @access  Public
exports.getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop listing not found' });
    }

    return res.json({ success: true, crop });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current farmer's listings
// @route   GET /api/crops/mine
// @access  Private (farmer, admin)
exports.getMyCrops = async (req, res) => {
  try {
    const farmerId = req.user?.id || req.user?._id;
    const crops = await Crop.find({ farmerId }).sort({ createdAt: -1 });
    return res.json({ success: true, crops });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a crop listing (owner only)
// @route   PUT /api/crops/:id
// @access  Private (farmer)
exports.updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop listing not found' });
    }

    const currentUserId = String(req.user?.id || req.user?._id || '');
    if (currentUserId && String(crop.farmerId) !== currentUserId) {
      return res.status(403).json({ success: false, message: 'You are not allowed to edit this listing' });
    }

    const { name, category, description, price, unit, quantity, photos } = req.body;

    if (category !== undefined && !CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Please choose a valid category' });
    }
    if (photos !== undefined) {
      const photoResult = validatePhotos(photos);
      if (photoResult.error) {
        return res.status(400).json({ success: false, message: photoResult.error });
      }
      crop.photos = photoResult.photos;
    }
    if (name !== undefined) crop.name = name;
    if (description !== undefined) crop.description = description;
    if (price !== undefined) crop.price = Number(price);
    if (unit !== undefined) crop.unit = unit;
    if (quantity !== undefined) {
      const quantityNumber = Number(quantity);
      crop.quantity = quantityNumber;
      crop.status = quantityNumber > 0 ? 'available' : 'out_of_stock';
    }

    await crop.save();

    return res.json({ success: true, message: 'Listing updated successfully', crop });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a crop listing (owner only)
// @route   DELETE /api/crops/:id
// @access  Private (farmer)
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop listing not found' });
    }

    const currentUserId = String(req.user?.id || req.user?._id || '');
    if (currentUserId && String(crop.farmerId) !== currentUserId) {
      return res.status(403).json({ success: false, message: 'You are not allowed to delete this listing' });
    }

    await Crop.findByIdAndDelete(crop._id);

    return res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
