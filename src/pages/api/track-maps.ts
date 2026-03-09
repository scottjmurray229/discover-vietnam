export const prerender = false;

import type { APIContext } from 'astro';

async function hashIP(ip: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function POST(context: APIContext): Promise<Response> {
  try {
    const env = (context.locals as any).runtime?.env;
    if (!env?.DB) return new Response(null, { status: 204 });

    const body = await context.request.json().catch(() => null);
    const page = body?.page;
    if (!page || typeof page !== 'string') return new Response(null, { status: 204 });

    const ip = context.request.headers.get('cf-connecting-ip')
      || context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || '';
    const ipHash = await hashIP(ip, env.COOKIE_SECRET || 'fallback-salt');

    await env.DB.prepare(
      `INSERT INTO maps_page_views (page, ip) VALUES (?, ?)`
    ).bind(page, ipHash).run();
  } catch {
    // Silent — tracking must never break the page
  }

  return new Response(null, { status: 204 });
}
