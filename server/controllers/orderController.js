const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Crop = require('../models/Crop');
const User = require('../models/User');
const { buildLiveTracking, initDeliveryTracking, isValidPoint } = require('../services/trackingService');

const DELIVERY_FEE = 60;
const PAYMENT_METHODS = ['mock_bkash', 'cash_on_delivery'];

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `KH-${date}-${random}`;
}

function generateTransactionId() {
  return `MOCK-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

// @desc    Place an order from the buyer's cart (with mock payment)
// @route   POST /api/orders
// @access  Private (buyer)
exports.placeOrder = async (req, res) => {
  try {
    const buyerId = req.user?.id || req.user?._id;
    const { paymentMethod, shippingAddress, deliveryPoint } = req.body;

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Please choose a valid payment method' });
    }

    const cart = await Cart.findOne({ userId: buyerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const buyer = await User.findById(buyerId);
    const address = shippingAddress || buyer?.address || {};

    const items = [];
    for (const item of cart.items) {
      const crop = await Crop.findById(item.cropId);
      if (!crop) {
        return res.status(400).json({
          success: false,
          message: 'One of the items in your cart is no longer available',
        });
      }
      if (crop.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${crop.quantity} ${crop.unit}(s) of ${crop.name} available in stock`,
        });
      }
      items.push({
        cropId: crop._id,
        farmerId: crop.farmerId,
        farmerName: crop.farmerName,
        name: crop.name,
        photo: crop.photos?.[0] || '',
        price: crop.price,
        quantity: item.quantity,
        unit: crop.unit,
        subtotal: crop.price * item.quantity,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal + DELIVERY_FEE;
    const isMockBkash = paymentMethod === 'mock_bkash';

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      buyerId,
      buyerName: buyer?.name || '',
      buyerPhone: buyer?.phone || '',
      shippingAddress: {
        street: address.street || '',
        city: address.city || '',
        district: address.district || '',
        postalCode: address.postalCode || '',
      },
      deliveryPoint: isValidPoint(deliveryPoint)
        ? {
            lat: Number(deliveryPoint.lat),
            lng: Number(deliveryPoint.lng),
            label: deliveryPoint.label || '',
          }
        : {},
      items,
      itemCount: items.length,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total,
      status: 'confirmed',
      payment: {
        method: paymentMethod,
        status: isMockBkash ? 'paid' : 'pending',
        transactionId: isMockBkash ? generateTransactionId() : '',
        paidAt: isMockBkash ? new Date() : null,
      },
    });

    for (const item of items) {
      const crop = await Crop.findById(item.cropId);
      crop.quantity = Math.max(crop.quantity - item.quantity, 0);
      crop.soldCount = (crop.soldCount || 0) + item.quantity;
      if (crop.quantity <= 0) {
        crop.status = 'out_of_stock';
      }
      await crop.save();
    }

    await Cart.deleteOne({ userId: buyerId });

    return res.status(201).json({
      success: true,
      message: isMockBkash ? 'Order placed and payment completed' : 'Order placed successfully',
      order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current buyer's order history
// @route   GET /api/orders/mine
// @access  Private (buyer)
exports.getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user?.id || req.user?._id;
    const orders = await Order.find({ buyerId }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get a single order / invoice
// @route   GET /api/orders/:id
// @access  Private (buyer, farmer, admin)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentUserId = String(req.user?.id || req.user?._id || '');
    const isBuyer = String(order.buyerId) === currentUserId;
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const isFarmer = order.items.some(
      (item) => item.farmerId && String(item.farmerId) === currentUserId
    );
    const isRider = order.riderId && String(order.riderId) === currentUserId;

    if (!isBuyer && !isAdmin && !isFarmer && !isRider) {
      return res.status(403).json({ success: false, message: 'You are not allowed to view this order' });
    }

    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get live delivery tracking for an order
// @route   GET /api/orders/:id/tracking
// @access  Private (buyer, rider, farmer, admin)
exports.getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentUserId = String(req.user?.id || req.user?._id || '');
    const isBuyer = String(order.buyerId) === currentUserId;
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const isFarmer = order.items.some(
      (item) => item.farmerId && String(item.farmerId) === currentUserId
    );
    const isRider = order.riderId && String(order.riderId) === currentUserId;

    if (!isBuyer && !isAdmin && !isFarmer && !isRider) {
      return res.status(403).json({ success: false, message: 'You are not allowed to view this order' });
    }

    // Lazily initialize tracking for shipped orders created before tracking existed
    if (order.status === 'shipped' && !order.tracking?.demoStartedAt) {
      try {
        await initDeliveryTracking(order);
      } catch (err) {
        console.warn('[orderController] lazy tracking init failed:', err.message);
      }
    }

    const tracking = buildLiveTracking(order);

    return res.json({ success: true, data: tracking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
