const DiseaseLog = require('../../models/DiseaseLog');
const { GoogleGenAI } = require('@google/genai');

const DEFAULT_PROVIDER = 'gemini';
const GEMINI_MODEL = 'gemini-2.5-flash';
const HF_MODEL = process.env.HF_AI_MODEL || 'microsoft/Phi-3.5-vision-instruct';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  return new GoogleGenAI({ apiKey });
}

function getProviderName() {
  const provider = String(process.env.AI_PROVIDER || DEFAULT_PROVIDER).toLowerCase();

  if (provider === 'gemini' || provider === 'free' || provider === 'huggingface') {
    return provider;
  }

  return DEFAULT_PROVIDER;
}

async function callFreeVisionApi(file, prompt) {
  const apiKey = process.env.HF_API_KEY;

  if (!apiKey) {
    const error = new Error('HF_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        image: file.buffer.toString('base64'),
        prompt,
      },
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Free vision API request failed: ${errorText}`);
    error.statusCode = response.status || 502;
    throw error;
  }

  return response.json();
}

function ensureValidImage(file) {
  if (!file) {
    const error = new Error('No image file was provided');
    error.statusCode = 400;
    throw error;
  }

  if (!SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
    const error = new Error('Unsupported file type. Only JPEG, PNG, and WEBP are allowed.');
    error.statusCode = 400;
    throw error;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const error = new Error('Image size must be 5MB or smaller.');
    error.statusCode = 400;
    throw error;
  }
}

function buildDiagnosisPrompt() {
  return [
    'You are an expert agricultural plant disease diagnosis assistant.',
    'Analyze the leaf image and identify the most likely crop disease or health issue.',
    'Return ONLY valid JSON. Do not include markdown, code fences, explanations, or extra keys.',
    'Use this exact JSON shape:',
    '{',
    '"diseaseName":"",',
    '"confidence":"",',
    '"description":"",',
    '"symptoms":"",',
    '"severity":"",',
    '"organicTreatment":"",',
    '"chemicalTreatment":"",',
    '"fertilizer":"",',
    '"prevention":"",',
    '"irrigationAdvice":"",',
    '"harvestSafety":""',
    '}',
    'Make the fields concise but useful for a farmer.',
    'If the disease is uncertain, state the best matching disease and lower the confidence value.',
    'Confidence must be a numeric value between 0 and 100.',
  ].join(' ');
}

function extractJsonPayload(text) {
  if (!text || typeof text !== 'string') {
    const error = new Error('Gemini returned an empty response');
    error.statusCode = 502;
    throw error;
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (initialError) {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const jsonCandidate = trimmed.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonCandidate);
    }

    const error = new Error('Gemini returned invalid JSON');
    error.statusCode = 502;
    error.cause = initialError;
    throw error;
  }
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizeConfidence(value) {
  const numericConfidence = Number(value);

  if (Number.isFinite(numericConfidence)) {
    if (numericConfidence < 0) {
      return 0;
    }

    if (numericConfidence > 100) {
      return 100;
    }

    return numericConfidence;
  }

  return 0;
}

function normalizeDiagnosisPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    const error = new Error('Gemini response payload is malformed');
    error.statusCode = 502;
    throw error;
  }

  return {
    diseaseName: normalizeText(payload.diseaseName),
    confidence: normalizeConfidence(payload.confidence),
    description: normalizeText(payload.description),
    symptoms: normalizeText(payload.symptoms),
    severity: normalizeText(payload.severity),
    organicTreatment: normalizeText(payload.organicTreatment),
    chemicalTreatment: normalizeText(payload.chemicalTreatment),
    fertilizer: normalizeText(payload.fertilizer),
    prevention: normalizeText(payload.prevention),
    irrigationAdvice: normalizeText(payload.irrigationAdvice),
    harvestSafety: normalizeText(payload.harvestSafety),
  };
}

async function diagnoseLeafDisease(file) {
  ensureValidImage(file);

  const prompt = buildDiagnosisPrompt();

  let payload;

  try {

    if (getProviderName() === 'gemini') {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.mimetype,
                  data: file.buffer.toString('base64'),
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      payload = extractJsonPayload(response.text);
    } else {
      const freeResponse = await callFreeVisionApi(file, prompt);
      const candidate = Array.isArray(freeResponse) ? freeResponse[0] : freeResponse;
      payload = typeof candidate === 'string' ? extractJsonPayload(candidate) : candidate;
    }
  } catch (error) {
    const diagnosisError = new Error('Diagnosis request failed');
    diagnosisError.statusCode = error.statusCode || 502;
    diagnosisError.cause = error;
    throw diagnosisError;
  }

  return normalizeDiagnosisPayload(payload);
}

async function createDiseaseLog({ farmerId, imageUrl, diagnosis }) {
  const diseaseLog = await DiseaseLog.create({
    farmer: farmerId,
    imageUrl,
    diseaseName: diagnosis.diseaseName,
    confidence: diagnosis.confidence,
    description: diagnosis.description,
    symptoms: diagnosis.symptoms,
    severity: diagnosis.severity,
    organicTreatment: diagnosis.organicTreatment,
    chemicalTreatment: diagnosis.chemicalTreatment,
    fertilizer: diagnosis.fertilizer,
    prevention: diagnosis.prevention,
    irrigationAdvice: diagnosis.irrigationAdvice,
    harvestSafety: diagnosis.harvestSafety,
  });

  return diseaseLog;
}

async function listFarmerDiseaseLogs(farmerId) {
  return DiseaseLog.find({ farmer: farmerId })
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  createDiseaseLog,
  diagnoseLeafDisease,
  listFarmerDiseaseLogs,
};
