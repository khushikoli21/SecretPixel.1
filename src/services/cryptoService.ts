/**
 * SecretPixel Cryptographic Service
 * 
 * Provides production-grade authenticated encryption using the browser's native
 * Web Crypto API (crypto.subtle).
 * 
 * Cryptographic Invariants:
 * - Cipher: AES-256-GCM (Galois/Counter Mode)
 * - Key Derivation: PBKDF2 with HMAC-SHA-256
 * - KDF Iterations: 100,000 rounds
 * - Salt: 128-bit (16 bytes) cryptographically secure random value
 * - IV (Nonce): 96-bit (12 bytes) cryptographically secure random value
 * - Authentication Tag: 128-bit (16 bytes) integrated Galois tag
 * - Memory Model: Zero server transmission; keys and plaintext are ephemeral
 */

export const PBKDF2_ITERATIONS = 100000;
export const SALT_LENGTH = 16;     // 128-bit random salt
export const IV_LENGTH = 12;       // 96-bit random IV standard for AES-GCM
export const AES_KEY_LENGTH = 256; // 256-bit AES key
export const TAG_LENGTH = 128;     // 128-bit authentication tag

export interface EncryptionResult {
  ciphertextWithTag: Uint8Array;
  salt: Uint8Array;
  iv: Uint8Array;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  tips: string[];
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a user password and random salt using PBKDF2.
 * Never stores or exports the derived key.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  if (!password || password.length === 0) {
    throw new Error('Passphrase cannot be empty.');
  }
  if (!salt || salt.length !== SALT_LENGTH) {
    throw new Error(`Invalid salt length: expected ${SALT_LENGTH} bytes, got ${salt?.length ?? 0} bytes.`);
  }

  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts UTF-8 plaintext using AES-256-GCM with a PBKDF2-derived key.
 * Fresh cryptographically secure salt and IV are generated on every invocation.
 */
export async function encryptMessage(
  plainText: string,
  password: string
): Promise<EncryptionResult> {
  if (!plainText || plainText.length === 0) {
    throw new Error('Secret message cannot be empty.');
  }
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty.');
  }

  // 1. Generate cryptographically secure random 16-byte salt and 12-byte IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // 2. Derive 256-bit AES-GCM key
  const key = await deriveKey(password, salt);

  // 3. Encode plaintext to UTF-8 bytes
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plainText);

  // 4. Perform AES-GCM authenticated encryption
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: TAG_LENGTH
    },
    key,
    encodedText
  );

  return {
    ciphertextWithTag: new Uint8Array(ciphertextBuffer),
    salt,
    iv
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using password, salt, and IV.
 * Strictly verifies the 128-bit authentication tag before returning any plaintext.
 * Fails safely without leaking partial decrypted buffers if authentication fails.
 */
export async function decryptMessage(
  ciphertextWithTag: Uint8Array,
  password: string,
  salt: Uint8Array,
  iv: Uint8Array
): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Decryption password is required.');
  }
  if (!ciphertextWithTag || ciphertextWithTag.length === 0) {
    throw new Error('Ciphertext payload is empty or missing.');
  }
  if (!salt || salt.length !== SALT_LENGTH) {
    throw new Error(`Invalid salt length: expected ${SALT_LENGTH} bytes.`);
  }
  if (!iv || iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes.`);
  }

  // Derive the exact same key from password and extracted salt
  const key = await deriveKey(password, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
        tagLength: TAG_LENGTH
      },
      key,
      ciphertextWithTag as unknown as BufferSource
    );

    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(decryptedBuffer);
  } catch {
    // Web Crypto throws OperationError if authentication tag verification fails
    throw new Error('Decryption failed: Incorrect password or modified/corrupted payload.');
  }
}

/**
 * Evaluates password strength without storing, logging, or sending anything.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Weak', tips: ['Enter a password with at least 8 characters.'] };
  }

  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) score++;
  else tips.push('Use at least 8 characters');

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else tips.push('Include both uppercase and lowercase letters');

  if (/[0-9]/.test(password)) score++;
  else tips.push('Include at least one number');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else tips.push('Include a special symbol (e.g. !@#$)');

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (score >= 4) label = 'Strong';
  else if (score === 3) label = 'Good';
  else if (score === 2) label = 'Fair';
  else label = 'Weak';

  return { score, label, tips };
}
