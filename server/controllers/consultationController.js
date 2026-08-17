const Consultation = require("../models/Consultation");
const Expert = require("../models/Expert");
const ConsultationMessage = require("../models/ConsultationMessage");
const { emitToUser } = require("../services/socketService");

const PAYMENT_METHODS = ["mock_bkash", "cash_on_delivery"];

// Resolve whether the current req.user is the farmer or the expert on a
// given consultation. Returns { role: 'farmer'|'expert'|null, expert }
async function resolveParticipant(consultation, req) {
  const userId = String(req.user?.id || req.user?._id || "");
  const userRole = String(req.user?.role || "").toLowerCase();

  if (String(consultation.farmerId?._id || consultation.farmerId) === userId) {
    return { role: "farmer", expert: null };
  }

  if (userRole === "expert") {
    const expert = await Expert.findOne({ userId });
    if (expert && String(expert._id) === String(consultation.expertId?._id || consultation.expertId)) {
      return { role: "expert", expert };
    }
  }

  return { role: null, expert: null };
}


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
      farmerId: req.user?.id || req.user?._id,
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
      farmerId: req.user?.id || req.user?._id,
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
      userId: req.user?.id || req.user?._id,
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

    const currentUserId = String(req.user?.id || req.user?._id || '');
    const ownerId = String(consultation.farmerId || '');

    if (currentUserId && ownerId && currentUserId !== ownerId && String(req.user?.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this consultation.",
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

    const userRole = String(req.user?.role || '').toLowerCase();
    if (userRole !== 'admin') {
      const expert = await Expert.findOne({
        userId: req.user?.id || req.user?._id,
      });

      if (!expert || String(expert._id) !== String(consultation.expertId)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this consultation.",
        });
      }
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


// GET /api/consultations/:id
// Fetch a single consultation with full details, for the detail/chat page.
// Accessible to the farmer who booked it, the assigned expert, or an admin.
exports.getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate("farmerId", "name email phone")
      .populate("expertId");

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    const userRole = String(req.user?.role || "").toLowerCase();
    const { role: participantRole } = await resolveParticipant(consultation, req);

    if (!participantRole && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this consultation.",
      });
    }

    res.json({
      success: true,
      consultation,
      viewerRole: participantRole || "admin",
      chatEnabled: consultation.payment?.status === "paid",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// POST /api/consultations/:id/pay
// Farmer completes (mock) payment for a booked consultation. Once payment
// verification succeeds, the consultation is auto-confirmed and the secure
// chat channel unlocks for both the farmer and the expert.
exports.payConsultation = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Please choose a valid payment method.",
      });
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    const currentUserId = String(req.user?.id || req.user?._id || "");
    if (String(consultation.farmerId) !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Only the farmer who booked this consultation can pay for it.",
      });
    }

    if (consultation.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This consultation has been cancelled and cannot be paid for.",
      });
    }

    if (consultation.payment?.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This consultation has already been paid for.",
      });
    }

    const isMockBkash = paymentMethod === "mock_bkash";

    consultation.payment = {
      method: paymentMethod,
      status: isMockBkash ? "paid" : "unpaid",
      transactionId: isMockBkash
        ? `KHETI-CONSULT-${Date.now()}-${Math.floor(Math.random() * 100000)}`
        : "",
      paidAt: isMockBkash ? new Date() : null,
    };

    if (isMockBkash && consultation.status === "pending") {
      consultation.status = "confirmed";
    }

    await consultation.save();

    if (isMockBkash) {
      const expert = await Expert.findById(consultation.expertId);
      if (expert?.userId) {
        emitToUser(expert.userId, "consultation_paid", {
          consultationId: String(consultation._id),
          message: "A farmer has completed payment. Secure chat is now unlocked.",
        });
      }
    }

    res.json({
      success: true,
      message: isMockBkash
        ? "Payment verified successfully. Secure chat is now unlocked."
        : "Consultation marked for cash on delivery.",
      consultation,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// GET /api/consultations/:id/messages
// Only reachable once payment has been verified as "paid", and only by the
// two participants of the consultation (farmer & expert).
exports.getMessages = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    const { role: participantRole } = await resolveParticipant(consultation, req);

    if (!participantRole) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this consultation.",
      });
    }

    if (consultation.payment?.status !== "paid") {
      return res.status(402).json({
        success: false,
        message: "Chat unlocks after payment has been verified for this consultation.",
      });
    }

    const messages = await ConsultationMessage.find({ consultationId: consultation._id })
      .sort({ createdAt: 1 });

    const readField = participantRole === "farmer" ? "readByFarmer" : "readByExpert";
    await ConsultationMessage.updateMany(
      { consultationId: consultation._id, senderRole: { $ne: participantRole } },
      { $set: { [readField]: true } }
    );

    res.json({
      success: true,
      messages,
      viewerRole: participantRole,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// POST /api/consultations/:id/messages
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required.",
      });
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    const { role: participantRole } = await resolveParticipant(consultation, req);

    if (!participantRole) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this consultation.",
      });
    }

    if (consultation.payment?.status !== "paid") {
      return res.status(402).json({
        success: false,
        message: "Chat unlocks after payment has been verified for this consultation.",
      });
    }

    const senderId = req.user?.id || req.user?._id;

    const message = await ConsultationMessage.create({
      consultationId: consultation._id,
      senderId,
      senderRole: participantRole,
      text: text.trim(),
      readByFarmer: participantRole === "farmer",
      readByExpert: participantRole === "expert",
    });

    consultation.lastMessageAt = new Date();
    await consultation.save();

    // Notify the other participant in real time
    let recipientUserId = null;
    if (participantRole === "farmer") {
      const expert = await Expert.findById(consultation.expertId);
      recipientUserId = expert?.userId ? String(expert.userId) : null;
    } else {
      recipientUserId = String(consultation.farmerId);
    }

    if (recipientUserId) {
      emitToUser(recipientUserId, "consultation_message", {
        consultationId: String(consultation._id),
        message,
      });
    }

    res.status(201).json({
      success: true,
      message,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// POST /api/consultations/:id/end
// Either participant (farmer or expert) can end an active consultation.
// This marks it "completed" and notifies both sides in real time so the
// UI can show who ended it.
exports.endConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    const userRole = String(req.user?.role || "").toLowerCase();
    const { role: participantRole } = await resolveParticipant(consultation, req);

    if (!participantRole && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this consultation.",
      });
    }

    if (consultation.status === "completed" || consultation.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `This consultation is already ${consultation.status}.`,
      });
    }

    const endedByRole = participantRole || "admin";
    const endedByName = req.user?.name || "";

    consultation.status = "completed";
    consultation.endedBy = endedByRole;
    consultation.endedAt = new Date();

    await consultation.save();

    // Notify both participants so either side can show a popup naming
    // who ended the consultation.
    const expert = await Expert.findById(consultation.expertId);
    const payload = {
      consultationId: String(consultation._id),
      endedBy: endedByRole,
      endedByName,
    };

    emitToUser(consultation.farmerId, "consultation_ended", payload);
    if (expert?.userId) {
      emitToUser(expert.userId, "consultation_ended", payload);
    }

    res.json({
      success: true,
      message: "Consultation ended and marked as completed.",
      consultation,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// GET /api/consultations/admin/revenue
// Admin-only: monitor consultation revenue collected across the platform.
// GET /api/consultations/admin/pending-payments
// Admin: list "pay later" (cash on delivery) bookings that are still unpaid
// and awaiting admin approval before their chat can unlock.
exports.getPendingCashPayments = async (req, res) => {
  try {
    const consultations = await Consultation.find({
      "payment.method": "cash_on_delivery",
      "payment.status": "unpaid",
      status: { $ne: "cancelled" },
    })
      .populate("farmerId", "name email")
      .populate("expertId", "name specialization")
      .sort({ createdAt: -1 });

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


// PATCH /api/consultations/:id/approve-payment
// Admin: manually verify a "pay later" (cash on delivery) consultation.
// Marks payment.status as "paid" so the secure chat unlocks for both
// the farmer and the expert, exactly as if they'd paid via mock bKash.
exports.approveCashPayment = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    if (consultation.payment?.method !== "cash_on_delivery") {
      return res.status(400).json({
        success: false,
        message: "Only pay-later (cash on delivery) consultations can be approved this way.",
      });
    }

    if (consultation.payment?.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This consultation has already been marked as paid.",
      });
    }

    consultation.payment.status = "paid";
    consultation.payment.transactionId = `KHETI-CASH-APPROVED-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    consultation.payment.paidAt = new Date();

    if (consultation.status === "pending") {
      consultation.status = "confirmed";
    }

    await consultation.save();

    // Notify both participants — chat is now unlocked for them.
    emitToUser(consultation.farmerId, "consultation_paid", {
      consultationId: String(consultation._id),
      message: "Admin has verified your cash payment. Secure chat is now unlocked.",
    });

    const expert = await Expert.findById(consultation.expertId);
    if (expert?.userId) {
      emitToUser(expert.userId, "consultation_paid", {
        consultationId: String(consultation._id),
        message: "Admin has verified the farmer's cash payment. Secure chat is now unlocked.",
      });
    }

    res.json({
      success: true,
      message: "Payment approved. Secure chat is now unlocked for both parties.",
      consultation,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getConsultationRevenue = async (req, res) => {
  try {
    const paidMatch = { "payment.status": "paid" };

    const [totals] = await Consultation.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$fee" },
          paidConsultations: { $sum: 1 },
        },
      },
    ]);

    const statusBreakdown = await Consultation.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const revenueByExpert = await Consultation.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: "$expertId",
          revenue: { $sum: "$fee" },
          consultations: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "experts",
          localField: "_id",
          foreignField: "_id",
          as: "expert",
        },
      },
      { $unwind: { path: "$expert", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          expertId: "$_id",
          expertName: "$expert.name",
          specialization: "$expert.specialization",
          revenue: 1,
          consultations: 1,
        },
      },
    ]);

    const pendingPaymentCount = await Consultation.countDocuments({
      "payment.status": "unpaid",
      status: { $ne: "cancelled" },
    });

    res.json({
      success: true,
      revenue: {
        totalRevenue: totals?.totalRevenue || 0,
        paidConsultations: totals?.paidConsultations || 0,
        pendingPaymentCount,
        statusBreakdown: statusBreakdown.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        topExperts: revenueByExpert,
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};