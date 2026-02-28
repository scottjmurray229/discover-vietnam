/**
 * Cron Worker for Discover Vietnam
 *
 * Standalone Cloudflare Worker that handles scheduled (cron) triggers.
 * Fires daily at 07:00 UTC to call the daily report endpoint.
 *
 * Deploy separately from the main Astro site:
 *   cd cron-worker && npx wrangler deploy
 *
 * Required secrets (set via `npx wrangler secret put`):
 *   ADMIN_KEY — same key configured on the main site
 */

interface Env {
  ADMIN_KEY: string;
}

const SITE_URL = 'https://discovervietnam.info';

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    if (!env.ADMIN_KEY) {
      console.error('[cron] ADMIN_KEY secret is not set');
      return;
    }

    const url = `${SITE_URL}/api/admin/daily-report?key=${encodeURIComponent(env.ADMIN_KEY)}`;
    console.log(`[cron] Triggering daily report at ${new Date().toISOString()}`);

    try {
      const response = await fetch(url);
      const body = await response.text();

      if (response.ok) {
        console.log(`[cron] Daily report succeeded: ${body}`);
      } else {
        console.error(`[cron] Daily report failed (${response.status}): ${body}`);
      }
    } catch (err: any) {
      console.error(`[cron] Fetch error: ${err.message}`);
    }
  },

  // Optional: respond to HTTP requests for manual testing
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/trigger' && request.method === 'GET') {
      const key = url.searchParams.get('key');
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
        return new Response('Unauthorized', { status: 401 });
      }

      const reportUrl = `${SITE_URL}/api/admin/daily-report?key=${encodeURIComponent(env.ADMIN_KEY)}`;
      try {
        const response = await fetch(reportUrl);
        const body = await response.text();
        return new Response(`Manual trigger: ${response.status} — ${body}`, {
          status: response.status,
        });
      } catch (err: any) {
        return new Response(`Fetch error: ${err.message}`, { status: 500 });
      }
    }

    return new Response('Discover Vietnam Cron Worker\n\nGET /trigger?key=ADMIN_KEY to manually fire the daily report.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
