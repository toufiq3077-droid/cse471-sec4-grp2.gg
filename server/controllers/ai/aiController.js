const {
  createDiseaseLog,
  diagnoseLeafDisease,
  listFarmerDiseaseLogs,
} = require('../../services/ai/diseaseDiagnosisService');

function buildImageUrl(file) {
  if (!file) {
    return '';
  }

  if (file.location) {
    return file.location;
  }

  if (file.path) {
    return file.path;
  }

  if (file.buffer && file.mimetype) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  return file.originalname || '';
}

function formatDiagnosisResponse(log) {
  return {
    diseaseName: log.diseaseName,
    confidence: log.confidence,
    description: log.description,
    symptoms: log.symptoms,
    severity: log.severity,
    treatment: {
      organic: log.organicTreatment,
      chemical: log.chemicalTreatment,
      fertilizer: log.fertilizer,
      prevention: log.prevention,
      irrigation: log.irrigationAdvice,
      harvestSafety: log.harvestSafety,
    },
  };
}

async function diagnoseLeafDiseaseController(req, res, next) {
  try {
    const farmerId = req.user && (req.user._id || req.user.id);

    if (!farmerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const diagnosis = await diagnoseLeafDisease(req.file);
    const imageUrl = buildImageUrl(req.file);
    const diseaseLog = await createDiseaseLog({
      farmerId,
      imageUrl,
      diagnosis,
    });

    return res.status(201).json({
      message: 'Diagnosis completed successfully',
      data: {
        ...formatDiagnosisResponse(diseaseLog),
        imageUrl: diseaseLog.imageUrl,
        createdAt: diseaseLog.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getDiagnosisHistoryController(req, res, next) {
  try {
    const farmerId = req.user && (req.user._id || req.user.id);

    if (!farmerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const history = await listFarmerDiseaseLogs(farmerId);

    return res.status(200).json({
      message: 'Diagnosis history retrieved successfully',
      data: history,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  diagnoseLeafDiseaseController,
  getDiagnosisHistoryController,
};
