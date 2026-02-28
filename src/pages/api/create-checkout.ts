export const prerender = false;

import type { APIContext } from 'astro';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(context: APIContext): Promise<Response> {
  const { locals, request } = context;
  const env = (locals as any).runtime?.env;

  let body: { email?: string; source?: string; templateId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ success: false, error: 'Please enter a valid email address.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tripId = crypto.randomUUID();
  const source = body.source || 'direct';
  const templateId = body.templateId || '';

  // Dev mode — no Stripe keys configured
  if (!env?.STRIPE_SECRET_KEY) {
    const devSessionId = `dev_${tripId}`;
    console.log('[Checkout - Dev Mode]', { email, tripId, source, templateId });

    return new Response(JSON.stringify({
      success: true,
      checkoutUrl: `/companion/success?session_id=${devSessionId}`,
      tripId,
      dev: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Prod mode — create Stripe checkout session
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price: env.STRIPE_PRICE_ID,
      quantity: 1,
    }],
    customer_email: email,
    metadata: { tripId, source, templateId },
    success_url: `${origin}/companion/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/companion/start/?cancelled=true`,
  });

  // Store pending session in KV (24h TTL)
  if (env.COMPANION_KV) {
    await env.COMPANION_KV.put(
      `session:${session.id}`,
      JSON.stringify({
        tripId,
        email,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: 86400 }
    );
  }

  return new Response(JSON.stringify({
    success: true,
    checkoutUrl: session.url,
    tripId,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
