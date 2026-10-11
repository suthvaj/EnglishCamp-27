// Secure PIN hashing using native Web Crypto API
// Never store plaintext PINs in the database

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, salt: string, storedHash: string): Promise<boolean> {
  const computedHash = await hashPin(pin, salt);
  return computedHash === storedHash;
}

// Generate default temporary PIN for a student (e.g. 4 digits)
export function generateTemporaryPin(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return rand.toString();
}

// Rate-limiting helpers for PIN attempts
const RATE_LIMIT_PREFIX = 'camp_auth_attempts_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 3 * 60 * 1000; // 3 minutes

export interface RateLimitStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
}

export function checkRateLimit(studentId: string): RateLimitStatus {
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_PREFIX}${studentId}`);
    if (!raw) {
      return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
    }
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.lockedUntil && data.lockedUntil > now) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((data.lockedUntil - now) / 1000),
        attemptsLeft: 0,
      };
    }
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - (data.count || 0)),
    };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }
}

export function recordFailedAttempt(studentId: string): RateLimitStatus {
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_PREFIX}${studentId}`);
    const data = raw ? JSON.parse(raw) : { count: 0, lockedUntil: 0 };
    data.count = (data.count || 0) + 1;
    if (data.count >= MAX_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_MS;
      data.count = 0;
    }
    localStorage.setItem(`${RATE_LIMIT_PREFIX}${studentId}`, JSON.stringify(data));
    return checkRateLimit(studentId);
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS - 1 };
  }
}

export function resetRateLimit(studentId: string): void {
  try {
    localStorage.removeItem(`${RATE_LIMIT_PREFIX}${studentId}`);
  } catch {
    // Ignore storage issues
  }
}
