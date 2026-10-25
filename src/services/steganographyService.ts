/**
 * SecretPixel Steganography Service
 * 
 * Implements Least Significant Bit (LSB) embedding and extraction across RGB channels.
 * 
 * Rules:
 * 1. Only bit 0 (the least significant bit) of Red, Green, and Blue channels is modified.
 * 2. Alpha (transparency) channels are never modified.
 * 3. Bits are encoded MSB first (most significant bit of each byte embedded first).
 * 4. Image quality is measured mathematically using MSE and PSNR (typically PSNR > 60 dB).
 */

import {
  HEADER_LENGTH,
  MAGIC_SIGNATURE,
  PROTOCOL_VERSION,
  ParsedPayload
} from './payloadService';
import { calculateCapacity } from './capacityService';

export interface StegoMetrics {
  mse: number;
  psnr: number;
  modifiedPixels: number;
  capacityUsedPercent: number;
}

export interface EmbedResult {
  modifiedPixels: number;
  totalBitsEmbedded: number;
}

/**
 * Embeds binary payload into ImageData using RGB LSB substitution.
 */
export function embedPayloadIntoImageData(
  imageData: ImageData,
  payload: Uint8Array
): EmbedResult {
  const { data, width, height } = imageData;
  const capacity = calculateCapacity(width, height);

  if (payload.length > capacity.rawBytesCapacity) {
    throw new Error(
      `Payload size (${payload.length} bytes) exceeds available image capacity (${capacity.rawBytesCapacity} bytes). Select a larger image or reduce message length.`
    );
  }

  const totalBits = payload.length * 8;
  let bitIndex = 0;
  let modifiedPixelsCount = 0;
  const pixelsCount = width * height;

  for (let p = 0; p < pixelsCount && bitIndex < totalBits; p++) {
    const pixelOffset = p * 4;
    let pixelModified = false;

    // Iterate through color channels: R(0), G(1), B(2). Channel 3 (Alpha) is never touched.
    for (let c = 0; c < 3 && bitIndex < totalBits; c++) {
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = 7 - (bitIndex % 8); // MSB first
      const bit = (payload[byteIndex] >> bitOffset) & 1;

      const currentByte = data[pixelOffset + c];
      const newByte = (currentByte & 0xfe) | bit;

      if (newByte !== currentByte) {
        data[pixelOffset + c] = newByte;
        pixelModified = true;
      }

      bitIndex++;
    }

    if (pixelModified) {
      modifiedPixelsCount++;
    }
  }

  return {
    modifiedPixels: modifiedPixelsCount,
    totalBitsEmbedded: bitIndex
  };
}

/**
 * Extracts the SecretPixel binary payload from ImageData.
 * Validates magic signature, version, and length bounds before allocating buffers.
 */
export function extractPayloadFromImageData(imageData: ImageData): ParsedPayload {
  const { data, width, height } = imageData;
  const capacity = calculateCapacity(width, height);

  if (capacity.rawBytesCapacity < HEADER_LENGTH) {
    throw new Error('Image is too small to contain a valid SecretPixel payload header.');
  }

  // Bit cursor reader
  let bitCursor = 0;
  function readByte(): number {
    let byteVal = 0;
    for (let i = 0; i < 8; i++) {
      const pixelIndex = Math.floor(bitCursor / 3);
      const channel = bitCursor % 3;
      const dataIndex = pixelIndex * 4 + channel;

      const bit = data[dataIndex] & 1;
      byteVal = (byteVal << 1) | bit;
      bitCursor++;
    }
    return byteVal;
  }

  // 1. Read first 4 bytes (Magic signature "SPXL")
  const magic = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    magic[i] = readByte();
  }

  const hasValidMagic =
    magic[0] === MAGIC_SIGNATURE[0] &&
    magic[1] === MAGIC_SIGNATURE[1] &&
    magic[2] === MAGIC_SIGNATURE[2] &&
    magic[3] === MAGIC_SIGNATURE[3];

  if (!hasValidMagic) {
    throw new Error(
      'No SecretPixel signature found in this image. Either this is not a stego-image, or the hidden bits were altered (e.g. by lossy compression).'
    );
  }

  // 2. Read protocol version (1 byte)
  const version = readByte();
  if (version !== PROTOCOL_VERSION) {
    throw new Error(`Unsupported SecretPixel payload version: ${version}. Expected version ${PROTOCOL_VERSION}.`);
  }

  // 3. Read ciphertext length (4 bytes uint32 big-endian)
  const lenBytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    lenBytes[i] = readByte();
  }
  const view = new DataView(lenBytes.buffer);
  const cipherLen = view.getUint32(0, false);

  // Validate bounds defensively against buffer overruns
  if (cipherLen <= 0 || HEADER_LENGTH + cipherLen > capacity.rawBytesCapacity) {
    throw new Error(
      `Invalid or corrupted payload length declared (${cipherLen} bytes). Image capacity is ${capacity.rawBytesCapacity} bytes.`
    );
  }

  // 4. Read salt (16 bytes)
  const salt = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    salt[i] = readByte();
  }

  // 5. Read IV (12 bytes)
  const iv = new Uint8Array(12);
  for (let i = 0; i < 12; i++) {
    iv[i] = readByte();
  }

  // 6. Read ciphertext + tag
  const ciphertextWithTag = new Uint8Array(cipherLen);
  for (let i = 0; i < cipherLen; i++) {
    ciphertextWithTag[i] = readByte();
  }

  return {
    version,
    cipherLength: cipherLen,
    salt,
    iv,
    ciphertextWithTag
  };
}

/**
 * Calculates genuine MSE (Mean Squared Error) and PSNR (Peak Signal-to-Noise Ratio)
 * by comparing original cover image pixel data against modified stego pixel data.
 */
export function calculateImageMetrics(
  originalData: ImageData,
  stegoData: ImageData,
  payloadBytes: number
): StegoMetrics {
  const orig = originalData.data;
  const stego = stegoData.data;
  const len = orig.length;
  const totalPixels = originalData.width * originalData.height;

  let sumSquaredError = 0;
  let modifiedPixels = 0;

  for (let i = 0; i < len; i += 4) {
    let pixelDiffers = false;
    // Check R, G, B channels
    for (let c = 0; c < 3; c++) {
      const diff = orig[i + c] - stego[i + c];
      if (diff !== 0) {
        sumSquaredError += diff * diff;
        pixelDiffers = true;
      }
    }
    if (pixelDiffers) {
      modifiedPixels++;
    }
  }

  // Total color samples = 3 * totalPixels
  const totalSamples = totalPixels * 3;
  const mse = totalSamples > 0 ? sumSquaredError / totalSamples : 0;

  // PSNR = 10 * log10(255^2 / MSE)
  let psnr = 99.9;
  if (mse > 0) {
    psnr = 10 * Math.log10((255 * 255) / mse);
  }

  const rawBytes = Math.floor((totalPixels * 3) / 8);
  const capacityUsedPercent = rawBytes > 0 ? (payloadBytes / rawBytes) * 100 : 0;

  return {
    mse: Number(mse.toFixed(4)),
    psnr: Number(psnr.toFixed(2)),
    modifiedPixels,
    capacityUsedPercent: Number(capacityUsedPercent.toFixed(2))
  };
}
