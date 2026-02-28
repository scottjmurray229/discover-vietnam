/**
 * MX record validation via Cloudflare DoH + HMAC-signed email cookie.
 *
 * Used by subscribe, generate-itinerary, chat-itinerary, and email-itinerary endpoints.
 */

const COOKIE_NAME = 'dv_email';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// --- MX Record Check ---

export async function hasMxRecords(domain: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      {
        headers: { Accept: 'application/dns-json' },
        signal: controller.signal,
      },
    );

    if (!res.ok) return true; // fail open

    const data = (await res.json()) as { Answer?: Array<{ type: number }> };
    return Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    // Timeout or network error — fail open so real users aren't blocked
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

// --- HMAC Cookie Signing ---

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a signed cookie value: `{timestamp}.{hmac}`
 * Returns the full Set-Cookie header value.
 */
export async function signEmailCookie(secret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const key = await deriveKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp));
  const hmac = toHex(sig);
  const value = `${timestamp}.${hmac}`;
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
}

/**
 * Verify the signed cookie from a Cookie header string.
 * Returns true if HMAC is valid and the cookie is not expired (30 days).
 *
 * If `secret` is empty/undefined (local dev), falls back to accepting plain `dp_email=1`.
 */
export async function verifyEmailCookie(
  cookieHeader: string,
  secret: string | undefined,
): Promise<boolean> {
  if (!cookieHeader) return false;

  // Parse the dp_email value out of the cookie header
  const match = cookieHeader.match(/(?:^|;\s*)dp_email=([^;]+)/);
  if (!match) return false;
  const raw = match[1].trim();

  // Dev fallback: no secret configured — accept the legacy plain cookie
  if (!secret) {
    return raw === '1';
  }

  // Signed cookie: {timestamp}.{64-char hex hmac}
  const dotIndex = raw.indexOf('.');
  if (dotIndex === -1) return false;

  const timestamp = raw.slice(0, dotIndex);
  const hmac = raw.slice(dotIndex + 1);

  // Validate format
  if (!/^\d+$/.test(timestamp) || !/^[0-9a-f]{64}$/.test(hmac)) return false;

  // Check expiry (30 days)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age < 0 || age > COOKIE_MAX_AGE) return false;

  // Verify HMAC
  const key = await deriveKey(secret);
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp));
  const expectedHex = toHex(expected);

  // Constant-time comparison
  if (hmac.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hmac.length; i++) {
    diff |= hmac.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}
