export const prerender = false;

import type { APIContext } from 'astro';
import knowledgeBase from '../../data/destination-knowledge.json';
import { verifyEmailCookie } from '../../lib/email-cookie';
import { DESTINATION_COORDS } from '../../data/destination-coords';
import { LANDMARK_COORDS } from '../../data/landmark-coords';
import { logUsage } from '../../lib/usage-tracking';
import { checkAndAlertAbuse, alertRateLimitHit } from '../../lib/abuse-alerts';

// --- Types ---

interface RequestBody {
  destinations?: string[];
  duration?: string;
  budgetLevel?: string;
  travelers?: string;
  month?: string;
  description?: string;
}

interface DayItem {
  time: string;
  description: string;
  pricePhp?: number;
  priceUsd?: number;
  category: 'transport' | 'accommodation' | 'activity' | 'food' | 'ferry';
  affiliateType?: 'hotel' | 'tour' | 'transport' | null;
  affiliateSlotId?: string;
  locationName?: string;
  lat?: number;
  lng?: number;
}

interface Day {
  dayNumber: number;
  title: string;
  destination: string;
  items: DayItem[];
}

interface Itinerary {
  title: string;
  subtitle: string;
  totalBudget: { php: number; usd: number };
  days: Day[];
}

interface TripResponse {
  success: boolean;
  source: 'cache' | 'ai';
  itinerary: Itinerary;
  remainingRequests: number;
  requiresEmail: boolean;
  affiliateSlots: Array<{ id: string; type: string; destination: string; context: string }>;
}

// --- Helpers ---

const KNOWN_DESTINATIONS = Object.keys(knowledgeBase.destinations);

const DURATION_MAP: Record<string, string> = {
  '3-5 days': '4',
  '1 week': '7',
  '10 days': '10',
  '2 weeks': '14',
  '3+ weeks': '21',
};

const BUDGET_MAP: Record<string, string> = {
  'backpacker': 'budget',
  'budget-comfortable': 'budget',
  'mid-range': 'midrange',
  'luxury': 'luxury',
};

function normalizeBudget(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, val] of Object.entries(BUDGET_MAP)) {
    if (lower.includes(key)) return val;
  }
  if (lower.includes('backpack')) return 'budget';
  if (lower.includes('budget')) return 'budget';
  if (lower.includes('mid')) return 'midrange';
  if (lower.includes('luxur')) return 'luxury';
  return 'midrange';
}

function normalizeDuration(raw: string): string {
  if (DURATION_MAP[raw]) return DURATION_MAP[raw];
  const match = raw.match(/(\d+)/);
  if (match) return match[1];
  return '7';
}

function normalizeDestinations(dests: string[]): string {
  return dests
    .map(d => d.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(d => d.length > 0)
    .sort()
    .join(',');
}

function extractDestsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const exact = KNOWN_DESTINATIONS.filter(d => lower.includes(d));
  if (exact.length > 0) return exact;

  // Keyword-based fallback: map common themes to popular destinations
  const themeMap: Record<string, string[]> = {
    'beach': ['boracay', 'el-nido', 'siargao'],
    'island': ['el-nido', 'coron', 'boracay'],
    'snorkel': ['cebu', 'coron', 'bohol'],
    'dive': ['coron', 'cebu', 'bohol'],
    'diving': ['coron', 'cebu', 'bohol'],
    'surf': ['siargao'],
    'culture': ['cebu', 'bohol', 'siquijor'],
    'history': ['cebu', 'clark'],
    'food': ['cebu', 'dumaguete', 'clark'],
    'relax': ['phu-quoc', 'hoi-an', 'dalat'],
    'adventure': ['sapa', 'ha-long-bay', 'dalat'],
    'family': ['da-nang', 'hoi-an', 'phu-quoc'],
    'honeymoon': ['phu-quoc', 'hoi-an', 'dalat'],
    'romantic': ['hoi-an', 'phu-quoc', 'dalat'],
    'budget': ['hanoi', 'hoi-an', 'hue'],
    'luxury': ['phu-quoc', 'da-nang', 'ha-long-bay'],
    'north': ['hanoi', 'ha-long-bay', 'sapa'],
    'central': ['da-nang', 'hoi-an', 'hue'],
    'south': ['ho-chi-minh-city', 'phu-quoc', 'can-tho'],
  };

  const matched = new Set<string>();
  for (const [keyword, dests] of Object.entries(themeMap)) {
    if (lower.includes(keyword)) {
      dests.forEach(d => matched.add(d));
    }
  }
  if (matched.size > 0) return [...matched].slice(0, 4);

  // Ultimate fallback: popular starter destinations when description exists
  return ['hanoi', 'hoi-an', 'ha-long-bay'];
}

