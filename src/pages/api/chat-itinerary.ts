export const prerender = false;

import type { APIContext } from 'astro';
import knowledgeBase from '../../data/destination-knowledge.json';
import { verifyEmailCookie } from '../../lib/email-cookie';
import { logUsage } from '../../lib/usage-tracking';
import { checkAndAlertAbuse, alertRateLimitHit } from '../../lib/abuse-alerts';

// --- Types (shared with generate-itinerary) ---

interface DayItem {
  time: string;
  description: string;
  pricePhp?: number;
  priceUsd?: number;
  category: 'transport' | 'accommodation' | 'activity' | 'food' | 'ferry';
  affiliateType?: 'hotel' | 'tour' | 'transport' | null;
  affiliateSlotId?: string;
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

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface ChatRequest {
  currentItinerary: Itinerary;
  conversationHistory: ChatMessage[];
  userMessage: string;
}

interface ChatResponse {
  success: boolean;
  itinerary?: Itinerary;
  changeSummary?: string;
  remainingRequests?: number;
  requiresEmail?: boolean;
  error?: string;
}

// --- Helpers (same as generate-itinerary) ---

function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

function collectAffiliateSlots(days: Day[]) {
  const slots: Array<{ id: string; type: string; destination: string; context: string }> = [];
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

// --- Rate Limiting (shared pool with generate-itinerary) ---

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  requiresEmail: boolean;
}

async function checkRateLimit(db: any, ip: string, hasEmail: boolean): Promise<RateLimitResult> {
  const PER_IP_LIMIT = hasEmail ? 10 : 3;
  const GLOBAL_DAILY_CAP = 500;

  try {
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

// --- Claude API for Chat ---

function buildChatSystemPrompt(): string {
  return `You are the Discover Vietnam AI Trip Planner in EDIT MODE. The user has an existing itinerary and wants to modify it.

RULES:
- Return a COMPLETE replacement itinerary — preserve unchanged parts exactly as they are
- All prices in BOTH VND (₫) and USD ($). Use rate: $1 = 25,000 VND
- Include specific restaurant names, hotel recommendations, and transport details
- Use first-person singular voice: "I recommend...", "you'll love..."
- Be specific: real place names, real prices, real transport options
- Tag hotel/tour/transport items with affiliateType and affiliateSlotId for future monetization
- affiliateSlotId format: "day{N}-{type}-{destination}" e.g. "day1-hotel-hanoi"
- When swapping destinations, update transport/ferry items between days
- When changing budget, adjust hotel and restaurant recommendations accordingly
- When adding/removing days, renumber all dayNumber fields sequentially

SCALING BY TRIP LENGTH:
- 1-7 days: 3-5 items per day, full descriptions (1-2 sentences each)
- 8-14 days: 2-4 items per day, concise descriptions (1 sentence each)
- 15+ days: 2-3 items per day, brief descriptions (under 15 words each)

KNOWLEDGE BASE:
${JSON.stringify(knowledgeBase, null, 2)}

RESPONSE FORMAT — Return ONLY valid JSON with this schema:
{
  "changeSummary": "string — 1-2 sentence description of what changed",
  "itinerary": {
    "title": "string",
    "subtitle": "string",
    "totalBudget": { "php": number, "usd": number },
    "days": [
      {
        "dayNumber": 1,
        "title": "string",
        "destination": "string — slug",
        "items": [
          {
            "time": "string",
            "description": "string",
            "pricePhp": number_or_null,
            "priceUsd": number_or_null,
            "category": "transport|accommodation|activity|food|ferry",
            "affiliateType": "hotel|tour|transport|null",
            "affiliateSlotId": "string_or_null"
          }
        ]
      }
    ]
  }
}

Do NOT include markdown, code fences, or any text outside the JSON object.`;
}

function buildChatMessages(
  conversationHistory: ChatMessage[],
  currentItinerary: Itinerary,
  userMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Add conversation history (user messages + assistant changeSummaries)
  for (const msg of conversationHistory.slice(-12)) {
    messages.push({
      role: msg.role,
      content: msg.text,
    });
  }

  // Final user message includes current itinerary state
  messages.push({
    role: 'user',
    content: `CURRENT ITINERARY:\n${JSON.stringify(currentItinerary)}\n\nUSER REQUEST: ${userMessage}`,
  });

  return messages;
}

function parseResponse(text: string): { itinerary: Itinerary; changeSummary: string } {
  // Strip code fences if present
  let cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.itinerary && parsed.changeSummary) {
      validateItinerary(parsed.itinerary);
      return { itinerary: parsed.itinerary, changeSummary: parsed.changeSummary };
    }
    // Maybe Claude returned just the itinerary without wrapper
    if (parsed.title && parsed.days) {
      validateItinerary(parsed);
      return { itinerary: parsed, changeSummary: 'Itinerary updated.' };
    }
  } catch {
    // Try regex extraction
  }

  // Regex fallback: find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.itinerary && parsed.changeSummary) {
        validateItinerary(parsed.itinerary);
        return { itinerary: parsed.itinerary, changeSummary: parsed.changeSummary };
      }
      if (parsed.title && parsed.days) {
        validateItinerary(parsed);
        return { itinerary: parsed, changeSummary: 'Itinerary updated.' };
      }
    } catch {
      // Fall through
    }
  }

  throw new Error('Could not parse AI response. Try a simpler request.');
}

