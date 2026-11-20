const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const KEY_HEX_LEN = 64; // 32 bytes → 64 hex chars

function getKey() {
  const raw = process.env.GITHUB_TOKEN_ENC_KEY || '';
  if (raw.length !== KEY_HEX_LEN || !/^[0-9a-f]+$/i.test(raw)) {
    throw new Error('GITHUB_TOKEN_ENC_KEY must be 64 hex chars (32 bytes). Run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return Buffer.from(raw, 'hex');
}

/**
 * Encrypt a plaintext string. Returns base64-encoded { ciphertext, iv, authTag }.
 */
function encrypt(plaintext) {
  if (typeof plaintext !== 'string' || !plaintext) {
    throw new Error('encrypt() requires a non-empty string');
  }
  const key = getKey();
  const iv = crypto.randomBytes(12); // GCM standard nonce size
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt the { ciphertext, iv, authTag } shape produced by encrypt().
 */
function decrypt({ ciphertext, iv, authTag }) {
  if (!ciphertext || !iv || !authTag) {
    throw new Error('decrypt() requires ciphertext, iv, authTag');
  }
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

/**
 * Cryptographically random hex state — 32 bytes = 64 hex chars.
 * The only thing used as OAuth state; NEVER the userId.
 */
function generateOAuthState() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { encrypt, decrypt, generateOAuthState };