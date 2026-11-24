import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { isTransientError } from '../utils/errorMapper.ts';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export function isGeminiApiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Server-side retry with exponential backoff for transient Gemini errors (max 3 attempts).
 */
export async function generateContentWithRetry(
  params: any,
  maxRetries = 3,
  baseDelayMs = 800
) {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent(params);
      return { response, attemptCount: attempt };
    } catch (err: any) {
      lastError = err;
      const transient = isTransientError(err);
      console.warn(
        `[Gemini API] Server attempt ${attempt}/${maxRetries} encountered error. Transient: ${transient}. Message: ${err?.message || err}`
      );

      // If 429 quota exhausted on gemini-3.8-flash, seamlessly fallback to gemini-3.1-flash-lite
      if (
        params.model === 'gemini-3.8-flash' &&
        (err?.status === 429 ||
          err?.statusCode === 429 ||
          String(err?.message || '').includes('429') ||
          String(err?.message || '').includes('quota') ||
          String(err?.message || '').includes('RESOURCE_EXHAUSTED'))
      ) {
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
