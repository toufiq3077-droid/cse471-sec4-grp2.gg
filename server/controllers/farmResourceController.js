const mongoose = require('mongoose');
const FarmResource = require('../models/FarmResource');

const CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticide', 'Other'];

function farmerIdFrom(req) {
  return req.user?.id || req.user?._id;
}

function validateResource({ name, category, quantity, purchaseDate }, isUpdate = false) {
  if (!isUpdate && (!name || !category || quantity === undefined || quantity === '' || !purchaseDate)) {
    return 'Resource name, category, quantity, and purchase date are required';
  }
  if (name !== undefined && (!String(name).trim() || String(name).length > 150)) {
    return 'Resource name must be between 1 and 150 characters';
  }
  if (category !== undefined && !CATEGORIES.includes(category)) return 'Please choose a valid category';
  if (quantity !== undefined && (quantity === '' || !Number.isFinite(Number(quantity)) || Number(quantity) < 0)) {
    return 'Quantity must be a non-negative number';
  }
  if (purchaseDate !== undefined && Number.isNaN(new Date(purchaseDate).getTime())) {
    return 'Please provide a valid purchase date';
  }
  return null;
}

// @desc    Get the current farmer's farm resources
// @route   GET /api/farm-resources
// @access  Private (farmer)
exports.getResources = async (req, res) => {
  try {
    const resources = await FarmResource.find({ farmer: farmerIdFrom(req) }).sort({ purchaseDate: -1, createdAt: -1 });
    return res.json({ success: true, resources });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a farm resource
// @route   POST /api/farm-resources
// @access  Private (farmer)
exports.createResource = async (req, res) => {
  try {
    const { name, category, quantity, purchaseDate } = req.body;
    const validationError = validateResource({ name, category, quantity, purchaseDate });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const resource = await FarmResource.create({
      farmer: farmerIdFrom(req), name, category, quantity: Number(quantity), purchaseDate,
    });
    return res.status(201).json({ success: true, message: 'Farm resource created successfully', resource });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a farm resource
// @route   PUT /api/farm-resources/:id
// @access  Private (farmer)
exports.updateResource = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Farm resource not found' });
    const resource = await FarmResource.findOne({ _id: req.params.id, farmer: farmerIdFrom(req) });
    if (!resource) return res.status(404).json({ success: false, message: 'Farm resource not found' });

    const { name, category, quantity, purchaseDate } = req.body;
    const validationError = validateResource({ name, category, quantity, purchaseDate }, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    if (name !== undefined) resource.name = name;
    if (category !== undefined) resource.category = category;
    if (quantity !== undefined) resource.quantity = Number(quantity);
    if (purchaseDate !== undefined) resource.purchaseDate = purchaseDate;
    await resource.save();
    return res.json({ success: true, message: 'Farm resource updated successfully', resource });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a farm resource
// @route   DELETE /api/farm-resources/:id
// @access  Private (farmer)
exports.deleteResource = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Farm resource not found' });
    const resource = await FarmResource.findOneAndDelete({ _id: req.params.id, farmer: farmerIdFrom(req) });
    if (!resource) return res.status(404).json({ success: false, message: 'Farm resource not found' });
    return res.json({ success: true, message: 'Farm resource deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
