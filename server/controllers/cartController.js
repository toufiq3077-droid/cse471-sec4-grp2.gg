const Cart = require('../models/Cart');
const Crop = require('../models/Crop');

function currentUserId(req) {
  return req.user?.id || req.user?._id;
}

async function getOrCreateCart(req) {
  const userId = currentUserId(req);
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

async function buildCartResponse(cart) {
  const items = [];
  for (const item of cart.items) {
    const crop = await Crop.findById(item.cropId);
    items.push({
      cropId: item.cropId,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      addedAt: item.addedAt,
      name: crop ? crop.name : 'Unavailable item',
      unit: crop ? crop.unit : 'kg',
      photo: crop && crop.photos?.length ? crop.photos[0] : '',
      status: crop ? crop.status : 'out_of_stock',
      availableQty: crop ? crop.quantity : 0,
      farmerName: crop ? crop.farmerName : '',
    });
  }
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, itemCount: items.length, subtotal };
}

// @desc    Get current buyer's cart
// @route   GET /api/cart
// @access  Private (buyer)
exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req);
    const data = await buildCartResponse(cart);
    return res.json({ success: true, cart: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private (buyer)
exports.addToCart = async (req, res) => {
  try {
    const { cropId, quantity } = req.body;
    const qty = Math.max(parseInt(quantity, 10) || 0, 0);

    if (!cropId || qty < 1) {
      return res.status(400).json({ success: false, message: 'A valid crop and quantity are required' });
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop listing not found' });
    }
    if (crop.status !== 'available' || crop.quantity < 1) {
      return res.status(400).json({ success: false, message: 'This crop is currently out of stock' });
    }

    const cart = await getOrCreateCart(req);
    const existing = cart.items.find((item) => String(item.cropId) === String(cropId));
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + qty;

    if (newQty > crop.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${crop.quantity} ${crop.unit}(s) available in stock`,
      });
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      cart.items.push({ cropId, price: crop.price, quantity: qty });
    }

    await cart.save();
    const data = await buildCartResponse(cart);

    return res.status(201).json({ success: true, message: 'Item added to cart', cart: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:cropId
// @access  Private (buyer)
exports.updateCartItem = async (req, res) => {
  try {
    const { cropId } = req.params;
    const qty = Math.max(parseInt(req.body.quantity, 10) || 0, 0);

    const cart = await getOrCreateCart(req);
    const existing = cart.items.find((item) => String(item.cropId) === String(cropId));

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (qty < 1) {
      cart.items = cart.items.filter((item) => String(item.cropId) !== String(cropId));
    } else {
      const crop = await Crop.findById(cropId);
      if (!crop) {
        return res.status(404).json({ success: false, message: 'Crop not found' });
      }
      if (qty > crop.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${crop.quantity} ${crop.unit}(s) available in stock`,
        });
      }
      existing.quantity = qty;
    }

    await cart.save();
    const data = await buildCartResponse(cart);

    return res.json({ success: true, message: 'Cart updated', cart: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:cropId
// @access  Private (buyer)
exports.removeCartItem = async (req, res) => {
  try {
    const { cropId } = req.params;
    const cart = await getOrCreateCart(req);
    cart.items = cart.items.filter((item) => String(item.cropId) !== String(cropId));
    await cart.save();

    const data = await buildCartResponse(cart);
    return res.json({ success: true, message: 'Item removed from cart', cart: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private (buyer)
exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req);
    cart.items = [];
    await cart.save();

    return res.json({
      success: true,
      message: 'Cart cleared',
      cart: { items: [], itemCount: 0, subtotal: 0 },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
