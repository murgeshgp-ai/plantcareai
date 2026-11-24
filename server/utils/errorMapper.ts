export type AiServiceType = 'identification' | 'assistant' | 'diagnosis';

export interface FriendlyErrorResult {
  message: string;
  statusCode: number;
  isTemporary: boolean;
}

/**
 * Checks if an error returned by Gemini or the network is transient/temporary.
 */
export function isTransientError(err: any): boolean {
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
 * Maps raw API or system errors into friendly, polished human-readable messages.
 */
export function getFriendlyErrorMessage(
  err: any,
  service: AiServiceType = 'identification'
): FriendlyErrorResult {
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
