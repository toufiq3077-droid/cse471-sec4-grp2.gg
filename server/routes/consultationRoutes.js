const express = require("express");
const router = express.Router();

const {
  bookConsultation,
  getMyConsultations,
  getExpertConsultations,
  cancelConsultation,
  updateConsultationStatus,
} = require("../controllers/consultationController");


router.post(
  "/book",

  bookConsultation
);

router.get(
  "/my",

  getMyConsultations
);

router.patch(
  "/:id/cancel",

  cancelConsultation
);


router.get(
  "/expert",

  getExpertConsultations
);


router.patch(
  "/:id/status",

  updateConsultationStatus
);

module.exports = router;