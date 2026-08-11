const Order = require('../models/Order');

function getCurrentUserId(req) {
  return req.user?.id || req.user?._id;
}

// @desc    Get orders available for riders to accept
// @route   GET /api/riders/available
// @access  Private (rider)
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'confirmed',
      riderId: null,
    }).sort({ createdAt: 1 });

    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current rider's deliveries
// @route   GET /api/riders/deliveries
// @access  Private (rider)
exports.getMyDeliveries = async (req, res) => {
  try {
    const riderId = getCurrentUserId(req);
    const orders = await Order.find({
      riderId,
      status: { $ne: 'cancelled' },
    }).sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Accept an available order for delivery
// @route   POST /api/riders/orders/:id/accept
// @access  Private (rider)
exports.acceptOrder = async (req, res) => {
  try {
    const riderId = getCurrentUserId(req);
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'confirmed' || order.riderId) {
      return res.status(400).json({
        success: false,
        message: 'This order is no longer available for pickup',
      });
    }

    order.riderId = riderId;
    order.riderName = req.user?.name || '';
    order.riderPhone = req.user?.phone || '';
    order.status = 'processing';
    await order.save();

    return res.json({ success: true, message: 'Order accepted for delivery', order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update delivery status (shipped / delivered)
// @route   PATCH /api/riders/orders/:id/status
// @access  Private (rider)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['shipped', 'delivered'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery status' });
    }

    const riderId = getCurrentUserId(req);
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.riderId || String(order.riderId) !== String(riderId)) {
      return res.status(403).json({ success: false, message: 'This order is not assigned to you' });
    }

    const expectedStatus = status === 'shipped' ? 'processing' : 'shipped';
    if (order.status !== expectedStatus) {
      return res.status(400).json({
        success: false,
        message: `Order must be ${expectedStatus} before marking as ${status}`,
      });
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    await order.save();

    return res.json({ success: true, message: `Order marked as ${status}`, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
