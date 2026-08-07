const Expert = require("../models/Expert");
const Consultation = require("../models/Consultation");


exports.registerExpert = async (req, res) => {
  try {
    const existing = await Expert.findOne({
      userId: req.user?.id || req.user?._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an expert profile.",
      });
    }

    const expert = await Expert.create({
      ...req.body,
      userId: req.user?.id || req.user?._id || null,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Expert profile submitted successfully.",
      expert,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getExperts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 9;

    const search = req.query.search || "";
    const specialization = req.query.specialization || "";

    let query = {
      status: "approved",
    };

    if (search) {
      query.$text = {
        $search: search,
      };
    }

    if (specialization) {
      query.specialization = specialization;
    }

    const experts = await Expert.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({
        createdAt: -1,
      });

    const total = await Expert.countDocuments(query);

    res.json({
      success: true,
      experts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getExpertById = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    res.json({
      success: true,
      expert,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getAvailableSlots = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    const date = new Date(req.query.date);

    if (isNaN(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    const day = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const availability = expert.availability?.[day];

    if (!availability) {
      return res.json({
        success: true,
        slots: [],
      });
    }

    const booked = await Consultation.find({
      expertId: expert._id,
      consultationDate: date,
    });

    const bookedSlots = booked.map((b) => b.timeSlot);

    const slots = [];

    let hour = parseInt(availability.start.split(":")[0]);
    const endHour = parseInt(availability.end.split(":")[0]);

    while (hour < endHour) {
      const slot = `${String(hour).padStart(2, "0")}:00`;

      if (!bookedSlots.includes(slot)) {
        slots.push(slot);
      }

      hour++;
    }

    res.json({
      success: true,
      slots,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.approveExpert = async (req, res) => {
  try {
    const expert = await Expert.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
      },
      {
        new: true,
      }
    );

    res.json({
      success: true,
      message: "Expert approved successfully.",
      expert,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.rejectExpert = async (req, res) => {
  try {
    const expert = await Expert.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
      },
      {
        new: true,
      }
    );

    res.json({
      success: true,
      message: "Expert rejected.",
      expert,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};