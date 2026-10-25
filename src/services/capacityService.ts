/**
 * SecretPixel Capacity Engine
 * 
 * Accurately calculates steganographic payload capacity based on image dimensions,
 * channel allocation (1 LSB per RGB channel), and cryptographic protocol framing.
 * 
 * Capacity Math:
 * - Total Pixels: Width * Height
 * - Modulated Channels: 3 (Red, Green, Blue; Alpha is strictly untouched)
 * - Bits per Pixel: 3 bits
 * - Raw Bit Capacity: Total Pixels * 3
 * - Raw Byte Capacity: floor(Raw Bit Capacity / 8)
 * - Fixed SPXL Header Overhead: 37 bytes
 * - AES-GCM Tag Overhead: 16 bytes
 * - Usable Payload (Ciphertext + Tag): max(0, Raw Byte Capacity - 37)
 * - Maximum Plaintext Bytes: max(0, Usable Payload - 16)
 */

import { HEADER_LENGTH } from './payloadService';

export interface CapacityInfo {
  width: number;
  height: number;
  totalPixels: number;
  rawBitsCapacity: number;
  rawBytesCapacity: number;
  headerOverheadBytes: number;
  tagOverheadBytes: number;
  usablePayloadBytes: number;
  maxPlaintextBytes: number;
}

export interface CapacityEvaluation {
  messageBytes: number;
  estimatedPayloadBytes: number;
  usableCapacityBytes: number;
  remainingBytes: number;
  capacityUsedPercent: number;
  fits: boolean;
}

/**
 * Calculates theoretical and usable LSB capacity for given pixel dimensions.
 */
export function calculateCapacity(width: number, height: number): CapacityInfo {
  const safeW = Math.max(0, Math.floor(width || 0));
  const safeH = Math.max(0, Math.floor(height || 0));
  const totalPixels = safeW * safeH;

  const rawBitsCapacity = totalPixels * 3;
  const rawBytesCapacity = Math.floor(rawBitsCapacity / 8);
  const headerOverheadBytes = HEADER_LENGTH; // 37 bytes
  const tagOverheadBytes = 16;               // 128-bit tag

  const usablePayloadBytes = Math.max(0, rawBytesCapacity - headerOverheadBytes);
  const maxPlaintextBytes = Math.max(0, usablePayloadBytes - tagOverheadBytes);

  return {
    width: safeW,
    height: safeH,
    totalPixels,
    rawBitsCapacity,
    rawBytesCapacity,
    headerOverheadBytes,
    tagOverheadBytes,
    usablePayloadBytes,
    maxPlaintextBytes
  };
}

/**
 * Accurately measures UTF-8 encoded byte size of a secret text message.
 */
export function getUtf8ByteLength(text: string): number {
  if (!text) return 0;
  return new TextEncoder().encode(text).length;
}

/**
 * Evaluates whether a given plaintext message will fit within an image's capacity.
 */
export function evaluateCapacity(message: string, capacity: CapacityInfo): CapacityEvaluation {
  const messageBytes = getUtf8ByteLength(message);
  // Total payload to embed in image = 37 bytes header + (messageBytes + 16 bytes tag)
  const estimatedPayloadBytes = messageBytes > 0 ? messageBytes + 16 + HEADER_LENGTH : 0;
  const usableCapacityBytes = capacity.usablePayloadBytes;

  const remainingBytes = Math.max(0, usableCapacityBytes - (messageBytes > 0 ? messageBytes + 16 : 0));
  const fits = messageBytes === 0 || (estimatedPayloadBytes <= capacity.rawBytesCapacity && messageBytes <= capacity.maxPlaintextBytes);

  const capacityUsedPercent =
    usableCapacityBytes > 0
      ? Math.min(100, Number(((estimatedPayloadBytes / capacity.rawBytesCapacity) * 100).toFixed(2)))
      : 0;

  return {
    messageBytes,
    estimatedPayloadBytes,
    usableCapacityBytes,
    remainingBytes,
    capacityUsedPercent,
    fits
  };
}
