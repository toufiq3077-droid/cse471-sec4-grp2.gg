const Crop = require('../models/Crop');
const CropPlan = require('../models/CropPlan');
const User = require('../models/User');

/**
 * Built-in Agronomy Knowledge Base for 10 Regional Crops
 * Provides standard duration, growth stages, default agronomy tasks, and yield estimates per acre.
 */
const CROP_AGRONOMY_DATABASE = {
  Rice: {
    name: 'Rice (Paddy)',
    category: 'grains',
    totalDays: 120,
    yieldPerAcreKg: 1800,
    stages: [
      {
        stageName: 'Seedbed & Germination',
        startDay: 0,
        endDay: 20,
        description: 'Seed soaking, nursery preparation, and initial seedling emergence.',
        tasks: [
          { taskName: 'Seed treatment with fungicide & soaking in water', category: 'general', dueDay: 1 },
          { taskName: 'Prepare raised nursery bed & sow treated seeds', category: 'general', dueDay: 3 },
          { taskName: 'Apply light basal fertilizer (DAP + Zinc) in nursery', category: 'fertilization', dueDay: 10 },
        ],
      },
      {
        stageName: 'Transplanting & Vegetative Tillering',
        startDay: 21,
        endDay: 60,
        description: 'Transplanting seedlings to puddled main field and active tiller formation.',
        tasks: [
          { taskName: 'Puddle main field & transplant 21-day seedlings (2-3 seedlings/hill)', category: 'general', dueDay: 22 },
          { taskName: 'Maintain 3-5 cm standing water layer in field', category: 'irrigation', dueDay: 25 },
          { taskName: 'First top-dressing: Apply Urea (40 kg/acre)', category: 'fertilization', dueDay: 35 },
          { taskName: 'First manual/mechanical weeding & scout for Stem Borer', category: 'weeding', dueDay: 42 },
          { taskName: 'Second top-dressing: Apply Urea + MOP potash', category: 'fertilization', dueDay: 55 },
        ],
      },
      {
        stageName: 'Panicle Initiation & Flowering',
        startDay: 61,
        endDay: 95,
        description: 'Booting, heading, and flowering stage. High water requirement.',
        tasks: [
          { taskName: 'Maintain critical 5 cm water depth during panicle emergence', category: 'irrigation', dueDay: 65 },
          { taskName: 'Inspect panicles for Brown Plant Hopper (BPH) & Leaf Blast', category: 'pest_control', dueDay: 75 },
          { taskName: 'Third light top-dressing: Apply Potassium boost if leaves pale', category: 'fertilization', dueDay: 85 },
        ],
      },
      {
        stageName: 'Grain Filling & Harvest Maturity',
        startDay: 96,
        endDay: 120,
        description: 'Dough stage, golden yellow grain ripening, and final harvest.',
        tasks: [
          { taskName: 'Drain water from field 10-14 days before harvest', category: 'irrigation', dueDay: 106 },
          { taskName: 'Check grain moisture (~20%) and prepare threshing ground', category: 'general', dueDay: 115 },
          { taskName: 'Harvest crop when 85% of panicles turn golden yellow', category: 'harvest', dueDay: 120 },
        ],
      },
    ],
  },
  Tomato: {
    name: 'Tomato',
    category: 'vegetables',
    totalDays: 90,
    yieldPerAcreKg: 8000,
    stages: [
      {
        stageName: 'Nursery & Seedling Establishment',
        startDay: 0,
        endDay: 25,
        description: 'Nursery tray sowing, true leaf emergence, and transplanting prep.',
        tasks: [
          { taskName: 'Sow seeds in coco-peat seedling trays', category: 'general', dueDay: 1 },
          { taskName: 'Hardening seedlings with reduced watering before transplanting', category: 'irrigation', dueDay: 20 },
          { taskName: 'Transplant 25-day seedlings to raised beds with 60cm spacing', category: 'general', dueDay: 25 },
        ],
      },
      {
        stageName: 'Vegetative Growth & Staking',
        startDay: 26,
        endDay: 50,
        description: 'Rapid stem branching, staking with bamboo sticks, and foliage feeding.',
        tasks: [
          { taskName: 'Install bamboo stakes and tie growing vines', category: 'general', dueDay: 30 },
          { taskName: 'Apply basal side-dressing: NPK (10:26:26) + Calcium Nitrate', category: 'fertilization', dueDay: 35 },
          { taskName: 'Prune lower suckers & scout for Early Blight leaf spots', category: 'pest_control', dueDay: 45 },
        ],
      },
      {
        stageName: 'Flowering & Fruit Setting',
        startDay: 51,
        endDay: 70,
        description: 'Yellow flower blossoms, fruit cluster formation, and blossom end rot check.',
        tasks: [
          { taskName: 'Foliar spray of Boron + Micronutrients to prevent flower drop', category: 'fertilization', dueDay: 55 },
          { taskName: 'Maintain steady drip irrigation (avoid wetting leaves)', category: 'irrigation', dueDay: 60 },
          { taskName: 'Inspect fruit clusters for Fruit Borer caterpillars', category: 'pest_control', dueDay: 68 },
        ],
      },
      {
        stageName: 'Fruit Ripening & Harvesting',
        startDay: 71,
        endDay: 90,
        description: 'Color turning from breaker stage to deep red harvest maturity.',
        tasks: [
          { taskName: 'First selective harvest at breaker/pink stage for market', category: 'harvest', dueDay: 75 },
          { taskName: 'Weekly continuous harvest & grading in crates', category: 'harvest', dueDay: 83 },
          { taskName: 'Final harvest clearance and field residue removal', category: 'harvest', dueDay: 90 },
        ],
      },
    ],
  },
  Potato: {
    name: 'Potato',
    category: 'vegetables',
    totalDays: 85,
    yieldPerAcreKg: 7500,
    stages: [
      {
        stageName: 'Sprouting & Emergence',
        startDay: 0,
        endDay: 20,
        description: 'Seed tuber planting, root development, and sprout emergence through soil.',
        tasks: [
          { taskName: 'Cut certified seed tubers with 2-3 eyes & treat with Mancozeb', category: 'general', dueDay: 1 },
          { taskName: 'Plant tubers in furrows with 20cm spacing and cover with soil ridge', category: 'general', dueDay: 3 },
          { taskName: 'Light first irrigation after sprout emergence', category: 'irrigation', dueDay: 15 },
        ],
      },
      {
        stageName: 'Vegetative Growth & Earthing-up',
        startDay: 21,
        endDay: 45,
        description: 'Canopy closure, stolon initiation, and ridge earthing-up.',
        tasks: [
          { taskName: 'First Earthing-up: Build high ridges to cover developing tubers', category: 'general', dueDay: 28 },
          { taskName: 'Apply top-dressing Urea (35 kg/acre) along ridges', category: 'fertilization', dueDay: 30 },
          { taskName: 'Preventive foliar spray against Late Blight (Metalaxyl + Mancozeb)', category: 'pest_control', dueDay: 40 },
        ],
      },
      {
        stageName: 'Tuber Bulking',
        startDay: 46,
        endDay: 70,
        description: 'Rapid carbohydrate accumulation and tuber size enlargement.',
        tasks: [
          { taskName: 'Apply Potash (SOP) spray to enhance tuber skin quality & starch', category: 'fertilization', dueDay: 50 },
          { taskName: 'Maintain uniform soil moisture; avoid waterlogging in furrows', category: 'irrigation', dueDay: 58 },
          { taskName: 'Inspect foliage for Aphids and Virus symptoms', category: 'pest_control', dueDay: 65 },
        ],
      },
      {
        stageName: 'Dehaulming & Harvest Maturity',
        startDay: 71,
        endDay: 85,
        description: 'Haulm cutting (dehaulming) to harden tuber skins prior to digging.',
        tasks: [
          { taskName: 'Cut and remove above-ground foliage (dehaulming) to harden skin', category: 'general', dueDay: 75 },
          { taskName: 'Withhold all irrigation for 10 days before digging', category: 'irrigation', dueDay: 76 },
          { taskName: 'Dig out mature tubers on a sunny dry day & cure in shade', category: 'harvest', dueDay: 85 },
        ],
      },
    ],
  },
  Wheat: {
    name: 'Wheat',
    category: 'grains',
    totalDays: 110,
    yieldPerAcreKg: 1200,
    stages: [
      {
        stageName: 'Crown Root Initiation (CRI)',
        startDay: 0,
        endDay: 25,
        description: 'Germination, seedling emergence, and critical Crown Root development.',
        tasks: [
          { taskName: 'Treat seeds with Carbendazim and drill in lines', category: 'general', dueDay: 1 },
          { taskName: 'Apply full basal dose: DAP + MOP + Gypsum', category: 'fertilization', dueDay: 2 },
          { taskName: 'First critical CRI irrigation (most crucial watering stage)', category: 'irrigation', dueDay: 21 },
        ],
      },
      {
        stageName: 'Tillering & Jointing',
        startDay: 26,
        endDay: 60,
        description: 'Secondary shoot formation and stem elongation.',
        tasks: [
          { taskName: 'First top-dressing: Broadcast Urea (35 kg/acre) after irrigation', category: 'fertilization', dueDay: 28 },
          { taskName: 'Manual weeding or selective broadleaf weed control', category: 'weeding', dueDay: 35 },
          { taskName: 'Second irrigation at late tillering / jointing stage', category: 'irrigation', dueDay: 45 },
        ],
      },
      {
        stageName: 'Heading & Flowering',
        startDay: 61,
        endDay: 85,
        description: 'Ear emergence and pollination.',
        tasks: [
          { taskName: 'Third irrigation at heading / flowering stage', category: 'irrigation', dueDay: 65 },
          { taskName: 'Scout wheat spikes for Yellow Rust & Aphids', category: 'pest_control', dueDay: 75 },
        ],
      },
      {
        stageName: 'Milking, Dough & Harvest',
        startDay: 86,
        endDay: 110,
        description: 'Grain filling, golden straw turning, and grain harvesting.',
        tasks: [
          { taskName: 'Fourth light irrigation at milk/dough stage if soil is dry', category: 'irrigation', dueDay: 88 },
          { taskName: 'Stop watering 15 days before harvest', category: 'irrigation', dueDay: 95 },
          { taskName: 'Harvest when grains are hard and moisture is below 14%', category: 'harvest', dueDay: 110 },
        ],
      },
    ],
  },
  Eggplant: {
    name: 'Eggplant (Brinjal)',
    category: 'vegetables',
    totalDays: 100,
    yieldPerAcreKg: 6000,
    stages: [
      {
        stageName: 'Nursery & Transplanting',
        startDay: 0,
        endDay: 30,
        description: 'Nursery care and transplanting to well-manured main field.',
        tasks: [
          { taskName: 'Sow seeds in raised nursery bed mixed with vermicompost', category: 'general', dueDay: 1 },
          { taskName: 'Transplant 30-day seedlings with 75cm row spacing', category: 'general', dueDay: 30 },
        ],
      },
      {
        stageName: 'Vegetative Growth & Side-dressing',
        startDay: 31,
        endDay: 60,
        description: 'Stout stem development and branching.',
        tasks: [
          { taskName: 'Apply top-dressing Urea + Potash around plant base', category: 'fertilization', dueDay: 40 },
          { taskName: 'Earthing-up around plant base to prevent lodging', category: 'general', dueDay: 45 },
          { taskName: 'Install Pheromone traps for Brinjal Shoot and Fruit Borer', category: 'pest_control', dueDay: 50 },
        ],
      },
      {
        stageName: 'Flowering & Continuous Fruiting',
        startDay: 61,
        endDay: 100,
        description: 'Purple blossom emergence and continuous glossy fruit production.',
        tasks: [
          { taskName: 'First picking of glossy, tender, medium-sized fruits', category: 'harvest', dueDay: 65 },
          { taskName: 'Regular picking every 4-5 days to stimulate continuous blooms', category: 'harvest', dueDay: 75 },
          { taskName: 'Weekly foliar micronutrient spray after heavy flushes', category: 'fertilization', dueDay: 85 },
          { taskName: 'Final harvest and crop clearance', category: 'harvest', dueDay: 100 },
        ],
      },
    ],
  },
  Corn: {
    name: 'Corn (Maize)',
    category: 'grains',
    totalDays: 95,
    yieldPerAcreKg: 2500,
    stages: [
      {
        stageName: 'Emergence & Early Whorl',
        startDay: 0,
        endDay: 20,
        description: 'Seed emergence and early leaf collar establishment.',
        tasks: [
          { taskName: 'Sow treated seeds in 60cm rows with 20cm plant spacing', category: 'general', dueDay: 1 },
          { taskName: 'Apply full basal dose of NPK + Zinc Sulphate', category: 'fertilization', dueDay: 2 },
          { taskName: 'Scout seedlings for Fall Armyworm in whorls', category: 'pest_control', dueDay: 14 },
        ],
      },
      {
        stageName: 'Rapid Growth & Tasseling',
        startDay: 21,
        endDay: 55,
        description: 'Rapid stalk elongation and male tassel appearance.',
        tasks: [
          { taskName: 'First knee-high stage top dressing: Urea (40 kg/acre)', category: 'fertilization', dueDay: 28 },
          { taskName: 'Furrow irrigation at knee-high stage', category: 'irrigation', dueDay: 30 },
          { taskName: 'Second top dressing at tasseling stage (Urea + Potash)', category: 'fertilization', dueDay: 50 },
        ],
      },
      {
        stageName: 'Silking & Grain Filling',
        startDay: 56,
        endDay: 80,
        description: 'Female silk emergence, pollination, and kernel development.',
        tasks: [
          { taskName: 'Ensure critical irrigation during silking to avoid blank cobs', category: 'irrigation', dueDay: 60 },
          { taskName: 'Monitor cob tips for corn earworm damage', category: 'pest_control', dueDay: 70 },
        ],
      },
      {
        stageName: 'Black Layer Maturity & Harvest',
        startDay: 81,
        endDay: 95,
        description: 'Husks turn dry papery brown and black layer forms at kernel base.',
        tasks: [
          { taskName: 'Check for black abscission layer at kernel base (physiologically mature)', category: 'general', dueDay: 88 },
          { taskName: 'Harvest dry cobs and sun-dry to 12% moisture', category: 'harvest', dueDay: 95 },
        ],
      },
    ],
  },
  Chili: {
    name: 'Chili (Green / Red Pepper)',
    category: 'vegetables',
    totalDays: 120,
    yieldPerAcreKg: 3000,
    stages: [
      {
        stageName: 'Nursery & Transplanting',
        startDay: 0,
        endDay: 35,
        description: 'Nursery management and transplanting onto raised ridges.',
        tasks: [
          { taskName: 'Sow seeds in sterile nursery bed and mulch with straw', category: 'general', dueDay: 1 },
          { taskName: 'Transplant healthy 35-day seedlings at 45cm spacing', category: 'general', dueDay: 35 },
        ],
      },
      {
        stageName: 'Branching & Canopy Development',
        startDay: 36,
        endDay: 65,
        description: 'Secondary and tertiary branch flush with basal feeding.',
        tasks: [
          { taskName: 'First side-dressing: Urea + Potash (MOP)', category: 'fertilization', dueDay: 45 },
          { taskName: 'Spray Neem oil / systemic insecticide for Thrips & Mites (leaf curl prevention)', category: 'pest_control', dueDay: 55 },
        ],
      },
      {
        stageName: 'Flowering & Fruit Flushes',
        startDay: 66,
        endDay: 120,
        description: 'Continuous white flowering and multiple fruit pickings.',
        tasks: [
          { taskName: 'First green chili harvest flush', category: 'harvest', dueDay: 75 },
          { taskName: 'Apply Potassium Nitrate foliar spray between flushes', category: 'fertilization', dueDay: 85 },
          { taskName: 'Second green/red chili picking flush', category: 'harvest', dueDay: 98 },
          { taskName: 'Final red chili harvest for drying', category: 'harvest', dueDay: 120 },
        ],
      },
    ],
  },
  Onion: {
    name: 'Onion',
    category: 'vegetables',
    totalDays: 105,
    yieldPerAcreKg: 4500,
    stages: [
      {
        stageName: 'Nursery & Field Transplanting',
        startDay: 0,
        endDay: 35,
        description: 'Raising seedlings and transplanting into flat beds.',
        tasks: [
          { taskName: 'Sow onion seeds in nursery beds', category: 'general', dueDay: 1 },
          { taskName: 'Transplant 35-day seedlings in flat beds with 15x10cm spacing', category: 'general', dueDay: 35 },
          { taskName: 'Immediate light irrigation after transplanting', category: 'irrigation', dueDay: 36 },
        ],
      },
      {
        stageName: 'Vegetative & Leaf Growth',
        startDay: 36,
        endDay: 70,
        description: 'Foliage number determines eventual bulb size.',
        tasks: [
          { taskName: 'First top dressing: Apply Urea (30 kg/acre)', category: 'fertilization', dueDay: 45 },
          { taskName: 'Careful shallow hand weeding to avoid root disturbance', category: 'weeding', dueDay: 52 },
          { taskName: 'Inspect for Onion Thrips and Purple Blotch disease', category: 'pest_control', dueDay: 65 },
        ],
      },
      {
        stageName: 'Bulb Swelling & Neck Fall Harvest',
        startDay: 71,
        endDay: 105,
        description: 'Bulb enlargement, neck softening, and tops falling over.',
        tasks: [
          { taskName: 'Apply Sulphur + Potash application for pungent bulb flavor and skin', category: 'fertilization', dueDay: 75 },
          { taskName: 'Cut off all irrigation 15 days before harvest to prevent rotting', category: 'irrigation', dueDay: 90 },
          { taskName: 'Harvest when 50-70% of plant tops fall over (neck fall)', category: 'harvest', dueDay: 105 },
        ],
      },
    ],
  },
  Mustard: {
    name: 'Mustard (Oilseed)',
    category: 'others',
    totalDays: 75,
    yieldPerAcreKg: 600,
    stages: [
      {
        stageName: 'Emergence & Seedling',
        startDay: 0,
        endDay: 20,
        description: 'Rapid germination and rosette stage establishment.',
        tasks: [
          { taskName: 'Direct broadcast/drill seeds with full basal NPK + Sulphur', category: 'fertilization', dueDay: 1 },
          { taskName: 'Thinning out crowded seedlings to maintain 10cm plant spacing', category: 'general', dueDay: 15 },
        ],
      },
      {
        stageName: 'Branching & Yellow Flowering',
        startDay: 21,
        endDay: 50,
        description: 'Vibrant yellow flower bloom and siliqua (pod) formation.',
        tasks: [
          { taskName: 'First irrigation at flowering stage', category: 'irrigation', dueDay: 30 },
          { taskName: 'Top-dressing with Urea (25 kg/acre) before watering', category: 'fertilization', dueDay: 30 },
          { taskName: 'Scout yellow blossoms for Mustard Aphids', category: 'pest_control', dueDay: 42 },
        ],
      },
      {
        stageName: 'Pod Filling & Harvesting',
        startDay: 51,
        endDay: 75,
        description: 'Pod filling, seed darkening, and harvest before pod shattering.',
        tasks: [
          { taskName: 'Second light irrigation at pod filling stage', category: 'irrigation', dueDay: 55 },
          { taskName: 'Harvest early morning when 75% of pods turn yellowish-brown', category: 'harvest', dueDay: 75 },
        ],
      },
    ],
  },
  Cabbage: {
    name: 'Cabbage',
    category: 'vegetables',
    totalDays: 80,
    yieldPerAcreKg: 9000,
    stages: [
      {
        stageName: 'Nursery & Field Transplanting',
        startDay: 0,
        endDay: 25,
        description: 'Nursery seedling development and field planting.',
        tasks: [
          { taskName: 'Sow seeds in nursery and treat with Trichoderma', category: 'general', dueDay: 1 },
          { taskName: 'Transplant 25-day seedlings with 45x45cm spacing on ridges', category: 'general', dueDay: 25 },
        ],
      },
      {
        stageName: 'Foliage & Head Initiation',
        startDay: 26,
        endDay: 55,
        description: 'Frame building and inner leaves cupping into solid heads.',
        tasks: [
          { taskName: 'First side-dressing: Urea (35 kg/acre) + Micronutrients', category: 'fertilization', dueDay: 35 },
          { taskName: 'Earthing-up ridges to anchor heavy heading plants', category: 'general', dueDay: 40 },
          { taskName: 'Inspect heads for Diamondback Moth (DBM) caterpillars', category: 'pest_control', dueDay: 50 },
        ],
      },
      {
        stageName: 'Head Firming & Harvest',
        startDay: 56,
        endDay: 80,
        description: 'Head density solidifies until firm and compact.',
        tasks: [
          { taskName: 'Maintain regular watering to prevent head splitting', category: 'irrigation', dueDay: 62 },
          { taskName: 'Harvest compact, firm heads with 2-3 wrapper leaves', category: 'harvest', dueDay: 80 },
        ],
      },
    ],
  },
};

