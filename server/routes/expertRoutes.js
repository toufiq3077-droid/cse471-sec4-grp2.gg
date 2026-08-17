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
  getPendingExperts,
} = require("../controllers/expertController");


router.get("/", getExperts);


// NOTE: must be declared before "/:id" or Express will treat "admin" as an :id value
router.get(
  "/admin/pending",
  authenticateToken,
  requireRole(["admin"]),
  getPendingExperts
);


router.get("/:id", getExpertById);


router.get("/:id/slots", getAvailableSlots);


router.post(
  "/register",
  authenticateToken,
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