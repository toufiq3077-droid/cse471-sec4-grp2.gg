const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const {
  registerExpert,
  getExperts,
  getExpertById,
  getAvailableSlots,
  approveExpert,
  rejectExpert,
} = require("../controllers/expertController");


router.get("/", getExperts);


router.get("/:id", getExpertById);


router.get("/:id/slots", getAvailableSlots);


router.post(
  "/register",
  authenticateToken,
  requireRole(["expert"]),
  registerExpert
);


router.patch(
  "/:id/approve",
  authenticateToken,
  requireRole(["admin"]),
  approveExpert
);


router.patch(
  "/:id/reject",
  authenticateToken,
  requireRole(["admin"]),
  rejectExpert
);

module.exports = router;