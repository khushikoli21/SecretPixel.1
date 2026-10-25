/**
 * SecretPixel Session Activity Service
 * 
 * Manages privacy-preserving in-memory session activity logs.
 * Strictly adheres to Zero-Knowledge and Zero-Telemetry principles:
 * - Passwords, secret plaintext, and keys are NEVER logged or retained.
 * - Ciphertext buffers and image bitstreams are NEVER logged.
 * - All activity is stored exclusively in ephemeral tab memory.
 */

export interface ActivityEvent {
  id: string;
  type: 'image_load' | 'encrypt' | 'embed' | 'download' | 'extract' | 'decrypt' | 'error' | 'verify';
  title: string;
  detail: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

/**
 * Creates a sanitized activity event object with clean timestamp.
 */
export function createActivityEvent(
  event: Omit<ActivityEvent, 'id' | 'timestamp'>
): ActivityEvent {
  const now = new Date();
  const timestamp = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return {
    ...event,
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp
  };
}
