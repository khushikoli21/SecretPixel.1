/**
 * SecretPixel Comprehensive Automated Test Suite
 * 
 * Verifies Cryptography, Steganography, Protocol Serialization, Capacity Engine,
 * and Privacy Safeguards under Node.js runtime.
 */

import { encryptMessage, decryptMessage, deriveKey } from '../services/cryptoService';
import {
  serializePayload,
  parsePayload,
  hasMagicSignature,
  HEADER_LENGTH,
  PROTOCOL_VERSION
} from '../services/payloadService';
import {
  calculateCapacity,
  evaluateCapacity,
  getUtf8ByteLength
} from '../services/capacityService';
import {
  embedPayloadIntoImageData,
  extractPayloadFromImageData,
  calculateImageMetrics
} from '../services/steganographyService';
import { createActivityEvent } from '../services/activityService';

interface MockImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

function makeMockImageData(w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (i * 17) % 256;     // R
    data[i + 1] = (i * 31) % 256; // G
    data[i + 2] = (i * 47) % 256; // B
    data[i + 3] = 255;            // A (alpha)
  }
  return { width: w, height: h, data } as unknown as ImageData;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n========================================');
  console.log(' SecretPixel Cryptography & Steganography Test Suite');
  console.log('========================================\n');

  // --- GROUP 1: Cryptography ---
  console.log('--- 1. Cryptographic Engine (AES-256-GCM + PBKDF2) ---');

  const secretMessage = 'SecretPixel Automated Test Payload: 🔐 Encrypted UTF-8 Text with Emojis & Symbols #12345';
  const testPassword = 'StrongTestPassword!2026';

  const encResult = await encryptMessage(secretMessage, testPassword);
  assert(encResult.ciphertextWithTag.length > 0, 'Produces non-empty ciphertext');
  assert(encResult.salt.length === 16, 'Generates 128-bit (16-byte) random salt');
  assert(encResult.iv.length === 12, 'Generates 96-bit (12-byte) random IV');

  // Fresh salts and IVs
  const encResult2 = await encryptMessage(secretMessage, testPassword);
  const saltIdentical = encResult.salt.every((b, idx) => b === encResult2.salt[idx]);
  const ivIdentical = encResult.iv.every((b, idx) => b === encResult2.iv[idx]);
  assert(!saltIdentical, 'Generates unique fresh salt on subsequent encryptions');
  assert(!ivIdentical, 'Generates unique fresh IV on subsequent encryptions');

  // Correct decryption
  const decrypted = await decryptMessage(
    encResult.ciphertextWithTag,
    testPassword,
    encResult.salt,
    encResult.iv
  );
  assert(decrypted === secretMessage, 'Decryption reproduces exact plaintext matching UTF-8 & emojis');

  // Wrong password rejection
  let wrongPassFailed = false;
  try {
    await decryptMessage(encResult.ciphertextWithTag, 'WrongPassword999!', encResult.salt, encResult.iv);
  } catch {
    wrongPassFailed = true;
  }
  assert(wrongPassFailed, 'Rejects incorrect password via AES-GCM authentication tag mismatch');

  // Tampered ciphertext rejection
  const tamperedCiphertext = new Uint8Array(encResult.ciphertextWithTag);
  tamperedCiphertext[0] ^= 1; // Flip 1 bit
  let tamperCaught = false;
  try {
    await decryptMessage(tamperedCiphertext, testPassword, encResult.salt, encResult.iv);
  } catch {
    tamperCaught = true;
  }
  assert(tamperCaught, 'Detects 1-bit ciphertext modification and refuses decryption');

  // Empty input handling
  let emptyMsgRejected = false;
  try {
    await encryptMessage('', testPassword);
  } catch {
    emptyMsgRejected = true;
  }
  assert(emptyMsgRejected, 'Rejects 0-character empty message with explicit error');

  // --- GROUP 2: Binary Protocol Framing ---
  console.log('\n--- 2. Binary Protocol Framing (SPXL v1) ---');

  const serialized = serializePayload(encResult.ciphertextWithTag, encResult.salt, encResult.iv);
  assert(serialized.length === HEADER_LENGTH + encResult.ciphertextWithTag.length, 'Serialized buffer matches exact header + cipher length');
  assert(hasMagicSignature(serialized), 'Header contains SPXL magic signature (0x5350584C)');
  assert(serialized[4] === PROTOCOL_VERSION, 'Header contains Protocol Version 1');

  const parsed = parsePayload(serialized);
  assert(parsed.version === 1, 'Parses version 1');
  assert(parsed.cipherLength === encResult.ciphertextWithTag.length, 'Parses correct Big-Endian ciphertext length');
  assert(parsed.salt.length === 16, 'Extracts 16-byte salt from header');
  assert(parsed.iv.length === 12, 'Extracts 12-byte IV from header');

  // Non-stego rejection
  const nonStegoHeader = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x01]);
  assert(!hasMagicSignature(nonStegoHeader), 'Correctly identifies missing SPXL magic signature');

  // --- GROUP 3: Capacity Calculation Engine ---
  console.log('\n--- 3. Capacity Engine & UTF-8 Sizing ---');

  const cap640 = calculateCapacity(640, 480);
  assert(cap640.totalPixels === 307200, 'Calculates correct pixel count for 640x480');
  assert(cap640.rawBitsCapacity === 307200 * 3, 'Calculates 3 bits per pixel (RGB LSB)');
  assert(cap640.rawBytesCapacity === Math.floor((307200 * 3) / 8), 'Calculates raw bytes capacity (115,200 bytes)');
  assert(cap640.usablePayloadBytes === 115200 - 37, 'Subtracts 37-byte SPXL header for usable payload');
  assert(cap640.maxPlaintextBytes === 115200 - 37 - 16, 'Accounts for 16-byte AES-GCM tag in max plaintext limit');

  // Multi-byte UTF-8 calculation
  const utf8Text = '🚀 Special cryptographic characters: ä, ö, ü, 中文';
  const utf8Bytes = getUtf8ByteLength(utf8Text);
  assert(utf8Bytes > utf8Text.length, `Correctly evaluates multi-byte UTF-8 text length (${utf8Bytes} B > ${utf8Text.length} chars)`);

  const evalResult = evaluateCapacity(utf8Text, cap640);
  assert(evalResult.fits, 'Capacity evaluation correctly approves payload within limits');

  // --- GROUP 4: LSB Steganography Engine ---
  console.log('\n--- 4. LSB Steganography Embedding & Extraction ---');

  const coverImg = makeMockImageData(160, 160);
  const originalCopy = makeMockImageData(160, 160);

  const embedResult = embedPayloadIntoImageData(coverImg, serialized);
  assert(embedResult.modifiedPixels > 0, 'Modifies pixels in raster during embedding');

  // Verify Alpha channel untouched
  let alphaIntact = true;
  for (let i = 3; i < coverImg.data.length; i += 4) {
    if (coverImg.data[i] !== 255) {
      alphaIntact = false;
      break;
    }
  }
  assert(alphaIntact, 'Alpha channel (transparency) is 100% preserved and unmodified');

  // Extract payload
  const extracted = extractPayloadFromImageData(coverImg);
  assert(extracted.version === 1, 'Extracted payload version matches SPXL v1');
  assert(extracted.salt.every((b, i) => b === encResult.salt[i]), 'Extracted salt matches embedded salt bit-for-bit');
  assert(extracted.iv.every((b, i) => b === encResult.iv[i]), 'Extracted IV matches embedded IV bit-for-bit');
  assert(
    extracted.ciphertextWithTag.every((b, i) => b === encResult.ciphertextWithTag[i]),
    'Extracted ciphertext matches embedded ciphertext bit-for-bit'
  );

  // Full roundtrip decryption
  const recoveredText = await decryptMessage(
    extracted.ciphertextWithTag,
    testPassword,
    extracted.salt,
    extracted.iv
  );
  assert(recoveredText === secretMessage, 'Full Steganography Roundtrip: recovered plaintext matches original secret');

  // MSE and PSNR calculation
  const metrics = calculateImageMetrics(originalCopy, coverImg, serialized.length);
  assert(metrics.mse < 0.5, `Calculates low Mean Squared Error (MSE: ${metrics.mse} < 0.5)`);
  assert(metrics.psnr > 50, `Calculates high Peak Signal-to-Noise Ratio (PSNR: ${metrics.psnr} dB > 50 dB)`);

  // --- GROUP 5: Privacy & Activity Logging ---
  console.log('\n--- 5. Privacy & Zero-Knowledge Architecture ---');

  const act = createActivityEvent({
    type: 'encrypt',
    title: 'Message Encrypted',
    detail: '256 bytes embedded',
    status: 'success'
  });
  assert(act.id.startsWith('act_'), 'Generates valid activity ID');
  assert(Boolean(act.timestamp), 'Assigns clean human-readable timestamp');
  assert(!JSON.stringify(act).includes(testPassword), 'Activity logs never contain passwords');
  assert(!JSON.stringify(act).includes(secretMessage), 'Activity logs never contain secret plaintext');

  console.log('\n========================================');
  console.log(` Core Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }

  // Run database and privacy tests
  await runDatabaseTests();
}

import { runDatabaseTests } from './databaseSuite';

runAllTests().catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
