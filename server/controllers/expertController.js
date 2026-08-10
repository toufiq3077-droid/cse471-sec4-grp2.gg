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

    const year = Number(req.query.year);
    const month = Number(req.query.month); // 1-indexed (1 = January)

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "year and month query params are required (month is 1-indexed)",
      });
    }

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1)); // first day of next month (exclusive)

    // Pull every booked slot for this expert in the target month in a single query
    const booked = await Consultation.find({
      expertId: expert._id,
      consultationDate: { $gte: monthStart, $lt: monthEnd },
      status: { $ne: "cancelled" },
    });

    const bookedByDate = {};
    booked.forEach((b) => {
      const key = b.consultationDate.toISOString().slice(0, 10);
      if (!bookedByDate[key]) bookedByDate[key] = [];
      bookedByDate[key].push(b.timeSlot);
    });

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const slots = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      const dayName = dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });

      const availability = expert.availability?.[dayName];
      if (!availability) continue;

      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const bookedSlots = bookedByDate[dateStr] || [];

      let hour = parseInt(availability.start.split(":")[0]);
      const endHour = parseInt(availability.end.split(":")[0]);

      const daySlots = [];
      while (hour < endHour) {
        const slot = `${String(hour).padStart(2, "0")}:00`;
        if (!bookedSlots.includes(slot)) {
          daySlots.push(slot);
        }
        hour++;
      }

      if (daySlots.length > 0) {
        slots[dateStr] = daySlots;
      }
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


exports.getPendingExperts = async (req, res) => {
  try {
    const status = ["pending", "approved", "rejected"].includes(req.query.status)
      ? req.query.status
      : "pending";

    const experts = await Expert.find({ status }).sort({ createdAt: -1 });

    res.json({
      success: true,
      experts,
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