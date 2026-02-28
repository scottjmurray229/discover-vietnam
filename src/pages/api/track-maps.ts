export const prerender = false;

import type { APIContext } from 'astro';

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

    await env.DB.prepare(
      `INSERT INTO maps_page_views (page, ip) VALUES (?, ?)`
    ).bind(page, ip).run();
  } catch {
    // Silent — tracking must never break the page
  }

  return new Response(null, { status: 204 });
}