/**
 * Convert area units to acres for yield calculations
 */
function convertToAcres(area, unit) {
  const num = Number(area) || 1;
  switch (unit) {
    case 'decimals':
      return num * 0.01; // 100 decimals = 1 acre
    case 'bigha':
      return num * 0.33; // ~3 bigha = 1 acre in Bangladesh
    case 'hectares':
      return num * 2.471; // 1 hectare = 2.471 acres
    case 'acres':
    default:
      return num;
  }
}

/**
 * Generate full crop lifecycle schedule with real calendar dates
 */
function generateSchedule({ cropType, variety, fieldArea, areaUnit, plantingDate }) {
  const preset = CROP_AGRONOMY_DATABASE[cropType] || CROP_AGRONOMY_DATABASE.Tomato;
  const plantDate = new Date(plantingDate);
  const totalDays = preset.totalDays;

  const targetHarvestDate = new Date(plantDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
  const acres = convertToAcres(fieldArea, areaUnit);
  const estimatedYieldKg = Math.round(acres * preset.yieldPerAcreKg);

  const now = new Date();
  const daysSincePlanting = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));

  const stages = preset.stages.map((stage) => {
    const stageStartDate = new Date(plantDate.getTime() + stage.startDay * 24 * 60 * 60 * 1000);
    const stageEndDate = new Date(plantDate.getTime() + stage.endDay * 24 * 60 * 60 * 1000);

    let stageStatus = 'pending';
    if (daysSincePlanting >= stage.startDay && daysSincePlanting <= stage.endDay) {
      stageStatus = 'in_progress';
    } else if (daysSincePlanting > stage.endDay) {
      stageStatus = 'completed';
    }

    const tasks = stage.tasks.map((task) => {
      const taskDueDate = new Date(plantDate.getTime() + task.dueDay * 24 * 60 * 60 * 1000);
      const isPastDue = daysSincePlanting > task.dueDay;
      return {
        taskName: task.taskName,
        category: task.category,
        dueDay: task.dueDay,
        dueDate: taskDueDate,
        completed: isPastDue, // default auto-check past tasks or leave unchecked based on preference
        completedAt: isPastDue ? taskDueDate : null,
        notes: '',
      };
    });

    return {
      stageName: stage.stageName,
      startDay: stage.startDay,
      endDay: stage.endDay,
      startDate: stageStartDate,
      endDate: stageEndDate,
      status: stageStatus,
      description: stage.description,
      tasks,
    };
  });

  return {
    cropType: preset.name,
    variety: variety || 'Standard Local Variety',
    category: preset.category,
    totalGrowthDays: totalDays,
    targetHarvestDate,
    estimatedYieldKg,
    stages,
  };
}