async function computeHash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

function collectAffiliateSlots(days: Day[]): TripResponse['affiliateSlots'] {
  const slots: TripResponse['affiliateSlots'] = [];
  for (const day of days) {
    for (const item of day.items) {
      if (item.affiliateSlotId) {
        slots.push({
          id: item.affiliateSlotId,
          type: item.affiliateType || item.category,
          destination: day.destination,
          context: item.description,
        });
      }
    }
  }
  return slots;
}

// --- Rate Limiting ---

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  requiresEmail: boolean;
}

async function checkRateLimit(db: any, ip: string, hasEmail: boolean): Promise<RateLimitResult> {
  const PER_IP_LIMIT = hasEmail ? 10 : 3;
  const GLOBAL_DAILY_CAP = 500;

  try {
    // Count AI calls in the last 24 hours for this IP
    const result = await db.prepare(
      `SELECT COUNT(*) as count FROM rate_limits WHERE ip = ? AND created_at > datetime('now', '-1 day')`
    ).bind(ip).first();
    const count = result?.count || 0;

    // Global cap: 500 AI calls/day (hard spending safety valve)
    const globalResult = await db.prepare(
      `SELECT COUNT(*) as count FROM rate_limits WHERE created_at > datetime('now', '-1 day')`
    ).first();
    const globalCount = globalResult?.count || 0;

    if (globalCount >= GLOBAL_DAILY_CAP) {
      return { allowed: false, remaining: 0, requiresEmail: false };
    }

    if (count >= PER_IP_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        requiresEmail: !hasEmail && count >= 3,
      };
    }

    return {
      allowed: true,
      remaining: PER_IP_LIMIT - count,
      requiresEmail: false,
    };
  } catch {
    // D1 error — fail closed to prevent runaway API costs
    return { allowed: false, remaining: 0, requiresEmail: false };
  }
}

async function recordAPICall(db: any, ip: string, hasEmail: boolean): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO rate_limits (ip, has_email) VALUES (?, ?)`
    ).bind(ip, hasEmail ? 1 : 0).run();
  } catch {
    // D1 write failure — non-fatal, rate limit may be slightly off
  }
}

// --- Cache Lookup ---

async function exactCacheLookup(db: any, hash: string): Promise<Itinerary | null> {
  const row = await db.prepare(
    `SELECT response_json FROM itineraries WHERE query_hash = ?`
  ).bind(hash).first();

  if (row) {
    // Bump hit count
    await db.prepare(
      `UPDATE itineraries SET hit_count = hit_count + 1, last_hit_at = datetime('now') WHERE query_hash = ?`
    ).bind(hash).run();
    try {
      return JSON.parse(row.response_json);
    } catch {
      return null;
    }
  }
  return null;
}

async function similarCacheLookup(db: any, destinations: string, duration: string, budgetLevel: string): Promise<Itinerary | null> {
  const row = await db.prepare(
    `SELECT query_hash, response_json FROM itineraries WHERE destinations = ? AND duration = ? AND budget_level = ? ORDER BY hit_count DESC LIMIT 1`
  ).bind(destinations, duration, budgetLevel).first();

  if (row) {
    await db.prepare(
      `UPDATE itineraries SET hit_count = hit_count + 1, last_hit_at = datetime('now') WHERE query_hash = ?`
    ).bind(row.query_hash).run();
    try {
      return JSON.parse(row.response_json);
    } catch {
      return null;
    }
  }
  return null;
}

async function cacheResponse(db: any, hash: string, destinations: string, duration: string, budgetLevel: string, month: string, requestBody: RequestBody, itinerary: Itinerary): Promise<void> {
  try {
    await db.prepare(
      `INSERT OR IGNORE INTO itineraries (query_hash, destinations, duration, budget_level, month, request_json, response_json) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(hash, destinations, duration, budgetLevel, month || '', JSON.stringify(requestBody), JSON.stringify(itinerary)).run();
  } catch {
    // Cache write failure is non-fatal
  }
}

