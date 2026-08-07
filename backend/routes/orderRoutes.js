const express = require("express");
const { createOrder, getOrderById, getMyOrders, payOrder } = require("../controllers/orderController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Must come before "/:id"
router.get("/mine", protect, authorize("buyer"), getMyOrders);

router.post("/", optionalAuth, createOrder);
router.post("/:id/pay", payOrder);
router.get("/:id", getOrderById);

module.exports = router;
