import { Router } from 'express';
import { Type } from '@google/genai';
import { generateContentWithRetry, isGeminiApiConfigured } from '../services/geminiClient.ts';
import { getFriendlyErrorMessage } from '../utils/errorMapper.ts';
import { extractImageBase64 } from '../utils/imageParser.ts';

export const diagnosePlantRouter = Router();

// Endpoint: Diagnose Plant Disease via Gemini AI Vision (POST /api/diagnose-plant)
diagnosePlantRouter.post('/diagnose-plant', async (req, res) => {
  try {
    const { image, plantContext } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid plant photograph to diagnose.',
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
        details.push(
          `- Watering Interval: Every ${plantContext.wateringFrequencyDays} days (Last watered: ${plantContext.lastWatered || 'unrecorded'})`
        );
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
              description:
                'False if the plant appears healthy and disease-free. True if signs of pests, disease, nutritional stress, or watering issues are visible.',
            },
            conditionName: {
              type: Type.STRING,
              description: 'Name of the identified condition, pest, disease, or "Healthy & Thriving" if healthy.',
            },
            category: {
              type: Type.STRING,
              description:
                'Exactly one of: "healthy", "fungal", "pest", "watering", "nutrient", "environmental", "unknown".',
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
              description:
                'Safe, practical step-by-step remedies and corrective actions (e.g. neem oil, isolation, watering adjustment, sanitizing shears).',
            },
            preventionTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Practical preventative horticultural guidelines to stop recurrence.',
            },
            uncertaintyWarning: {
              type: Type.STRING,
              description:
                'A cautionary disclaimer or warning if the image is blurry, lighting is poor, or symptoms could indicate multiple distinct pathologies. Empty string if clear.',
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
