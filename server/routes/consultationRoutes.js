const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const {
  bookConsultation,
  getMyConsultations,
  getExpertConsultations,
  cancelConsultation,
  updateConsultationStatus,
  getConsultationById,
  payConsultation,
  getMessages,
  sendMessage,
  endConsultation,
  getConsultationRevenue,
  getPendingCashPayments,
  approveCashPayment,
} = require("../controllers/consultationController");


router.post(
  "/book",
  authenticateToken,
  requireRole(["farmer"]),
  bookConsultation
);

router.get(
  "/my",
  authenticateToken,
  requireRole(["farmer"]),
  getMyConsultations
);

router.get(
  "/expert",
  authenticateToken,
  requireRole(["expert"]),
  getExpertConsultations
);

// Admin: platform-wide consultation revenue monitoring.
// NOTE: must be declared before "/:id" or Express will treat "admin" as an :id value.
router.get(
  "/admin/revenue",
  authenticateToken,
  requireRole(["admin"]),
  getConsultationRevenue
);

// Admin: list "pay later" bookings awaiting manual payment approval.
// NOTE: must be declared before "/:id" for the same reason as above.
router.get(
  "/admin/pending-payments",
  authenticateToken,
  requireRole(["admin"]),
  getPendingCashPayments
);

router.patch(
  "/:id/cancel",
  authenticateToken,
  requireRole(["farmer", "admin"]),
  cancelConsultation
);

router.patch(
  "/:id/status",
  authenticateToken,
  requireRole(["expert", "admin"]),
  updateConsultationStatus
);

// Mock payment verification for a booked consultation (farmer only).
router.post(
  "/:id/pay",
  authenticateToken,
  requireRole(["farmer"]),
  payConsultation
);

// Admin: manually verify a pay-later (cash on delivery) consultation,
// unlocking secure chat for both the farmer and the expert.
router.patch(
  "/:id/approve-payment",
  authenticateToken,
  requireRole(["admin"]),
  approveCashPayment
);

// Secure consultation chat — only unlocked once payment is verified.
router.get(
  "/:id/messages",
  authenticateToken,
  requireRole(["farmer", "expert"]),
  getMessages
);

router.post(
  "/:id/messages",
  authenticateToken,
  requireRole(["farmer", "expert"]),
  sendMessage
);

// Either participant can end an active consultation (marks it completed).
router.post(
  "/:id/end",
  authenticateToken,
  requireRole(["farmer", "expert"]),
  endConsultation
);

// Fetch a single consultation (farmer, assigned expert, or admin).
router.get(
  "/:id",
  authenticateToken,
  requireRole(["farmer", "expert", "admin"]),
  getConsultationById
);

module.exports = router;