const CropPlan = require('../models/CropPlan');
const {
  CROP_AGRONOMY_DATABASE,
  generateSchedule,
  convertHarvestToListing,
} = require('../services/cropPlannerService');
const { emitToUser } = require('../services/socketService');

/**
 * GET /api/crop-plans/presets
 * Returns available crop templates and agronomy benchmarks
 */
async function getCropPresets(req, res, next) {
  try {
    const presets = Object.keys(CROP_AGRONOMY_DATABASE).map((key) => {
      const p = CROP_AGRONOMY_DATABASE[key];
      return {
        id: key,
        name: p.name,
        category: p.category,
        totalDays: p.totalDays,
        yieldPerAcreKg: p.yieldPerAcreKg,
        stagesCount: p.stages.length,
        stagesSummary: p.stages.map((s) => ({
          stageName: s.stageName,
          startDay: s.startDay,
          endDay: s.endDay,
          tasksCount: s.tasks.length,
        })),
      };
    });

    return res.json({
      success: true,
      data: presets,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/crop-plans
 * Get all crop plans for the logged-in farmer
 */
async function getMyPlans(req, res, next) {
  try {
    const farmerId = req.user._id || req.user.id;
    const { status } = req.query;

    const filter = { farmerId };
    if (status) {
      filter.status = status;
    }

    const plans = await CropPlan.find(filter)
      .sort({ createdAt: -1 })
      .populate('marketplaceCropId', 'name price unit quantity photos');

    // Compute live progress metrics for each plan
    const enhancedPlans = plans.map((p) => {
      const obj = p.toObject();
      const now = new Date();
      const plantDate = new Date(p.plantingDate);
      const daysElapsed = Math.max(0, Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, p.totalGrowthDays - daysElapsed);
      const progressPercent = Math.min(100, Math.round((daysElapsed / p.totalGrowthDays) * 100));

      let totalTasks = 0;
      let completedTasks = 0;
      let currentStageName = p.stages[0]?.stageName || 'Growth';

      p.stages.forEach((stg) => {
        if (daysElapsed >= stg.startDay && daysElapsed <= stg.endDay) {
          currentStageName = stg.stageName;
        }
        stg.tasks.forEach((tsk) => {
          totalTasks++;
          if (tsk.completed) completedTasks++;
        });
      });

      return {
        ...obj,
        daysElapsed,
        daysRemaining,
        progressPercent,
        totalTasks,
        completedTasks,
        currentStageName,
      };
    });

    return res.json({
      success: true,
      data: enhancedPlans,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/crop-plans/:id
 * Get single crop plan with complete stage breakdown
 */
async function getPlanById(req, res, next) {
  try {
    const farmerId = req.user._id || req.user.id;
    const plan = await CropPlan.findOne({ _id: req.params.id, farmerId }).populate('marketplaceCropId');

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Crop plan not found' });
    }

    const now = new Date();
    const plantDate = new Date(plan.plantingDate);
    const daysElapsed = Math.max(0, Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, plan.totalGrowthDays - daysElapsed);
    const progressPercent = Math.min(100, Math.round((daysElapsed / plan.totalGrowthDays) * 100));

    return res.json({
      success: true,
      data: {
        ...plan.toObject(),
        daysElapsed,
        daysRemaining,
        progressPercent,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/crop-plans
 * Create a new automated crop plan schedule
 */
async function createCropPlan(req, res, next) {
  try {
    const farmerId = req.user._id || req.user.id;
    const { cropType, variety, fieldArea, areaUnit, plantingDate, notes } = req.body;

    if (!cropType || !fieldArea || !plantingDate) {
      return res.status(400).json({
        success: false,
        message: 'Crop type, field area, and planting date are required',
      });
    }

    const schedule = generateSchedule({
      cropType,
      variety,
      fieldArea: Number(fieldArea),
      areaUnit: areaUnit || 'acres',
      plantingDate,
    });

    const newPlan = await CropPlan.create({
      farmerId,
      cropType: schedule.cropType,
      variety: schedule.variety,
      category: schedule.category,
      fieldArea: Number(fieldArea),
      areaUnit: areaUnit || 'acres',
      plantingDate: new Date(plantingDate),
      targetHarvestDate: schedule.targetHarvestDate,
      totalGrowthDays: schedule.totalGrowthDays,
      estimatedYieldKg: schedule.estimatedYieldKg,
      stages: schedule.stages,
      notes: notes || '',
      status: 'active',
    });

    // Notify farmer via Socket.io
    emitToUser(farmerId, 'plan_created', {
      title: '🌱 New Crop Schedule Created',
      message: `Crop plan for ${newPlan.cropType} (${newPlan.fieldArea} ${newPlan.areaUnit}) generated with ${schedule.totalGrowthDays}-day harvest schedule.`,
    });

    return res.status(201).json({
      success: true,
      message: 'Crop plan schedule created successfully',
      data: newPlan,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/crop-plans/:id/tasks/:taskId/toggle
 * Toggle a task completed status
 */
async function toggleTask(req, res, next) {
  try {
    const farmerId = req.user._id || req.user.id;
    const { id, taskId } = req.params;

    const plan = await CropPlan.findOne({ _id: id, farmerId });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Crop plan not found' });
    }

    let targetTask = null;
    for (const stage of plan.stages) {
      const task = stage.tasks.id(taskId);
      if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null;
        targetTask = task;
        break;
      }
    }

    if (!targetTask) {
      return res.status(404).json({ success: false, message: 'Task not found in plan' });
    }

    await plan.save();

    return res.json({
      success: true,
      message: `Task marked as ${targetTask.completed ? 'completed' : 'pending'}`,
      data: {
        task: targetTask,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/crop-plans/:id/convert-to-listing
 * Convert harvested crop plan directly to live Marketplace listing
 */
async function convertToListing(req, res, next) {
  try {
    const farmerId = req.user._id || req.user.id;
    const { id } = req.params;
    const { pricePerKg, description, photos, district, city } = req.body;

    const result = await convertHarvestToListing(id, farmerId, {
      pricePerKg,
      description,
      photos,
      district,
      city,
    });

    // Notify farmer
    emitToUser(farmerId, 'crop_listed', {
      title: '🛒 Harvest Listed on Marketplace!',
      message: `${result.crop.name} is now live on the marketplace for ৳${result.crop.price}/kg.`,
    });

    return res.status(201).json({
      success: true,
      message: 'Harvest converted to live marketplace listing successfully!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/crop-plans/:id
 * Delete or archive a crop plan
 */
async function deleteCropPlan(req, res, next) {
  try {
    const farmerId = req.user._id || req.user.id;
    const plan = await CropPlan.findOneAndDelete({ _id: req.params.id, farmerId });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Crop plan not found' });
    }

    return res.json({
      success: true,
      message: 'Crop plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCropPresets,
  getMyPlans,
  getPlanById,
  createCropPlan,
  toggleTask,
  convertToListing,
  deleteCropPlan,
};
