const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Crop = require("../models/Crop");

// @desc    Create a new order from buyer checkout
// @route   POST /api/orders
// @access  Public (works for logged-in buyers and guests via optionalAuth)
const createOrder = asyncHandler(async (req, res) => {
  if (req.user && req.user.role !== "buyer") {
    res.status(403);
    throw new Error("Only buyer accounts can place orders");
  }

  let {
    buyerName,
    buyerEmail,
    buyerPhone,
    shippingAddress = {},
    paymentMethod,
    orderItems,
  } = req.body;

  // If logged in as a buyer, fall back to the account's own details when not provided
  if (req.user) {
    buyerName = buyerName || req.user.name;
    buyerEmail = buyerEmail || req.user.email;
    buyerPhone = buyerPhone || req.user.phone;
  }

  if (
    !buyerName ||
    !buyerEmail ||
    !buyerPhone ||
    !paymentMethod ||
    !Array.isArray(orderItems) ||
    orderItems.length === 0
  ) {
    res.status(400);
    throw new Error(
      "Buyer name, email, phone, payment method and at least one order item are required"
    );
  }

  if (!["Cash on Delivery", "Digital Payment"].includes(paymentMethod)) {
    res.status(400);
    throw new Error("Payment method must be Cash on Delivery or Digital Payment");
  }

  const validatedItems = [];
  let totalAmount = 0;

  for (const item of orderItems) {
    const crop = await Crop.findById(item.crop).populate("farmer", "name farmName");

    if (!crop) {
      res.status(404);
      throw new Error(`Crop listing not found: ${item.crop}`);
    }

    if (crop.status !== "Active") {
      res.status(400);
      throw new Error(`Crop ${crop.name} is not available for purchase`);
    }

    const quantity = Number(item.quantity);
    if (!quantity || quantity < 1) {
      res.status(400);
      throw new Error(`Invalid quantity for ${crop.name}`);
    }

    if (quantity > crop.stockQuantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${crop.name}`);
    }

    const itemTotal = crop.pricePerUnit * quantity;
    totalAmount += itemTotal;

    validatedItems.push({
      crop: crop._id,
      name: crop.name,
      unit: crop.unit,
      pricePerUnit: crop.pricePerUnit,
      quantity,
      image: crop.images?.[0]?.url || "",
      farmer: crop.farmer?._id,
    });
  }

  const order = await Order.create({
    buyer: req.user ? req.user._id : undefined,
    buyerName,
    buyerEmail,
    buyerPhone,
    shippingAddress,
    paymentMethod,
    paymentStatus: "Pending",
    orderItems: validatedItems,
    totalAmount,
  });

  await Promise.all(
    validatedItems.map(async (item) => {
      const crop = await Crop.findById(item.crop);
      crop.stockQuantity = Math.max(0, crop.stockQuantity - item.quantity);
      if (crop.stockQuantity === 0) {
        crop.status = "Out of Stock";
      }
      await crop.save();
    })
  );

  res.status(201).json({ success: true, data: order });
});

// @desc    Get order by id for invoice display
// @route   GET /api/orders/:id
// @access  Public
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.json({ success: true, data: order });
});

const payOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.paymentMethod !== "Digital Payment") {
    res.status(400);
    throw new Error("Only orders with Digital Payment can be paid online");
  }

  if (order.paymentStatus === "Paid") {
    return res.json({ success: true, data: order });
  }

  order.paymentStatus = "Paid";
  await order.save();

  res.json({ success: true, data: order });
});

// @desc    Get order history for the logged-in buyer
// @route   GET /api/orders/mine
// @access  Private (Buyer)
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: orders.length, data: orders });
});

module.exports = { createOrder, getOrderById, getMyOrders, payOrder };
