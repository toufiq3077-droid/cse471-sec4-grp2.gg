const express = require("express");
const router = express.Router();

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

  registerExpert
);


router.patch(
  "/:id/approve",

  approveExpert
);


router.patch(
  "/:id/reject",

  rejectExpert
);

module.exports = router;