const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const {
  bookConsultation,
  getMyConsultations,
  getExpertConsultations,
  cancelConsultation,
  updateConsultationStatus,
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

router.patch(
  "/:id/cancel",
  authenticateToken,
  requireRole(["farmer", "admin"]),
  cancelConsultation
);


router.get(
  "/expert",
  authenticateToken,
  requireRole(["expert"]),
  getExpertConsultations
);


router.patch(
  "/:id/status",
  authenticateToken,
  requireRole(["expert", "admin"]),
  updateConsultationStatus
);

module.exports = router;