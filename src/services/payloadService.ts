/**
 * SecretPixel Binary Payload Specification (SPXL v1)
 * 
 * Defines deterministic, big-endian binary framing for embedded payloads.
 * 
 * Layout:
 * +------------------+-----------+----------------------------------------------+
 * | Offset (Bytes)   | Length    | Description                                  |
 * +------------------+-----------+----------------------------------------------+
 * | 0..3             | 4 bytes   | Magic signature ASCII "SPXL" (0x5350584C)    |
 * | 4                | 1 byte    | Protocol Version (0x01 = SPXL v1)            |
 * | 5..8             | 4 bytes   | Ciphertext Length N (Big-Endian uint32)      |
 * | 9..24            | 16 bytes  | Cryptographic Salt (PBKDF2 SHA-256)          |
 * | 25..36           | 12 bytes  | Initialization Vector (AES-GCM Nonce)        |
 * | 37..(37 + N - 1) | N bytes   | AES-256-GCM Ciphertext + 16-Byte Auth Tag    |
 * +------------------+-----------+----------------------------------------------+
 * Total Fixed Header Size: 37 bytes
 */

export const MAGIC_SIGNATURE = new Uint8Array([0x53, 0x50, 0x58, 0x4c]); // "SPXL"
export const PROTOCOL_VERSION = 1;
export const HEADER_LENGTH = 37; // 4 + 1 + 4 + 16 + 12

export interface SerializedPayload {
  rawBytes: Uint8Array;
  headerLength: number;
  totalLength: number;
}

export interface ParsedPayload {
  version: number;
  cipherLength: number;
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertextWithTag: Uint8Array;
}

/**
 * Serializes cryptographic artifacts into the versioned SPXL binary format.
 */
export function serializePayload(
  ciphertextWithTag: Uint8Array,
  salt: Uint8Array,
  iv: Uint8Array
): Uint8Array {
  if (!ciphertextWithTag || ciphertextWithTag.length === 0) {
    throw new Error('Cannot serialize empty ciphertext buffer.');
  }
  if (!salt || salt.length !== 16) {
    throw new Error(`Salt must be exactly 16 bytes (got ${salt?.length ?? 0}).`);
  }
  if (!iv || iv.length !== 12) {
    throw new Error(`IV must be exactly 12 bytes (got ${iv?.length ?? 0}).`);
  }

  const cipherLen = ciphertextWithTag.length;
  // Guard against theoretical 32-bit overflow
  if (cipherLen > 0x3fffffff) {
    throw new Error('Payload length exceeds maximum addressable size.');
  }

  const totalSize = HEADER_LENGTH + cipherLen;
  const payload = new Uint8Array(totalSize);

  // 1. Magic Signature [0..3]
  payload.set(MAGIC_SIGNATURE, 0);

  // 2. Protocol Version [4]
  payload[4] = PROTOCOL_VERSION;

  // 3. Ciphertext Length [5..8] Big-Endian uint32
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  view.setUint32(5, cipherLen, false);

  // 4. Cryptographic Salt [9..24]
  payload.set(salt, 9);

  // 5. Initialization Vector [25..36]
  payload.set(iv, 25);

  // 6. Ciphertext + Tag [37..]
  payload.set(ciphertextWithTag, HEADER_LENGTH);

  return payload;
}

/**
 * Validates whether a raw byte buffer starts with the SPXL magic signature.
 */
export function hasMagicSignature(headerBytes: Uint8Array): boolean {
  if (!headerBytes || headerBytes.length < 4) return false;
  return (
    headerBytes[0] === MAGIC_SIGNATURE[0] &&
    headerBytes[1] === MAGIC_SIGNATURE[1] &&
    headerBytes[2] === MAGIC_SIGNATURE[2] &&
    headerBytes[3] === MAGIC_SIGNATURE[3]
  );
}

/**
 * Parses and verifies a raw SPXL payload buffer with strict defensive bounds checks.
 */
export function parsePayload(buffer: Uint8Array, maxAllowedBytes?: number): ParsedPayload {
  if (!buffer || buffer.length < HEADER_LENGTH) {
    throw new Error(`Buffer too short for SPXL header (expected at least ${HEADER_LENGTH} bytes, got ${buffer?.length ?? 0}).`);
  }

  // 1. Magic Signature Check
  if (!hasMagicSignature(buffer)) {
    throw new Error('No SecretPixel signature found. Image does not contain an SPXL payload or was altered.');
  }

  // 2. Version Check
  const version = buffer[4];
  if (version !== PROTOCOL_VERSION) {
    throw new Error(`Unsupported SecretPixel payload version: ${version}. Expected version ${PROTOCOL_VERSION}.`);
  }

  // 3. Length Field
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const cipherLength = view.getUint32(5, false);

  if (cipherLength <= 0) {
    throw new Error('Invalid payload length: declared length is 0.');
  }

  const expectedTotal = HEADER_LENGTH + cipherLength;
  if (buffer.length < expectedTotal) {
    throw new Error(`Truncated payload: expected ${expectedTotal} bytes, but buffer only has ${buffer.length} bytes.`);
  }

  if (maxAllowedBytes !== undefined && expectedTotal > maxAllowedBytes) {
    throw new Error(`Declared payload size (${expectedTotal} B) exceeds maximum permitted capacity (${maxAllowedBytes} B).`);
  }

  // 4. Salt & IV
  const salt = buffer.slice(9, 25);
  const iv = buffer.slice(25, 37);

  // 5. Ciphertext + Tag
  const ciphertextWithTag = buffer.slice(37, 37 + cipherLength);

  return {
    version,
    cipherLength,
    salt,
    iv,
    ciphertextWithTag
  };
}
