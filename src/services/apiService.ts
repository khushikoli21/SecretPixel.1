/**
 * SecretPixel Python Backend API Communication Service
 * 
 * Provides communication with the Python 3.11 / Flask + Pillow steganography engine.
 * Supports hiding and extracting messages via Python, with seamless fallback to
 * client-side WebCrypto / Canvas steganography when deployed statically (e.g. GitHub Pages).
 */

import { StegoMetrics } from './steganographyService';

export interface BackendHealthResponse {
  status: 'ok' | 'degraded';
  version?: string;
  service: string;
  runtime?: string;
  pillow?: string;
  timestamp: string;
  uptime: number;
  proxyStatus?: string;
}

export interface BackendInfoResponse {
  protocol: string;
  version: number;
  backend?: string;
  ciphers: string[];
  kdf: string;
  kdfIterations: number;
  headerLengthBytes: number;
  steganography?: string;
  offlineSupport: boolean;
  deploymentMode: string;
}

export interface ServerStatusState {
  isChecking: boolean;
  isOnline: boolean;
  health: BackendHealthResponse | null;
  info: BackendInfoResponse | null;
  mode: 'connected' | 'client-only';
  lastChecked: string | null;
}

export interface PythonHideResponse {
  success: boolean;
  stegoImageBase64: string;
  filename: string;
  sizeBytes: number;
  metrics: StegoMetrics;
}

export interface PythonExtractResponse {
  success: boolean;
  message: string;
  payloadSizeBytes: number;
  details?: {
    version: number;
    cipherLength: number;
    saltHex: string;
    ivHex: string;
    tagHex: string;
    width: number;
    height: number;
  };
}

function getApiBaseUrl(): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && 'VITE_API_BASE_URL' in import.meta.env) {
      return (import.meta.env.VITE_API_BASE_URL as string) || '';
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && 'VITE_API_BASE_URL' in process.env) {
      return (process.env.VITE_API_BASE_URL as string) || '';
    }
  } catch {}
  return '';
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Checks server health via GET /api/health with a 2.5s timeout.
 */
export async function checkBackendHealth(): Promise<{ isOnline: boolean; data?: BackendHealthResponse }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data: BackendHealthResponse = await res.json();
      return { isOnline: true, data };
    }
    return { isOnline: false };
  } catch {
    return { isOnline: false };
  }
}

/**
 * Retrieves protocol and cryptographic capabilities via GET /api/info.
 */
export async function getBackendInfo(): Promise<BackendInfoResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE_URL}/api/info`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return (await res.json()) as BackendInfoResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Executes AES-256-GCM encryption & LSB steganography via the Python backend.
 */
export async function hideMessageViaPython(
  imageBase64: string,
  message: string,
  password: string
): Promise<PythonHideResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for large images

  try {
    const res = await fetch(`${API_BASE_URL}/api/hide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        imageBase64,
        message,
        password
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Python backend error (status ${res.status})`);
    }

    return data as PythonHideResponse;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Extracts and decrypts payload from a stego-image via the Python backend.
 */
export async function extractMessageViaPython(
  imageBase64: string,
  password: string
): Promise<PythonExtractResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        imageBase64,
        password
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Python backend error (status ${res.status})`);
    }

    return data as PythonExtractResponse;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
