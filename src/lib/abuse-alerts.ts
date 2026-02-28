import { sendEmail } from './send-email';

const ADMIN_EMAIL = 'scottjmurray@gmail.com';

function abuseEmailHtml(title: string, details: Record<string, string>): string {
  const rows = Object.entries(details)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#8b949e;font-size:13px;white-space:nowrap;">${k}</td><td style="padding:6px 12px;color:#e1e4e8;font-size:13px;">${v}</td></tr>`)
    .join('');
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
<div style="max-width:520px;margin:24px auto;background:#161b22;border:1px solid #30363d;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#991b1b,#dc2626);padding:16px 20px;">
    <div style="font-size:16px;font-weight:700;color:#fff;">${title}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px;">Discover Vietnam &middot; AI Trip Planner</div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows}</table>
</div></body></html>`;
}

export async function checkAndAlertAbuse(
  db: any,
  resendKey: string,
  ip: string,
  eventType: string,
): Promise<void> {
  try {
    // Burst: >5 calls from same IP in 1 hour
    const ipResult = await db.prepare(
      `SELECT COUNT(*) as count FROM usage_analytics WHERE ip = ? AND created_at >= datetime('now', '-1 hour')`
    ).bind(ip).first() as any;
    const ipCount = ipResult?.count ?? 0;

    if (ipCount > 5) {
      // Dedup: check if we already alerted for this IP recently
      // Use rate_limits table count as a proxy — if IP has many entries, we've seen it
      const recentAlerts = await db.prepare(
        `SELECT COUNT(*) as count FROM usage_analytics WHERE ip = ? AND event_type = ? AND created_at >= datetime('now', '-1 hour')`
      ).bind(ip, eventType).first() as any;

      // Only alert on the 6th call (first crossing), not every subsequent call
      if (ipCount === 6 || (recentAlerts?.count ?? 0) === 6) {
        await sendEmail(resendKey, ADMIN_EMAIL,
          `[ABUSE] IP burst: ${ip} — ${ipCount} calls/hr`,
          abuseEmailHtml('IP Burst Alert', {
            'IP Address': ip,
            'Calls (1hr)': String(ipCount),
            'Event Type': eventType,
            'Time (UTC)': new Date().toISOString(),
          }),
        );
      }
    }

    // Global spike: >100 total calls in 1 hour
    const globalResult = await db.prepare(
      `SELECT COUNT(*) as count FROM usage_analytics WHERE created_at >= datetime('now', '-1 hour')`
    ).first() as any;
    const globalCount = globalResult?.count ?? 0;

    if (globalCount === 101) {
      await sendEmail(resendKey, ADMIN_EMAIL,
        `[ABUSE] Global spike: ${globalCount} calls/hr`,
        abuseEmailHtml('Global Spike Alert', {
          'Total Calls (1hr)': String(globalCount),
          'Trigger IP': ip,
          'Event Type': eventType,
          'Time (UTC)': new Date().toISOString(),
        }),
      );
    }
  } catch {
    // Abuse checking must never break the planner
  }
}

export async function alertRateLimitHit(
  resendKey: string,
  ip: string,
  hasEmail: boolean,
): Promise<void> {
  try {
    await sendEmail(resendKey, ADMIN_EMAIL,
      `[RATE LIMIT] ${ip} blocked (${hasEmail ? 'email' : 'anon'})`,
      abuseEmailHtml('Rate Limit Hit', {
        'IP Address': ip,
        'User Tier': hasEmail ? 'Email verified' : 'Anonymous',
        'Time (UTC)': new Date().toISOString(),
      }),
    );
  } catch {
    // Silent
  }
}
