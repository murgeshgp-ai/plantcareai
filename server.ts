import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts base64 payload and MIME type from a data URL, raw base64 string,
 * or local public file path (e.g. /images/plants/monstera.jpg).
 */
function extractImageBase64(image: string): { mimeType: string; base64Data: string } {
  let mimeType = 'image/jpeg';
  let base64Data = image;

  const dataUrlMatch = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch && dataUrlMatch.length === 3) {
    mimeType = dataUrlMatch[1];
    base64Data = dataUrlMatch[2];
  } else if (image.includes(',')) {
    const parts = image.split(',');
    base64Data = parts[1];
  } else if (image.startsWith('/') || image.startsWith('./')) {
    // Resolve local public image file
    const cleanPath = image.replace(/^\.?\//, '');
    const fullPath = path.resolve(__dirname, 'public', cleanPath);
    if (fs.existsSync(fullPath)) {
      const fileBuf = fs.readFileSync(fullPath);
      base64Data = fileBuf.toString('base64');
      if (cleanPath.endsWith('.png')) mimeType = 'image/png';
      else if (cleanPath.endsWith('.webp')) mimeType = 'image/webp';
      else mimeType = 'image/jpeg';
    }
  }

  return { mimeType, base64Data };
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Parse JSON request bodies up to 25MB for image uploads
app.use(express.json({ limit: '25mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Checks if an error returned by Gemini or the network is transient/temporary
 */
function isTransientError(err: any): boolean {
  const status = err?.status || err?.statusCode || 0;
  const msg = (err?.message || '').toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable') ||
    msg.includes('resource has been exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    err?.code === 'ECONNRESET' ||
    err?.code === 'ETIMEDOUT'
  );
}

/**
 * Maps raw API or system errors into friendly, polished human-readable messages
 */
function getFriendlyErrorMessage(
  err: any,
  service: 'identification' | 'assistant' | 'diagnosis' = 'identification'
): { message: string; statusCode: number; isTemporary: boolean } {
  const status = err?.status || err?.statusCode || 0;
  const msg = (err?.message || '').toLowerCase();
  const isAssistant = service === 'assistant';
  const isDiagnosis = service === 'diagnosis';

  if (status === 503 || msg.includes('503') || msg.includes('overloaded') || msg.includes('unavailable')) {
    return {
      message: isDiagnosis
        ? 'The plant disease diagnosis service is currently experiencing high demand. Please try again in a few moments.'
        : isAssistant
        ? 'The plant care assistant is currently experiencing high demand. Please try asking again in a few moments.'
        : 'The plant identification service is currently experiencing high demand. Please try again in a few moments, or enter your plant details manually below.',
      statusCode: 503,
      isTemporary: true,
    };
  }

  if (status === 429 || msg.includes('429') || msg.includes('resource has been exhausted') || msg.includes('quota') || msg.includes('rate limit')) {
    return {
      message: isDiagnosis
        ? 'Plant disease diagnosis requests are temporarily paused due to high traffic. Please wait a moment and try again.'
        : isAssistant
        ? 'Plant care assistant requests are temporarily paused due to high traffic. Please wait a moment and try again.'
        : 'Plant identification requests are temporarily paused due to high traffic. Please wait a moment or enter the details manually below.',
      statusCode: 429,
      isTemporary: true,
    };
  }

  if (msg.includes('api_key') || msg.includes('api key') || status === 401 || status === 403) {
    return {
      message: 'Gemini API authentication issue. Please verify your API key is configured in the AI Studio Secrets panel.',
      statusCode: 500,
      isTemporary: false,
    };
  }

  if (msg.includes('network') || msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('fetch failed')) {
    return {
      message: isDiagnosis
        ? 'A temporary network connection issue occurred while connecting to the diagnosis service. Please check your internet connection and try again.'
        : isAssistant
        ? 'A temporary network connection issue occurred while connecting to the AI assistant. Please check your internet connection and try again.'
        : 'A temporary network connection issue occurred while connecting to the AI service. Please check your internet connection or enter details manually below.',
      statusCode: 503,
      isTemporary: true,
    };
  }

  return {
    message: isDiagnosis
      ? 'Unable to complete plant disease diagnosis at the moment. Please try again with a clear photograph.'
      : isAssistant
      ? 'The plant care assistant encountered an unexpected error. Please try asking your question again.'
      : 'Unable to identify this plant at the moment. Your photograph has been preserved so you can enter the details manually below.',
    statusCode: 500,
    isTemporary: false,
  };
}

/**
 * Server-side retry with exponential backoff for transient Gemini errors (max 3 attempts)
 */
async function generateContentWithRetry(params: any, maxRetries = 3, baseDelayMs = 800) {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent(params);
      return { response, attemptCount: attempt };
    } catch (err: any) {
      lastError = err;
      const transient = isTransientError(err);
      console.warn(`[Gemini API] Server attempt ${attempt}/${maxRetries} encountered error. Transient: ${transient}. Message: ${err?.message || err}`);
      
      // If 429 quota exhausted on gemini-3.8-flash, seamlessly fallback to gemini-3.1-flash-lite
      if (params.model === 'gemini-3.8-flash' && (err?.status === 429 || err?.statusCode === 429 || String(err?.message || '').includes('429') || String(err?.message || '').includes('quota') || String(err?.message || '').includes('RESOURCE_EXHAUSTED'))) {
        try {
          console.log('[Gemini API] Falling back to gemini-3.1-flash-lite due to 3.8-flash quota exhaustion.');
          const fallbackResponse = await ai.models.generateContent({
            ...params,
            model: 'gemini-3.1-flash-lite',
          });
          return { response: fallbackResponse, attemptCount: attempt };
        } catch (fallbackErr) {
          console.warn('[Gemini API] Fallback model also encountered error:', fallbackErr);
        }
      }

      if (attempt < maxRetries && transient) {
        const delay = baseDelayMs * Math.pow(1.5, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// Endpoint: Identify Plant via Gemini AI Vision
app.post('/api/identify-plant', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a valid plant photograph to identify.' 
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server. Please check the AI Studio Secrets panel.',
      });
    }

    // Support simulated test error header for deterministic verification of error handling
    if (req.headers['x-simulate-error'] === '503') {
      const friendly = getFriendlyErrorMessage({ status: 503, message: 'The model is overloaded (simulated test error)' });
      return res.status(503).json({
        success: false,
        error: friendly.message,
        isTemporary: true,
        statusCode: 503,
      });
    }

    // Parse image mime type and base64 payload
    const { mimeType, base64Data } = extractImageBase64(image);

    const { response, attemptCount } = await generateContentWithRetry({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: `You are an expert botanist and horticulturist. Analyze this photograph of a plant.
Carefully identify:
1. Whether this image contains a plant, leaf, flower, or botanical specimen (isPlant).
2. The most common household or garden name (commonName).
3. The exact scientific botanical genus and species (botanicalName).
4. Confidence level of identification (High, Medium, or Low).
5. The ideal sunlight requirement: exactly one of 'Low light', 'Medium indirect', 'Bright indirect', or 'Direct sunlight'.
6. Recommended watering frequency in days for an indoor potted plant (wateringDays: integer, typically 3 to 21 days).
7. Recommended fertilizing frequency in days during growing season (fertilizingDays: integer, typically 14 to 60 days).
8. Recommended pruning or foliage cleaning interval in days (pruningDays: integer, typically 30 to 120 days).
9. The best matching archetype for the illustration: exactly one of 'monstera', 'fig', 'snake', 'peacelily', 'pothos', 'calathea', 'succulent', or 'generic'.
10. Helpful botanical care notes including humidity, temperature, pet safety / toxicity, and repotting advice (careNotes).

If the image is not a plant, set isPlant to false, provide a gentle note in careNotes, and suggest common indoor plant defaults.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPlant: {
              type: Type.BOOLEAN,
              description: 'Whether the image contains a plant, leaf, or flora.',
            },
            commonName: {
              type: Type.STRING,
              description: 'Popular common name of the plant (e.g. Monstera Deliciosa, Snake Plant, Peace Lily).',
            },
            botanicalName: {
              type: Type.STRING,
              description: 'Scientific Latin botanical name (e.g. Monstera deliciosa, Sansevieria trifasciata).',
            },
            confidence: {
              type: Type.STRING,
              description: 'Confidence level: High, Medium, or Low.',
            },
            light: {
              type: Type.STRING,
              description: "Must be one of 'Low light', 'Medium indirect', 'Bright indirect', 'Direct sunlight'.",
            },
            wateringDays: {
              type: Type.INTEGER,
              description: 'Suggested watering frequency in days.',
            },
            fertilizingDays: {
              type: Type.INTEGER,
              description: 'Suggested fertilizing frequency in days.',
            },
            pruningDays: {
              type: Type.INTEGER,
              description: 'Suggested pruning/grooming interval in days.',
            },
            illustrationType: {
              type: Type.STRING,
              description: "Archetype: 'monstera', 'fig', 'snake', 'peacelily', 'pothos', 'calathea', 'succulent', or 'generic'.",
            },
            careNotes: {
              type: Type.STRING,
              description: 'Concise summary of care tips, ideal humidity, temperature, and pet safety.',
            },
          },
          required: [
            'isPlant',
            'commonName',
            'botanicalName',
            'light',
            'wateringDays',
            'fertilizingDays',
            'pruningDays',
            'illustrationType',
            'careNotes',
          ],
        },
      },
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);

    return res.json({
      success: true,
      data: parsed,
      attemptCount,
    });
  } catch (error: any) {
    console.error('Server error identifying plant:', error);
    const friendly = getFriendlyErrorMessage(error);
    return res.status(friendly.statusCode).json({
      success: false,
      error: friendly.message,
      isTemporary: friendly.isTemporary,
      statusCode: friendly.statusCode,
    });
  }
});

// Endpoint: SproutCare AI Plant Care Assistant
app.post('/api/plant-assistant', async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server. Please check the AI Studio Secrets panel.',
      });
    }

    // Support simulated test error header for deterministic verification of error handling
    if (req.headers['x-simulate-error'] === '503') {
      const friendly = getFriendlyErrorMessage(
        { status: 503, message: 'The model is overloaded (simulated test error)' },
        'assistant'
      );
      return res.status(503).json({
        success: false,
        error: friendly.message,
        isTemporary: true,
        statusCode: 503,
      });
    }

    const { messages, plantContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one message in the conversation history.',
      });
    }

    // Filter and sanitize messages
    const validMessages = messages.filter(
      (m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content cannot be empty.',
      });
    }

    // Map conversation history to Gemini contents format
    const formattedContents = validMessages.map((msg: any) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content.trim() }],
    }));

    // Ensure the conversation begins with a user turn
    while (formattedContents.length > 0 && formattedContents[0].role !== 'user') {
      formattedContents.shift();
    }

    if (formattedContents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'The conversation must contain at least one user question.',
      });
    }

    // Format optional plant context into system guidance
    let plantContextText = '';
    if (plantContext && typeof plantContext === 'object') {
      const details: string[] = [];
      if (plantContext.name) details.push(`- Plant Name: ${plantContext.name}`);
      if (plantContext.species) details.push(`- Botanical Species: ${plantContext.species}`);
      if (plantContext.room) details.push(`- Location: ${plantContext.room}`);
      if (plantContext.light) details.push(`- Light Requirement: ${plantContext.light}`);
      if (plantContext.wateringFrequencyDays) {
        details.push(`- Watering Interval: Every ${plantContext.wateringFrequencyDays} days (Last watered: ${plantContext.lastWatered || 'unrecorded'})`);
      }
      if (plantContext.fertilizingFrequencyDays) {
        details.push(`- Fertilizing Interval: Every ${plantContext.fertilizingFrequencyDays} days (Last fertilized: ${plantContext.lastFertilized || 'unrecorded'})`);
      }
      if (plantContext.pruningFrequencyDays) {
        details.push(`- Pruning Interval: Every ${plantContext.pruningFrequencyDays} days (Last pruned: ${plantContext.lastPruned || 'unrecorded'})`);
      }
      if (plantContext.healthScore !== undefined && plantContext.healthScore !== null) {
        details.push(`- Health Score: ${plantContext.healthScore}/100 (${plantContext.healthLabel || plantContext.health || 'normal'})`);
      }
      if (plantContext.notes) details.push(`- Care Notes: ${plantContext.notes}`);

      if (details.length > 0) {
        plantContextText = `\n\nCURRENT PLANT CONTEXT:\nThe user is asking about this specific plant in their collection:\n${details.join('\n')}\nUse these details to tailor your advice. Never invent details that contradict this data.`;
      }
    }

    const systemInstruction = `You are SproutCare's AI Plant Care Assistant, an expert botanist and horticulturist specializing in indoor houseplants and container gardening.

Core Guidelines:
1. Warm, practical, and accessible: Provide friendly, concise, and scientifically grounded guidance in clear everyday terms.
2. Context-aware: When plant details are provided, tailor your recommendations specifically to that species, light level, room placement, and watering schedule.
3. Factual & Honest: Never invent plant measurements, unrecorded dates, or imaginary plant records. If an issue requires more diagnostic details (e.g. soil drainage, humidity, distance from window), ask 1 or 2 targeted clarifying questions.
4. Actionable tips: When advising on watering, soil, pests, repotting, or light, provide step-by-step actionable advice.
5. Safety: Always mention pet toxicity when relevant to the plant species (e.g. toxic to cats and dogs if ingested).${plantContextText}`;

    const { response, attemptCount } = await generateContentWithRetry({
      model: 'gemini-3.1-flash-lite',
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || '';

    return res.json({
      success: true,
      reply,
      attemptCount,
    });
  } catch (error: any) {
    console.error('Server error in plant assistant:', error);
    const friendly = getFriendlyErrorMessage(error, 'assistant');
    return res.status(friendly.statusCode).json({
      success: false,
      error: friendly.message,
      isTemporary: friendly.isTemporary,
      statusCode: friendly.statusCode,
    });
  }
});

// Endpoint: Diagnose Plant Disease via Gemini AI Vision
app.post('/api/diagnose-plant', async (req, res) => {
  try {
    const { image, plantContext } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid plant photograph to diagnose.',
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server. Please check the AI Studio Secrets panel.',
      });
    }

    // Support simulated test error header for deterministic verification of error handling
    if (req.headers['x-simulate-error'] === '503') {
      const friendly = getFriendlyErrorMessage(
        { status: 503, message: 'The model is overloaded (simulated test error)' },
        'diagnosis'
      );
      return res.status(503).json({
        success: false,
        error: friendly.message,
        isTemporary: true,
        statusCode: 503,
      });
    }

    // Parse image mime type and base64 payload
    const { mimeType, base64Data } = extractImageBase64(image);

    // Format optional plant context into prompt guidance
    let plantContextText = '';
    if (plantContext && typeof plantContext === 'object') {
      const details: string[] = [];
      if (plantContext.name) details.push(`- Plant Name: ${plantContext.name}`);
      if (plantContext.species) details.push(`- Botanical Species: ${plantContext.species}`);
      if (plantContext.room) details.push(`- Location: ${plantContext.room}`);
      if (plantContext.light) details.push(`- Light Requirement: ${plantContext.light}`);
      if (plantContext.wateringFrequencyDays) {
        details.push(`- Watering Interval: Every ${plantContext.wateringFrequencyDays} days (Last watered: ${plantContext.lastWatered || 'unrecorded'})`);
      }
      if (plantContext.notes) details.push(`- Care Notes: ${plantContext.notes}`);

      if (details.length > 0) {
        plantContextText = `\n\nKNOWN PLANT PROFILE:\nThe user is diagnosing this specific plant in their collection:\n${details.join('\n')}\nUse these botanical characteristics to refine your diagnosis.`;
      }
    }

    const promptText = `You are an expert plant pathologist, botanist, and houseplant care specialist.
Analyze this photograph of a plant, leaf, foliage, or stem to diagnose its health condition, diseases, pests, watering imbalances, or environmental stress.

Diagnostic Guidelines:
1. Examine closely: Look for leaf chlorosis (yellowing), necrosis (brown spots), powdery coating, webbing, scale insects, aphids, fungal spores, tip burn, edema, or signs of healthy lush growth.
2. If the plant is healthy: Set hasIssue to false, conditionName to "Healthy & Thriving", category to "healthy", severity to "none", confidence to "high" (or appropriate level), list signs of health in visibleSymptoms, and provide maintenance tips in preventionTips.
3. If issues are found: Accurately categorize as fungal, pest, watering, nutrient, or environmental.
4. Safety & Practicality: Prioritize safe, accessible, non-hazardous remedies (e.g. wiping foliage with dilute horticultural soap or cold-pressed neem oil, isolating from nearby plants, pruning damaged leaves with sterilized shears, adjusting drainage). Never recommend dangerous industrial chemical poisons.
5. Honesty & Uncertainty: A photographic inspection cannot be 100% definitive. If the image is blurry, distant, or symptoms overlap, explicitly express uncertainty in uncertaintyWarning and set confidence to "medium", "low", or "uncertain".
6. Non-plant images: If the image is not a plant or botanical specimen, set isPlant to false, hasIssue to false, conditionName to "Not a Plant", category to "unknown", severity to "none", confidence to "uncertain", and add an explanation in uncertaintyWarning.${plantContextText}`;

    const { response, attemptCount } = await generateContentWithRetry({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPlant: {
              type: Type.BOOLEAN,
              description: 'Whether the image contains a plant, leaf, stem, or flora.',
            },
            hasIssue: {
              type: Type.BOOLEAN,
              description: 'False if the plant appears healthy and disease-free. True if signs of pests, disease, nutritional stress, or watering issues are visible.',
            },
            conditionName: {
              type: Type.STRING,
              description: 'Name of the identified condition, pest, disease, or "Healthy & Thriving" if healthy.',
            },
            category: {
              type: Type.STRING,
              description: 'Exactly one of: "healthy", "fungal", "pest", "watering", "nutrient", "environmental", "unknown".',
            },
            severity: {
              type: Type.STRING,
              description: 'Exactly one of: "none", "low", "moderate", "high", "critical". (Use "none" if healthy).',
            },
            confidence: {
              type: Type.STRING,
              description: 'Exactly one of: "high", "medium", "low", "uncertain".',
            },
            visibleSymptoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of observed physical visual symptoms on foliage, stems, or soil.',
            },
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of biological or environmental factors likely contributing to this condition.',
            },
            treatmentSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Safe, practical step-by-step remedies and corrective actions (e.g. neem oil, isolation, watering adjustment, sanitizing shears).',
            },
            preventionTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Practical preventative horticultural guidelines to stop recurrence.',
            },
            uncertaintyWarning: {
              type: Type.STRING,
              description: 'A cautionary disclaimer or warning if the image is blurry, lighting is poor, or symptoms could indicate multiple distinct pathologies. Empty string if clear.',
            },
          },
          required: [
            'isPlant',
            'hasIssue',
            'conditionName',
            'category',
            'severity',
            'confidence',
            'visibleSymptoms',
            'possibleCauses',
            'treatmentSteps',
            'preventionTips',
            'uncertaintyWarning',
          ],
        },
      },
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);

    return res.json({
      success: true,
      data: parsed,
      attemptCount,
    });
  } catch (error: any) {
    console.error('Server error in plant diagnosis:', error);
    const friendly = getFriendlyErrorMessage(error, 'diagnosis');
    return res.status(friendly.statusCode).json({
      success: false,
      error: friendly.message,
      isTemporary: friendly.isTemporary,
      statusCode: friendly.statusCode,
    });
  }
});

// Serve static files from public directory
app.use(express.static(path.resolve(__dirname, 'public')));

// Setup Vite dev server or static production files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SproutCare server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
