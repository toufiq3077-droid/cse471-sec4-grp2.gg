const DiseaseLog = require('../../models/DiseaseLog');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

const DEFAULT_PROVIDER = 'huggingface';
const GEMINI_MODEL = 'gemini-2.0-flash';

// HuggingFace: use the new OpenAI-compatible Inference Providers router
// Qwen2.5-VL is a Vision Language Model — accepts image + text in one call
const HF_ROUTER_BASE = 'https://router.huggingface.co/v1';
const HF_VLM_MODEL = 'Qwen/Qwen3-VL-30B-A3B-Instruct';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// ─── Gemini client ────────────────────────────────────────────────────────────
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
  if (provider === 'gemini' || provider === 'huggingface') return provider;
  return DEFAULT_PROVIDER;
}

// ─── HuggingFace VLM call ─────────────────────────────────────────────────────
async function callHuggingFaceVLM(file) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    const error = new Error('HF_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  const base64Image = file.buffer.toString('base64');
  const mimeType = file.mimetype || 'image/jpeg';

  const systemPrompt = [
    'You are an expert agricultural plant disease diagnosis assistant.',
    'Analyze the provided leaf image and identify the most likely crop disease or health issue.',
    'Return ONLY valid JSON. Do not include markdown, code fences, explanations, or extra keys.',
    'Use this exact JSON shape:',
    '{"diseaseName":"","confidence":75,"description":"","symptoms":"","severity":"",',
    '"organicTreatment":"","chemicalTreatment":"","fertilizer":"","prevention":"",',
    '"irrigationAdvice":"","harvestSafety":""}',
    'Confidence must be a number between 0 and 100.',
    'Make all fields concise but useful for a farmer.',
    'If uncertain, state the best matching disease and lower the confidence value.',
  ].join(' ');

  const response = await axios.post(
    `${HF_ROUTER_BASE}/chat/completions`,
    {
      model: HF_VLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            {
              type: 'text',
              text: 'Analyze this leaf image and diagnose the plant disease. Return ONLY the JSON.',
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );

  return response.data?.choices?.[0]?.message?.content;
}

// ─── Image validation ─────────────────────────────────────────────────────────
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

// ─── Gemini prompt ────────────────────────────────────────────────────────────
function buildGeminiPrompt() {
  return [
    'You are an expert agricultural plant disease diagnosis assistant.',
    'Analyze the leaf image and identify the most likely crop disease or health issue.',
    'Return ONLY valid JSON. Do not include markdown, code fences, explanations, or extra keys.',
    'Use this exact JSON shape:',
    '{"diseaseName":"","confidence":75,"description":"","symptoms":"","severity":"",',
    '"organicTreatment":"","chemicalTreatment":"","fertilizer":"","prevention":"",',
    '"irrigationAdvice":"","harvestSafety":""}',
    'Confidence must be a numeric value between 0 and 100.',
    'Make the fields concise but useful for a farmer.',
  ].join(' ');
}

// ─── JSON extraction ──────────────────────────────────────────────────────────
function extractJsonPayload(text) {
  if (!text || typeof text !== 'string') {
    const error = new Error('AI returned an empty response');
    error.statusCode = 502;
    throw error;
  }

  // Strip markdown fences if present
  const stripped = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  try {
    return JSON.parse(stripped);
  } catch (_) {
    const firstBrace = stripped.indexOf('{');
    const lastBrace = stripped.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(stripped.slice(firstBrace, lastBrace + 1));
      } catch (__) {}
    }

    const error = new Error('AI returned invalid JSON');
    error.statusCode = 502;
    throw error;
  }
}

// ─── Normalization ────────────────────────────────────────────────────────────
function normalizeText(value, fallback = 'N/A') {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str.length > 0 ? str : fallback;
}

function normalizeConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function normalizeDiagnosisPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    const error = new Error('AI response payload is malformed');
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

// ─── Main diagnosis function ──────────────────────────────────────────────────
async function diagnoseLeafDisease(file) {
  ensureValidImage(file);

  let payload;

  try {
    if (getProviderName() === 'gemini') {
      // ── Gemini path ──────────────────────────────────────────────────────
      const client = getGeminiClient();
      const prompt = buildGeminiPrompt();
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
        config: { responseMimeType: 'application/json', temperature: 0.2 },
      });
      payload = extractJsonPayload(response.text);

    } else {
      // ── HuggingFace path: Qwen2.5-VL (vision + text, single call) ────
      console.log('[AI] Using HuggingFace Qwen2.5-VL vision model...');
      const rawText = await callHuggingFaceVLM(file);
      console.log('[AI] Raw VLM output:', rawText);
      payload = extractJsonPayload(rawText);
    }

  } catch (error) {
    console.error('--- AI DIAGNOSIS ERROR ---');
    console.error(error.response?.data || error.message || error);
    const diagnosisError = new Error('Diagnosis request failed');
    diagnosisError.statusCode = error.response?.status || error.statusCode || 502;
    diagnosisError.cause = error;
    throw diagnosisError;
  }

  return normalizeDiagnosisPayload(payload);
}

// ─── Disease log helpers ──────────────────────────────────────────────────────
async function createDiseaseLog({ farmerId, imageUrl, diagnosis }) {
  return DiseaseLog.create({
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
