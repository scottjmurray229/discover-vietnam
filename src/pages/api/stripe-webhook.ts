export const prerender = false;

import type { APIContext } from 'astro';

export async function POST(context: APIContext): Promise<Response> {
  const { locals, request } = context;
  const env = (locals as any).runtime?.env;

  if (!env?.STRIPE_SECRET_KEY || !env?.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook not configured', { status: 501 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await request.text();

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const tripId = session.metadata?.tripId;
    const email = session.customer_email;

    if (!tripId) {
      console.error('[Webhook] No tripId in session metadata');
      return new Response('ok', { status: 200 });
    }

    const accessToken = crypto.randomUUID();

    if (env.COMPANION_KV) {
      // Store permanent access record
      await env.COMPANION_KV.put(
        `access:${tripId}`,
        JSON.stringify({
          token: accessToken,
          email,
          tripId,
          paidAt: new Date().toISOString(),
          companions: [],
          stripeSessionId: session.id,
        })
      );

      // Update session record with token + completed status (7-day TTL)
      await env.COMPANION_KV.put(
        `session:${session.id}`,
        JSON.stringify({
          tripId,
          email,
          token: accessToken,
          status: 'completed',
          completedAt: new Date().toISOString(),
        }),
        { expirationTtl: 604800 }
      );
    }
  }

  return new Response('ok', { status: 200 });
}
