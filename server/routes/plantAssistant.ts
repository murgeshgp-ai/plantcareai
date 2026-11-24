import { Router } from 'express';
import { generateContentWithRetry, isGeminiApiConfigured } from '../services/geminiClient.ts';
import { getFriendlyErrorMessage } from '../utils/errorMapper.ts';

export const plantAssistantRouter = Router();

// Endpoint: SproutCare AI Plant Care Assistant (POST /api/plant-assistant)
plantAssistantRouter.post('/plant-assistant', async (req, res) => {
  try {
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
        details.push(
          `- Watering Interval: Every ${plantContext.wateringFrequencyDays} days (Last watered: ${plantContext.lastWatered || 'unrecorded'})`
        );
      }
      if (plantContext.fertilizingFrequencyDays) {
        details.push(
          `- Fertilizing Interval: Every ${plantContext.fertilizingFrequencyDays} days (Last fertilized: ${plantContext.lastFertilized || 'unrecorded'})`
        );
      }
      if (plantContext.pruningFrequencyDays) {
        details.push(
          `- Pruning Interval: Every ${plantContext.pruningFrequencyDays} days (Last pruned: ${plantContext.lastPruned || 'unrecorded'})`
        );
      }
      if (plantContext.healthScore !== undefined && plantContext.healthScore !== null) {
        details.push(
          `- Health Score: ${plantContext.healthScore}/100 (${plantContext.healthLabel || plantContext.health || 'normal'})`
        );
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