function validateItinerary(it: any): void {
  if (!it.title || !it.days || !Array.isArray(it.days) || it.days.length === 0) {
    throw new Error('Invalid itinerary structure');
  }
}

// --- Main Handler ---

export async function POST(context: APIContext): Promise<Response> {
  const { locals, request } = context;
  const env = (locals as any).runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' } satisfies ChatResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = env.DB;
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ success: false, error: 'AI service not configured' } satisfies ChatResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Reject oversized request bodies (max 200KB — chat includes currentItinerary)
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > 200_000) {
    return new Response(JSON.stringify({ success: false, error: 'Request too large' } satisfies ChatResponse), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' } satisfies ChatResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.currentItinerary || !body.userMessage?.trim()) {
    return new Response(JSON.stringify({ success: false, error: 'Missing itinerary or message' } satisfies ChatResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Input validation ---
  // Cap chat message length to prevent token abuse
  if (body.userMessage.length > 500) {
    body.userMessage = body.userMessage.slice(0, 500);
  }

  // Cap conversation history to last 12 messages (6 exchanges)
  if (Array.isArray(body.conversationHistory) && body.conversationHistory.length > 12) {
    body.conversationHistory = body.conversationHistory.slice(-12);
  }

  // Reject oversized itinerary payloads (prevent prompt stuffing)
  const itinerarySize = JSON.stringify(body.currentItinerary).length;
  if (itinerarySize > 100_000) {
    return new Response(JSON.stringify({ success: false, error: 'Itinerary data too large.' } satisfies ChatResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate itinerary has expected structure
  if (!body.currentItinerary.title || !Array.isArray(body.currentItinerary.days)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid itinerary structure' } satisfies ChatResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cap itinerary days (prevents someone crafting a 365-day itinerary to inflate tokens)
  if (body.currentItinerary.days.length > 30) {
    body.currentItinerary.days = body.currentItinerary.days.slice(0, 30);
  }

  // Rate limit check (shares pool with generate-itinerary)
  const ip = getClientIP(request);
  const cookies = request.headers.get('cookie') || '';
  const hasEmail = await verifyEmailCookie(cookies, env.COOKIE_SECRET);
  const rateLimit = await checkRateLimit(db, ip, hasEmail);

  if (!rateLimit.allowed) {
    if (env.RESEND_API_KEY) {
      alertRateLimitHit(env.RESEND_API_KEY, ip, hasEmail);
    }
    return new Response(JSON.stringify({
      success: false,
      error: rateLimit.requiresEmail
        ? 'Free limit reached. Enter your email to unlock more requests.'
        : 'Daily limit reached. Please try again tomorrow.',
      requiresEmail: rateLimit.requiresEmail,
      remainingRequests: 0,
    } satisfies ChatResponse), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Call Claude
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const messages = buildChatMessages(
      body.conversationHistory || [],
      body.currentItinerary,
      body.userMessage
    );

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
        system: buildChatSystemPrompt(),
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as any;
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Empty AI response');

    if (data.stop_reason === 'max_tokens') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Response was too long. Try a simpler request.',
      } satisfies ChatResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { itinerary, changeSummary } = parseResponse(text);

    // Record the API call
    await recordAPICall(db, ip, hasEmail);

    // Log usage for cost monitoring
    logUsage(db, { eventType: 'chat', ip, hasEmail, inputTokens: data.usage?.input_tokens ?? 0, outputTokens: data.usage?.output_tokens ?? 0, model: 'claude-haiku-4-5-20251001' });

    // Abuse detection (fire-and-forget)
    if (env.RESEND_API_KEY) {
      checkAndAlertAbuse(db, env.RESEND_API_KEY, ip, 'chat');
    }

    const remaining = rateLimit.remaining - 1;
    return new Response(JSON.stringify({
      success: true,
      itinerary,
      changeSummary,
      remainingRequests: remaining,
      requiresEmail: !hasEmail && remaining <= 1,
    } satisfies ChatResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const detail = err.message || String(err);
    const message = err.name === 'AbortError'
      ? 'AI request timed out. Please try again.'
      : `Failed to update itinerary: ${detail}`;
    return new Response(JSON.stringify({ success: false, error: message } satisfies ChatResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timeout);
  }
}