/**
 * Convert a mature crop plan directly into a live marketplace Crop listing
 */
async function convertHarvestToListing(planId, farmerId, { pricePerKg, description, photos, district, city }) {
  const plan = await CropPlan.findOne({ _id: planId, farmerId });
  if (!plan) {
    throw new Error('Crop plan not found or unauthorized');
  }

  const user = await User.findById(farmerId);
  const farmerName = user ? user.name : 'Verified Farmer';

  const newCrop = await Crop.create({
    farmerId,
    farmerName,
    name: `${plan.cropType} (${plan.variety})`,
    category: plan.category || 'vegetables',
    description: description || `Freshly harvested ${plan.cropType} cultivated under structured farm schedule. Total field yield: ${plan.estimatedYieldKg} kg.`,
    price: Number(pricePerKg) || 50,
    unit: 'kg',
    quantity: plan.estimatedYieldKg || 100,
    photos: photos && photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'],
    location: {
      district: district || user?.farmLocation?.district || 'Farm Location',
      city: city || user?.farmLocation?.locationName || 'Local Village',
    },
    status: 'available',
    soldCount: 0,
  });

  plan.status = 'listed';
  plan.marketplaceCropId = newCrop._id;
  await plan.save();

  return { crop: newCrop, plan };
}

module.exports = {
  CROP_AGRONOMY_DATABASE,
  convertToAcres,
  generateSchedule,
  convertHarvestToListing,
};
