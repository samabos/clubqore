/**
 * Encryption Utilities for Payment Data
 *
 * Uses AES-256-GCM for authenticated encryption of sensitive payment data.
 * All sensitive data stored in the database should be encrypted using these utilities.
 */

import crypto from 'crypto';
import { getConfig } from '../../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const _AUTH_TAG_LENGTH = 16; // 128 bits - reserved for future use
const KEY_VERSION = 1; // For future key rotation support

/**
 * Get the encryption key from environment
 * Key must be a 32-byte (256-bit) hex string
 */
function getEncryptionKey() {
  const config = getConfig();
  const keyHex = config.payment?.encryptionKey || process.env.PAYMENT_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error('PAYMENT_ENCRYPTION_KEY environment variable is not set');
  }

  if (keyHex.length !== 64) {
    throw new Error('PAYMENT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt plaintext data
 *
 * @param {string} plaintext - The data to encrypt
 * @returns {string} Encrypted data in format: version:iv:authTag:ciphertext
 */
export function encrypt(plaintext) {
  if (!plaintext) {
    return null;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: version:iv:authTag:ciphertext
  return `${KEY_VERSION}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt encrypted data
 *
 * @param {string} ciphertext - The encrypted data in format: version:iv:authTag:ciphertext
 * @returns {string} Decrypted plaintext
 */
export function decrypt(ciphertext) {
  if (!ciphertext) {
    return null;
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid ciphertext format');
  }

  const [version, ivHex, authTagHex, encrypted] = parts;

  // Check version for future key rotation support
  if (parseInt(version) !== KEY_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt an object (serializes to JSON first)
 *
 * @param {Object} obj - The object to encrypt
 * @returns {string} Encrypted JSON string
 */
export function encryptObject(obj) {
  if (!obj) {
    return null;
  }
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt to an object (parses JSON after decryption)
 *
 * @param {string} ciphertext - The encrypted data
 * @returns {Object} Decrypted object
 */
export function decryptObject(ciphertext) {
  if (!ciphertext) {
    return null;
  }
  const decrypted = decrypt(ciphertext);
  return JSON.parse(decrypted);
}

/**
 * Hash sensitive data for lookup (one-way)
 * Use this for data that needs to be searchable but not reversible
 *
 * @param {string} data - The data to hash
 * @param {string} salt - Optional salt (defaults to a config value)
 * @returns {string} SHA-256 hash
 */
export function hashForLookup(data, salt = null) {
  if (!data) {
    return null;
  }

  const config = getConfig();
  const hashSalt = salt || config.payment?.hashSalt || process.env.PAYMENT_HASH_SALT || '';

  return crypto
    .createHash('sha256')
    .update(data + hashSalt)
    .digest('hex');
}

/**
 * Generate a secure random token
 *
 * @param {number} length - Length in bytes (default 32)
 * @returns {string} Hex-encoded random token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a secure state parameter for OAuth/redirect flows
 * Includes timestamp for expiration checking
 *
 * @param {Object} data - Data to include in state
 * @param {number} expiresInMinutes - Expiration time (default 15 minutes)
 * @returns {string} Encrypted state string
 */
export function generateState(data = {}, expiresInMinutes = 15) {
  const stateData = {
    ...data,
    nonce: generateSecureToken(16),
    expiresAt: Date.now() + (expiresInMinutes * 60 * 1000)
  };
  return encrypt(JSON.stringify(stateData));
}

/**
 * Verify and decode a state parameter
 *
 * @param {string} state - The encrypted state string
 * @returns {Object|null} Decoded state data or null if invalid/expired
 */
export function verifyState(state) {
  try {
    const decrypted = decrypt(state);
    const data = JSON.parse(decrypted);

    // Check expiration
    if (data.expiresAt && Date.now() > data.expiresAt) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export default {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashForLookup,
  generateSecureToken,
  generateState,
  verifyState
};
