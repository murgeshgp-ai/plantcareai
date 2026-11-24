import { LightRequirement, Plant } from '../types/plant';
import { PlantDiagnosisResult } from '../types/diagnosis';

export interface PlantIdentificationResult {
  isPlant: boolean;
  commonName: string;
  botanicalName: string;
  confidence: string;
  light: LightRequirement;
  wateringDays: number;
  fertilizingDays: number;
  pruningDays: number;
  illustrationType: Plant['illustrationType'];
  careNotes: string;
}

export interface AssistantApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantPlantContextPayload {
  name: string;
  species: string;
  room: string;
  light: LightRequirement;
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  pruningFrequencyDays: number;
  lastWatered: string;
  lastFertilized: string;
  lastPruned: string;
  healthScore: number;
  healthLabel: string;
  notes?: string;
}

export interface DiagnosisPlantContextPayload {
  name: string;
  species: string;
  room: string;
  light: LightRequirement;
  wateringFrequencyDays: number;
  lastWatered: string;
  notes?: string;
}

export class AiApiError extends Error {
  public readonly statusCode: number;
  public readonly isTemporary: boolean;

  constructor(message: string, statusCode = 500, isTemporary = false) {
    super(message);
    this.name = 'AiApiError';
    this.statusCode = statusCode;
    this.isTemporary = isTemporary;
  }
}

function isTemporaryHttpStatus(status: number): boolean {
  return status === 503 || status === 429 || status === 500 || status === 502 || status === 504;
}

/**
 * Identifies a plant species and suggested care routine from a photograph.
 */
export async function identifyPlant(image: string): Promise<PlantIdentificationResult> {
  const response = await fetch('/api/identify-plant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    const isTemporary = isTemporaryHttpStatus(response.status) || data?.isTemporary === true;
    const friendlyMsg =
      data?.error ||
      (response.status === 503
        ? 'The plant identification service is currently experiencing high demand.'
        : response.status === 429
        ? 'Plant identification requests are temporarily paused due to high traffic.'
        : 'Plant identification service is temporarily unavailable.');

    throw new AiApiError(friendlyMsg, response.status, isTemporary);
  }

  return data.data as PlantIdentificationResult;
}

/**
 * Sends a conversation history (and optional plant context) to the AI Plant Care Assistant.
 */
export async function sendPlantAssistantMessage(
  messages: AssistantApiMessage[],
  plantContext?: AssistantPlantContextPayload
): Promise<string> {
  const response = await fetch('/api/plant-assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      plantContext,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    const isTemporary = isTemporaryHttpStatus(response.status) || data?.isTemporary === true;
    throw new AiApiError(
      data?.error || 'Failed to get a response from the plant care assistant.',
      response.status,
      isTemporary
    );
  }

  return data.reply || 'I am ready to help with your plant care questions.';
}

/**
 * Diagnoses potential plant diseases, pests, or care issues from a photograph.
 */
export async function diagnosePlant(
  image: string,
  plantContext?: DiagnosisPlantContextPayload
): Promise<PlantDiagnosisResult> {
  const response = await fetch('/api/diagnose-plant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image,
      plantContext,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    const isTemporary = isTemporaryHttpStatus(response.status) || data?.isTemporary === true;
    throw new AiApiError(
      data?.error || 'Failed to analyze plant photograph. Please try again.',
      response.status,
      isTemporary
    );
  }

  return data.data as PlantDiagnosisResult;
}
