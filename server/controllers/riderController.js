const Order = require('../models/Order');
const Payout = require('../models/Payout');
const { initDeliveryTracking, isValidPoint, toLocalDateKey } = require('../services/trackingService');

function getCurrentUserId(req) {
  return req.user?.id || req.user?._id;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function orderEarning(order) {
  return order.riderEarning != null ? order.riderEarning : (order.deliveryFee || 0);
}

const EARNINGS_BASE = 30;
const EARNINGS_PER_KM = 7;
const EARNINGS_MIN = 40;

function computeRiderEarning(order) {
  const km = (order.tracking?.distanceMeters || 0) / 1000;
  if (!(km > 0)) return order.deliveryFee || 0;
  return Math.max(EARNINGS_MIN, Math.round(EARNINGS_BASE + km * EARNINGS_PER_KM));
}

// @desc    Get current rider's earnings summary from delivered orders
// @route   GET /api/riders/earnings
// @access  Private (rider)
exports.getEarnings = async (req, res) => {
  try {
    const riderId = getCurrentUserId(req);
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const delivered = await Order.find({ riderId, status: 'delivered' }).sort({ deliveredAt: -1 });

    const totalDeliveries = delivered.length;
    const totalEarnings = delivered.reduce((sum, o) => sum + orderEarning(o), 0);
    const thisWeek = delivered
      .filter((o) => o.deliveredAt && o.deliveredAt >= weekStart)
      .reduce((sum, o) => sum + orderEarning(o), 0);
    const thisMonth = delivered
      .filter((o) => o.deliveredAt && o.deliveredAt >= monthStart)
      .reduce((sum, o) => sum + orderEarning(o), 0);
    const avgPerDelivery = totalDeliveries ? totalEarnings / totalDeliveries : 0;

    // Last 14 days daily breakdown
    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = toLocalDateKey(d);
      dailyMap[key] = { date: key, label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), amount: 0, count: 0 };
    }

    delivered.forEach((o) => {
      if (!o.deliveredAt) return;
      const key = toLocalDateKey(o.deliveredAt);
      if (dailyMap[key]) {
        dailyMap[key].amount += orderEarning(o);
        dailyMap[key].count += 1;
      }
    });

    // Active payout balance
    const payouts = await Payout.find({ riderId, status: { $in: ['pending', 'processing', 'paid'] } });
    const requestedAmount = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const availableBalance = Math.max(0, Math.round((totalEarnings - requestedAmount) * 100) / 100);

    return res.json({
      success: true,
      earnings: {
        totalEarnings,
        totalDeliveries,
        thisWeek,
        thisMonth,
        avgPerDelivery,
        dailyBreakdown: Object.values(dailyMap),
        availableBalance,
        requestedAmount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current rider's payout history
// @route   GET /api/riders/payouts
// @access  Private (rider)
exports.getPayouts = async (req, res) => {
  try {
    const riderId = getCurrentUserId(req);
    const payouts = await Payout.find({ riderId }).sort({ createdAt: -1 });
    return res.json({ success: true, payouts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Request a payout of available earnings
// @route   POST /api/riders/payouts
// @access  Private (rider)
exports.requestPayout = async (req, res) => {
  try {
    const riderId = getCurrentUserId(req);
    const { amount, note } = req.body;
    const amt = Number(amount);

    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid payout amount' });
    }

    const delivered = await Order.find({ riderId, status: 'delivered' });
    const totalEarnings = delivered.reduce((sum, o) => sum + orderEarning(o), 0);

    const payouts = await Payout.find({ riderId, status: { $in: ['pending', 'processing', 'paid'] } });
    const requested = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const available = Math.max(0, Math.round((totalEarnings - requested) * 100) / 100);

    if (amt > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available for payout: ৳${available}`,
      });
    }

    const payout = await Payout.create({
      riderId,
      amount: Math.round(amt * 100) / 100,
      note: String(note || '').trim(),
      status: 'paid',
      paidAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Payout completed successfully',
      payout,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

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
    const { status, riderLocation } = req.body;

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
      order.riderEarning = computeRiderEarning(order);
      if (order.payment?.method === 'cash_on_delivery') {
        order.payment.status = 'paid';
        order.payment.paidAt = new Date();
      }
    }
    if (status === 'shipped' && isValidPoint(riderLocation)) {
      order.tracking = order.tracking || {};
      order.tracking.riderLocation = {
        lat: Number(riderLocation.lat),
        lng: Number(riderLocation.lng),
        label: riderLocation.label || '',
      };
    }
    await order.save();

    if (status === 'shipped') {
      const riderPoint = isValidPoint(riderLocation) ? order.tracking.riderLocation : undefined;
      await initDeliveryTracking(order, riderPoint).catch((err) =>
        console.warn('[riderController] tracking init failed:', err.message)
      );
    }

    return res.json({ success: true, message: `Order marked as ${status}`, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
