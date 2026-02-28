export const prerender = false;

import type { APIContext } from 'astro';

export async function GET(context: APIContext): Promise<Response> {
  const { locals, url } = context;
  const env = (locals as any).runtime?.env;

  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing session_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Dev mode — fake token for dev_ prefixed session IDs
  if (sessionId.startsWith('dev_')) {
    const tripId = sessionId.replace('dev_', '');
    return new Response(JSON.stringify({
      success: true,
      token: `devtoken_${tripId}`,
      tripId,
      email: 'dev@example.com',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Prod mode — look up session in KV
  if (!env?.COMPANION_KV) {
    return new Response(JSON.stringify({ success: false, error: 'KV not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const raw = await env.COMPANION_KV.get(`session:${sessionId}`);
  if (!raw) {
    return new Response(JSON.stringify({ pending: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = JSON.parse(raw);
  if (data.status === 'completed' && data.token) {
    return new Response(JSON.stringify({
      success: true,
      token: data.token,
      tripId: data.tripId,
      email: data.email,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Session exists but webhook hasn't fired yet
  return new Response(JSON.stringify({ pending: true }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
}
