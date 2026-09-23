/**
 * Device Participation Token Manager
 * Generates and securely holds a non-sensitive browser/device participation identifier.
 * The server and database remain authoritative for all validation and vote counting.
 */

const STORAGE_KEY = 'voters_decide_device_token_v1';

export function getOrCreateDeviceToken(): string {
  if (typeof window === 'undefined') {
    return 'ssr-temp-token';
  }

  let token = localStorage.getItem(STORAGE_KEY);
  if (!token || token.length < 16) {
    // Generate secure random UUID-like identifier
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      token = crypto.randomUUID();
    } else {
      token = 'vd_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

export function resetDeviceTokenForTesting(): string {
  if (typeof window !== 'undefined') {
    const newToken = crypto.randomUUID ? crypto.randomUUID() : 'vd_' + Date.now();
    localStorage.setItem(STORAGE_KEY, newToken);
    return newToken;
  }
  return 'new-token';
}
