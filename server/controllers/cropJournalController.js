const mongoose = require('mongoose');
const CropJournal = require('../models/CropJournal');

const MAX_IMAGE_CHARS = 2 * 1024 * 1024;

function farmerIdFrom(req) {
  return req.user?.id || req.user?._id;
}

function isValidImage(image) {
  return image === undefined || image === null || image === '' ||
    (typeof image === 'string' && image.startsWith('data:image/') && image.length <= MAX_IMAGE_CHARS);
}

function validateEntry({ crop, date, growthStage, note, image }, isUpdate = false) {
  if (!isUpdate && (!crop || !date || !growthStage || !note)) return 'Crop, date, growth stage, and note are required';
  if (crop !== undefined && (!String(crop).trim() || String(crop).length > 150)) {
    return 'Crop name must be between 1 and 150 characters';
  }
  if (date !== undefined && Number.isNaN(new Date(date).getTime())) return 'Please provide a valid date';
  if (growthStage !== undefined && (!String(growthStage).trim() || String(growthStage).length > 100)) {
    return 'Growth stage must be between 1 and 100 characters';
  }
  if (note !== undefined && (!String(note).trim() || String(note).length > 5000)) {
    return 'Note must be between 1 and 5000 characters';
  }
  if (!isValidImage(image)) return 'Image must be a base64 image no larger than 1.5MB';
  return null;
}

// @desc    Create a crop journal entry
// @route   POST /api/crop-journal
// @access  Private (farmer)
exports.createEntry = async (req, res) => {
  try {
    const farmer = farmerIdFrom(req);
    const { crop, date, growthStage, note, image } = req.body;
    const validationError = validateEntry({ crop, date, growthStage, note, image });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const entry = await CropJournal.create({ farmer, crop, date, growthStage, note, image: image || '' });
    return res.status(201).json({ success: true, message: 'Journal entry created successfully', entry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get the current farmer's crop journal entries
// @route   GET /api/crop-journal?crop=:cropName
// @access  Private (farmer)
exports.getEntries = async (req, res) => {
  try {
    const farmer = farmerIdFrom(req);
    const query = { farmer };
    if (req.query.crop) query.crop = req.query.crop.trim();
    const entries = await CropJournal.find(query).sort({ date: -1, createdAt: -1 });
    return res.json({ success: true, entries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a crop journal entry
// @route   PUT /api/crop-journal/:id
// @access  Private (farmer)
exports.updateEntry = async (req, res) => {
  try {
    const farmer = farmerIdFrom(req);
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Journal entry not found' });
    const entry = await CropJournal.findOne({ _id: req.params.id, farmer });
    if (!entry) return res.status(404).json({ success: false, message: 'Journal entry not found' });

    const { crop, date, growthStage, note, image } = req.body;
    const validationError = validateEntry({ crop, date, growthStage, note, image }, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    if (crop !== undefined) {
      entry.crop = crop;
    }
    if (date !== undefined) entry.date = date;
    if (growthStage !== undefined) entry.growthStage = growthStage;
    if (note !== undefined) entry.note = note;
    if (image !== undefined) entry.image = image || '';
    await entry.save();
    return res.json({ success: true, message: 'Journal entry updated successfully', entry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a crop journal entry
// @route   DELETE /api/crop-journal/:id
// @access  Private (farmer)
exports.deleteEntry = async (req, res) => {
  try {
    const farmer = farmerIdFrom(req);
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Journal entry not found' });
    const entry = await CropJournal.findOneAndDelete({ _id: req.params.id, farmer });
    if (!entry) return res.status(404).json({ success: false, message: 'Journal entry not found' });
    return res.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
