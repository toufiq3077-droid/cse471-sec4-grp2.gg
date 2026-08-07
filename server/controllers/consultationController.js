const Consultation = require("../models/Consultation");
const Expert = require("../models/Expert");


exports.bookConsultation = async (req, res) => {
  try {
    const {
      expertId,
      consultationDate,
      timeSlot,
      notes
    } = req.body;

    
    const expert = await Expert.findById(expertId);

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    if (expert.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Expert is not approved yet.",
      });
    }

    const exists = await Consultation.findOne({
      expertId,
      consultationDate: new Date(consultationDate),
      timeSlot,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "This slot has already been booked.",
      });
    }

    const consultation = await Consultation.create({
      farmerId: req.user.id,
      expertId,
      consultationDate,
      timeSlot,
      notes,
      fee: expert.fee,
      status: "pending",
    });

    
    await Expert.findByIdAndUpdate(expertId, {
      $inc: {
        totalConsultations: 1,
      },
    });

    res.status(201).json({
      success: true,
      message: "Consultation booked successfully.",
      consultation,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getMyConsultations = async (req, res) => {
  try {

    const consultations = await Consultation.find({
      farmerId: req.user.id,
    })
      .populate("expertId")
      .sort({
        consultationDate: -1,
      });

    res.json({
      success: true,
      consultations,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};


exports.getExpertConsultations = async (req, res) => {

  try {

    const expert = await Expert.findOne({
      userId: req.user.id,
    });

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert profile not found.",
      });
    }

    const consultations = await Consultation.find({
      expertId: expert._id,
    })
      .populate("farmerId")
      .sort({
        consultationDate: -1,
      });

    res.json({
      success: true,
      consultations,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};


exports.cancelConsultation = async (req, res) => {

  try {

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    consultation.status = "cancelled";

    await consultation.save();

    res.json({
      success: true,
      message: "Consultation cancelled successfully.",
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};


exports.updateConsultationStatus = async (req, res) => {

  try {

    const { status } = req.body;

    const allowed = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation status.",
      });
    }

    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
      }
    );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully.",
      consultation,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};