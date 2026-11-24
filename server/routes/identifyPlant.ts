import { Router } from 'express';
import { Type } from '@google/genai';
import { generateContentWithRetry, isGeminiApiConfigured } from '../services/geminiClient.ts';
import { getFriendlyErrorMessage } from '../utils/errorMapper.ts';
import { extractImageBase64 } from '../utils/imageParser.ts';

export const identifyPlantRouter = Router();

// Endpoint: Identify Plant via Gemini AI Vision (POST /api/identify-plant)
identifyPlantRouter.post('/identify-plant', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid plant photograph to identify.',
      });
    }

    if (!isGeminiApiConfigured()) {
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