// --- Claude API ---

function buildSystemPrompt(): string {
  return `You are the Discover Vietnam AI Trip Planner. You generate detailed day-by-day itineraries for Vietnam travel.

RULES:
- All prices in BOTH VND (₫) and USD ($). Use rate: $1 = 25,000 VND
- Include specific restaurant names, hotel recommendations, and transport details
- Use first-person singular voice: "I recommend...", "you'll love..."
- Be specific: real place names, real prices, real transport options
- Tag hotel/tour/transport items with affiliateType and affiliateSlotId for future monetization
- affiliateSlotId format: "day{N}-{type}-{destination}" e.g. "day1-hotel-hanoi"

SCALING BY TRIP LENGTH — this is critical to stay within output limits:
- 1-7 days: 3-5 items per day, full descriptions (1-2 sentences each)
- 8-14 days: 2-4 items per day, concise descriptions (1 sentence each)
- 15+ days: 2-3 items per day, brief descriptions (under 15 words each). Group similar days (e.g. "Days 5-6: Beach days in Samar"). Only include key activities, one meal, and accommodation.

KNOWLEDGE BASE:
${JSON.stringify(knowledgeBase, null, 2)}

RESPONSE FORMAT — Return ONLY valid JSON matching this schema:
{
  "title": "string — trip title like '7-Day Northern Vietnam Explorer'",
  "subtitle": "string — budget + month like 'Mid-Range · March 2026'",
  "totalBudget": { "php": number, "usd": number },
  "days": [
    {
      "dayNumber": 1,
      "title": "string — day title like 'Arrive in Hanoi'",
      "destination": "string — slug like 'hanoi'",
      "items": [
        {
          "time": "string — like 'Morning' or '5:30 AM'",
          "description": "string — what to do, with personality",
          "pricePhp": number_or_null,
          "priceUsd": number_or_null,
          "category": "transport|accommodation|activity|food|ferry",
          "affiliateType": "hotel|tour|transport|null",
          "affiliateSlotId": "string_or_null",
          "locationName": "string — specific place name for map pin, e.g. 'Hoan Kiem Lake', 'Ha Long Bay', 'Ben Thanh Market'. Use real, specific place names."
        }
      ]
    }
  ]
}

Do NOT include markdown, code fences, or any text outside the JSON object.`;
}

function buildUserPrompt(body: RequestBody, destinations: string, duration: string, budgetLevel: string): string {
  const parts: string[] = [];

  if (body.destinations && body.destinations.length > 0) {
    const destNames = body.destinations.map(d => {
      const info = (knowledgeBase.destinations as Record<string, any>)[d];
      return info ? info.title : d;
    });
    parts.push(`Destinations: ${destNames.join(', ')}`);
  }

  parts.push(`Duration: ${duration} days`);
  parts.push(`Budget: ${budgetLevel}`);

  if (body.travelers) parts.push(`Travelers: ${body.travelers}`);
  if (body.month) parts.push(`Month: ${body.month}`);
  if (body.description) parts.push(`Additional details: ${body.description}`);

  let prompt = `Plan a ${duration}-day Vietnam trip:\n${parts.join('\n')}`;
  const days = parseInt(duration);
  if (days >= 15) {
    prompt += `\n\nIMPORTANT: This is a long trip. Keep descriptions under 15 words. Use 2-3 items per day max. Group rest/beach days together. Stay well under 7000 tokens.`;
  } else if (days >= 8) {
    prompt += `\n\nNote: Keep descriptions concise (1 sentence each), 2-4 items per day.`;
  }
  return prompt;
}

interface ClaudeResult {
  itinerary: Itinerary;
  inputTokens: number;
  outputTokens: number;
}

async function callClaude(apiKey: string, body: RequestBody, destinations: string, duration: string, budgetLevel: string): Promise<ClaudeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        system: buildSystemPrompt(),
        messages: [
          { role: 'user', content: buildUserPrompt(body, destinations, duration, budgetLevel) },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as any;
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Empty Claude response');

    // Detect truncated response (hit max_tokens before finishing)
    if (data.stop_reason === 'max_tokens') {
      throw new Error('Itinerary was too long to generate. Please try fewer destinations or a shorter trip.');
    }

    // Parse JSON — Claude might wrap it in code fences
    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const itinerary: Itinerary = JSON.parse(cleaned);

    // Basic validation
    if (!itinerary.title || !itinerary.days || !Array.isArray(itinerary.days)) {
      throw new Error('Invalid itinerary structure');
    }

    return {
      itinerary,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// --- Coordinate Resolution ---

function resolveCoordinates(itinerary: Itinerary): void {
  for (const day of itinerary.days) {
    for (const item of day.items) {
      // Already has coords (from cache or previous run)
      if (item.lat && item.lng) continue;

      // 1. Try landmark lookup by locationName
      const locKey = item.locationName?.toLowerCase().trim();
      if (locKey && LANDMARK_COORDS[locKey]) {
        item.lat = LANDMARK_COORDS[locKey].lat;
        item.lng = LANDMARK_COORDS[locKey].lng;
        continue;
      }

      // 2. Try fuzzy matching: check if any landmark key is contained in the locationName
      if (locKey) {
        for (const [key, coords] of Object.entries(LANDMARK_COORDS)) {
          if (locKey.includes(key) || key.includes(locKey)) {
            item.lat = coords.lat;
            item.lng = coords.lng;
            break;
          }
        }
        if (item.lat && item.lng) continue;
      }

      // 3. Fall back to destination centroid
      const destSlug = day.destination?.toLowerCase().trim();
      if (destSlug && DESTINATION_COORDS[destSlug]) {
        item.lat = DESTINATION_COORDS[destSlug].lat;
        item.lng = DESTINATION_COORDS[destSlug].lng;
      }
    }
  }
}

// --- Main Handler ---

export async function POST(context: APIContext): Promise<Response> {
  const { locals, request } = context;
  const env = (locals as any).runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = env.DB;
  const apiKey = env.ANTHROPIC_API_KEY;

  // Reject oversized request bodies (max 10KB for this endpoint)
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > 10_000) {
    return new Response(JSON.stringify({ success: false, error: 'Request too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Input validation ---
  // Cap description length to prevent prompt injection / token abuse
  if (body.description && body.description.length > 500) {
    body.description = body.description.slice(0, 500);
  }

  // Cap other string fields
  if (body.duration && body.duration.length > 50) body.duration = body.duration.slice(0, 50);
  if (body.budgetLevel && body.budgetLevel.length > 50) body.budgetLevel = body.budgetLevel.slice(0, 50);
  if (body.travelers && body.travelers.length > 50) body.travelers = body.travelers.slice(0, 50);
  if (body.month && body.month.length > 20) body.month = body.month.slice(0, 20);

  // Validate destinations array
  let destinations = body.destinations || [];
  if (!Array.isArray(destinations)) {
    destinations = [];
  }
  // Cap at 5 destinations max
  if (destinations.length > 5) {
    destinations = destinations.slice(0, 5);
  }
  // Cap individual destination string lengths
  destinations = destinations.map((d: any) => typeof d === 'string' ? d.slice(0, 50) : '').filter((d: string) => d.length > 0);

  if (destinations.length === 0 && body.description) {
    destinations = extractDestsFromText(body.description);
  }
  if (destinations.length === 0) {
    return new Response(JSON.stringify({ success: false, error: 'Please select at least one destination or describe your trip.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalizedDests = normalizeDestinations(destinations);
  const duration = normalizeDuration(body.duration || '7');
  const budgetLevel = normalizeBudget(body.budgetLevel || 'mid-range');
  const month = body.month || '';
  const travelers = body.travelers || '';

  // Compute hash for exact cache match
  const hashInput = `${normalizedDests}|${duration}|${budgetLevel}|${travelers}|${month}`;
  const queryHash = await computeHash(hashInput);

  // Check email cookie for rate limit tier
  const cookies = request.headers.get('cookie') || '';
  const hasEmail = await verifyEmailCookie(cookies, env.COOKIE_SECRET);

  // --- Tier 1: Exact cache match ---
  try {
    const exactMatch = await exactCacheLookup(db, queryHash);
    if (exactMatch) {
      const ip = getClientIP(request);
      const rateInfo = await checkRateLimit(db, ip, hasEmail);
      logUsage(db, { eventType: 'cache_hit', ip, hasEmail, destinations: normalizedDests, duration, budgetLevel, cacheHit: true, queryHash });
      return new Response(JSON.stringify({
        success: true,
        source: 'cache',
        itinerary: exactMatch,
        remainingRequests: rateInfo.remaining,
        requiresEmail: false,
        affiliateSlots: collectAffiliateSlots(exactMatch.days),
      } satisfies TripResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Tier 2: Similarity cache match ---
    const similarMatch = await similarCacheLookup(db, normalizedDests, duration, budgetLevel);
    if (similarMatch) {
      const ip = getClientIP(request);
      const rateInfo = await checkRateLimit(db, ip, hasEmail);
      logUsage(db, { eventType: 'cache_hit', ip, hasEmail, destinations: normalizedDests, duration, budgetLevel, cacheHit: true, queryHash });
      return new Response(JSON.stringify({
        success: true,
        source: 'cache',
        itinerary: similarMatch,
        remainingRequests: rateInfo.remaining,
        requiresEmail: false,
        affiliateSlots: collectAffiliateSlots(similarMatch.days),
      } satisfies TripResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    // Cache lookup failed — fall through to AI generation
  }

  // --- Rate limit check (only for AI calls) ---
  const ip = getClientIP(request);
  const rateLimit = await checkRateLimit(db, ip, hasEmail);
  if (!rateLimit.allowed) {
    if (env.RESEND_API_KEY) {
      alertRateLimitHit(env.RESEND_API_KEY, ip, hasEmail);
    }
    return new Response(JSON.stringify({
      success: false,
      error: rateLimit.requiresEmail
        ? 'Free limit reached. Enter your email to unlock more itineraries.'
        : 'Daily limit reached. Please try again tomorrow.',
      requiresEmail: rateLimit.requiresEmail,
      remainingRequests: 0,
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Tier 3: Claude API call ---
  if (!apiKey) {
    return new Response(JSON.stringify({ success: false, error: 'AI service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { itinerary, inputTokens, outputTokens } = await callClaude(apiKey, body, normalizedDests, duration, budgetLevel);

    // Resolve coordinates for map display
    resolveCoordinates(itinerary);

    // Record the API call for rate limiting
    await recordAPICall(db, ip, hasEmail);

    // Log usage for cost monitoring
    logUsage(db, { eventType: 'generate', ip, hasEmail, inputTokens, outputTokens, model: 'claude-haiku-4-5-20251001', destinations: normalizedDests, duration, budgetLevel, queryHash });

    // Abuse detection (fire-and-forget)
    if (env.RESEND_API_KEY) {
      checkAndAlertAbuse(db, env.RESEND_API_KEY, ip, 'generate');
    }

    // Cache the response
    await cacheResponse(db, queryHash, normalizedDests, duration, budgetLevel, month, body, itinerary);

    const remaining = rateLimit.remaining - 1;
    return new Response(JSON.stringify({
      success: true,
      source: 'ai',
      itinerary,
      remainingRequests: remaining,
      requiresEmail: !hasEmail && remaining <= 1,
      affiliateSlots: collectAffiliateSlots(itinerary.days),
    } satisfies TripResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const detail = err.message || String(err);
    const message = err.name === 'AbortError'
      ? 'AI request timed out. Please try again.'
      : `Failed to generate itinerary: ${detail}`;
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
