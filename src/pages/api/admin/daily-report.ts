export const prerender = false;

import type { APIContext } from 'astro';
import { estimateCost, fmtCost, fmtNum, fmtTokens } from '../../../lib/stats-helpers';
import { sendEmail } from '../../../lib/send-email';

const ADMIN_EMAILS = ['scottjmurray@gmail.com'];

export async function GET(context: APIContext): Promise<Response> {
  const { locals, request } = context;
  const env = (locals as any).runtime?.env;

  if (!env?.DB) {
    return new Response('Database not configured', { status: 500 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!env.RESEND_API_KEY) {
    return new Response('Resend not configured', { status: 500 });
  }

  const db = env.DB;

  try {
    // --- AI Queries ---
    const last24h = await db.prepare(
      `SELECT COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-1 day')`
    ).first() as any;

    const byType = await db.prepare(
      `SELECT event_type, COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-1 day')
       GROUP BY event_type`
    ).all() as any;

    const unique = await db.prepare(
      `SELECT COUNT(DISTINCT ip) as count FROM usage_analytics WHERE created_at >= datetime('now', '-1 day')`
    ).first() as any;

    const rlHits = await db.prepare(
      `SELECT COUNT(*) as count FROM rate_limits WHERE created_at > datetime('now', '-1 day')`
    ).first() as any;

    // 30d for run rate
    const d30 = await db.prepare(
      `SELECT COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens,
        COUNT(DISTINCT date(created_at)) as days_with_data
       FROM usage_analytics WHERE created_at >= datetime('now', '-30 days')`
    ).first() as any;

    const allTime = await db.prepare(
      `SELECT COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics`
    ).first() as any;

    // --- Maps Queries (graceful) ---
    let mapsLoads24h = 0;
    let mapsByPage: any[] = [];
    let maps30dTotal = 0;
    let mapsMonthlyRate = 0;
    let mapsUsagePct = '0.0';
    let mapsEstCost = 0;
    try {
      const mapsResult = await db.prepare(
        `SELECT COUNT(*) as loads FROM maps_page_views WHERE created_at >= datetime('now', '-1 day')`
      ).first() as any;
      mapsLoads24h = mapsResult?.loads ?? 0;

      const mapsPageResult = await db.prepare(
        `SELECT page, COUNT(*) as loads FROM maps_page_views WHERE created_at >= datetime('now', '-1 day') GROUP BY page ORDER BY loads DESC`
      ).all() as any;
      mapsByPage = mapsPageResult?.results ?? [];

      const maps30dResult = await db.prepare(
        `SELECT COUNT(*) as loads, COUNT(DISTINCT date(created_at)) as days_with_data FROM maps_page_views WHERE created_at >= datetime('now', '-30 days')`
      ).first() as any;
      maps30dTotal = maps30dResult?.loads ?? 0;
      const mapsDays = maps30dResult?.days_with_data || 1;
      mapsMonthlyRate = Math.round((maps30dTotal / mapsDays) * 30);
      const mapsFreeLimit = 28500;
      mapsUsagePct = ((mapsMonthlyRate / mapsFreeLimit) * 100).toFixed(1);
      const mapsOverFree = mapsMonthlyRate > mapsFreeLimit;
      mapsEstCost = mapsOverFree ? ((mapsMonthlyRate - mapsFreeLimit) * 0.007) : 0;
    } catch {
      // Table may not exist yet
    }

    // --- Compute AI values ---
    const calls = last24h?.calls ?? 0;
    const inTok = last24h?.input_tokens ?? 0;
    const outTok = last24h?.output_tokens ?? 0;
    const cost = estimateCost(inTok, outTok);
    const users = unique?.count ?? 0;

    const typeMap: Record<string, any> = {};
    for (const r of (byType?.results ?? []) as any[]) {
      typeMap[r.event_type] = r;
    }

    const d30Cost = estimateCost(d30?.input_tokens ?? 0, d30?.output_tokens ?? 0);
    const daysWithData = d30?.days_with_data || 1;
    const monthlyRate = (d30Cost / daysWithData) * 30;
    const allCost = estimateCost(allTime?.input_tokens ?? 0, allTime?.output_tokens ?? 0);

    const subject = `DP Daily: ${calls} calls, ${fmtCost(cost)}, ${users} users`;

    // --- Shared inline styles ---
    const S = {
      th: 'padding:6px 10px;text-align:left;color:#8b949e;font-size:10px;text-transform:uppercase;border-bottom:1px solid #21262d;',
      thR: 'padding:6px 10px;text-align:right;color:#8b949e;font-size:10px;text-transform:uppercase;border-bottom:1px solid #21262d;',
      td: 'padding:6px 10px;color:#e1e4e8;border-bottom:1px solid #21262d;',
      tdR: 'padding:6px 10px;text-align:right;color:#e1e4e8;border-bottom:1px solid #21262d;',
      tdMuted: 'padding:6px 10px;text-align:right;color:#8b949e;border-bottom:1px solid #21262d;',
      tdCost: 'padding:6px 10px;text-align:right;color:#3fb950;font-weight:600;border-bottom:1px solid #21262d;',
      totalTd: 'padding:6px 10px;font-weight:700;color:#fff;border-top:2px solid #30363d;',
      totalTdR: 'padding:6px 10px;text-align:right;font-weight:700;color:#fff;border-top:2px solid #30363d;',
      totalCost: 'padding:6px 10px;text-align:right;font-weight:700;color:#3fb950;border-top:2px solid #30363d;',
      kpi: 'background:#21262d;border-radius:8px;padding:12px 14px;',
      kpiHighlight: 'background:linear-gradient(135deg,rgba(13,115,119,0.15),rgba(9,84,86,0.1));border:1px solid #0D7377;border-radius:8px;padding:12px 14px;',
      kpiLabel: 'font-size:10px;color:#8b949e;text-transform:uppercase;letter-spacing:0.03em;',
      kpiValue: 'font-size:22px;font-weight:700;color:#fff;',
      kpiSub: 'font-size:11px;color:#8b949e;margin-top:2px;',
      sectionTitle: 'font-size:13px;font-weight:600;color:#c9d1d9;margin:0 0 8px 0;padding-bottom:6px;border-bottom:1px solid #21262d;',
    };

    // AI by-type rows
    const typeRows = ['generate', 'chat', 'cache_hit'].map(t => {
      const r = typeMap[t];
      if (!r) return `<tr><td style="${S.td}">${t}</td><td style="${S.tdMuted}">0</td><td style="${S.tdMuted}">0</td><td style="${S.tdMuted}">$0</td></tr>`;
      return `<tr><td style="${S.td}">${t}</td><td style="${S.tdR}">${r.calls}</td><td style="${S.tdR}">${fmtTokens(r.input_tokens + r.output_tokens)}</td><td style="${S.tdCost}">${fmtCost(estimateCost(r.input_tokens, r.output_tokens))}</td></tr>`;
    }).join('');

    // Maps by-page rows
    const mapsPageRows = mapsByPage.map((r: any) =>
      `<tr><td style="${S.td}">${r.page}</td><td style="${S.tdR}">${fmtNum(r.loads)}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
<div style="max-width:640px;margin:24px auto;background:#161b22;border:1px solid #30363d;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#0D7377,#095456);padding:20px 24px;">
    <div style="font-size:18px;font-weight:700;color:#fff;">Daily Report</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px;">Discover Vietnam &middot; Last 24 Hours</div>
  </div>
  <div style="padding:20px 24px;">

    <!-- 50/50 Split: AI (left) | Maps (right) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>

      <!-- LEFT: Claude AI -->
      <td width="50%" valign="top" style="padding-right:10px;">
        <div style="${S.sectionTitle}">Claude AI (Haiku 4.5)</div>

        <!-- AI KPI cards -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
          <tr>
            <td width="50%" style="padding:0 4px 8px 0;">
              <div style="${S.kpiHighlight}">
                <div style="${S.kpiLabel}">Last 24h</div>
                <div style="${S.kpiValue}">${fmtCost(cost)}</div>
                <div style="${S.kpiSub}">${fmtNum(calls)} calls</div>
              </div>
            </td>
            <td width="50%" style="padding:0 0 8px 4px;">
              <div style="${S.kpi}">
                <div style="${S.kpiLabel}">Users (24h)</div>
                <div style="${S.kpiValue}">${fmtNum(users)}</div>
                <div style="${S.kpiSub}">${fmtTokens(inTok + outTok)} tokens</div>
              </div>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:0 4px 8px 0;">
              <div style="${S.kpi}">
                <div style="${S.kpiLabel}">Monthly Rate</div>
                <div style="${S.kpiValue}">${fmtCost(monthlyRate)}</div>
                <div style="${S.kpiSub}">30d: ${fmtCost(d30Cost)}</div>
              </div>
            </td>
            <td width="50%" style="padding:0 0 8px 4px;">
              <div style="${S.kpi}">
                <div style="${S.kpiLabel}">All Time</div>
                <div style="${S.kpiValue}">${fmtCost(allCost)}</div>
                <div style="${S.kpiSub}">${fmtNum(allTime?.calls ?? 0)} calls</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- AI by-type table -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:12px;">
          <tr><th style="${S.th}">Type</th><th style="${S.thR}">Calls</th><th style="${S.thR}">Tokens</th><th style="${S.thR}">Cost</th></tr>
          ${typeRows}
          <tr><td style="${S.totalTd}">Total</td><td style="${S.totalTdR}">${calls}</td><td style="${S.totalTdR}">${fmtTokens(inTok + outTok)}</td><td style="${S.totalCost}">${fmtCost(cost)}</td></tr>
        </table>

        <div style="margin-top:10px;font-size:12px;color:#8b949e;">
          Rate limits: <strong style="color:#e1e4e8">${rlHits?.count ?? 0}</strong>
        </div>
      </td>

      <!-- RIGHT: Google Maps -->
      <td width="50%" valign="top" style="padding-left:10px;">
        <div style="${S.sectionTitle}">Google Maps</div>

        <!-- Maps KPI cards -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
          <tr>
            <td width="50%" style="padding:0 4px 8px 0;">
              <div style="${S.kpiHighlight}">
                <div style="${S.kpiLabel}">Loads (24h)</div>
                <div style="${S.kpiValue}">${fmtNum(mapsLoads24h)}</div>
              </div>
            </td>
            <td width="50%" style="padding:0 0 8px 4px;">
              <div style="${S.kpi}">
                <div style="${S.kpiLabel}">30d Total</div>
                <div style="${S.kpiValue}">${fmtNum(maps30dTotal)}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:0 4px 8px 0;">
              <div style="${S.kpi}">
                <div style="${S.kpiLabel}">Monthly Proj.</div>
                <div style="${S.kpiValue}">${fmtNum(mapsMonthlyRate)}</div>
                <div style="${S.kpiSub}">${mapsUsagePct}% of 28.5k free</div>
              </div>
            </td>
            <td width="50%" style="padding:0 0 8px 4px;">
              <div style="${S.kpi}">
                <div style="${S.kpiLabel}">Est. Cost</div>
                <div style="${S.kpiValue}">${mapsEstCost > 0 ? fmtCost(mapsEstCost) : 'Free'}</div>
                <div style="${S.kpiSub}">$0.007/load over free</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Maps by-page table -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:12px;">
          <tr><th style="${S.th}">Page</th><th style="${S.thR}">Loads</th></tr>
          ${mapsPageRows || `<tr><td style="${S.td}" colspan="2">No loads yet</td></tr>`}
        </table>
      </td>
    </tr></table>

  </div>
  <div style="padding:12px 24px;text-align:center;font-size:11px;color:#484f58;border-top:1px solid #21262d;">
    Claude Haiku 4.5 &middot; <a href="https://discovervietnam.info/api/admin/stats?key=${key}" style="color:#0D7377;text-decoration:none;">Full Dashboard</a>
  </div>
</div>
</body></html>`;

    const results = await Promise.all(
      ADMIN_EMAILS.map(email => sendEmail(env.RESEND_API_KEY, email, subject, html))
    );
    const allSent = results.every(Boolean);

    if (allSent) {
      return new Response(`Report sent to ${ADMIN_EMAILS.join(', ')}`, { status: 200 });
    } else {
      const failed = ADMIN_EMAILS.filter((_, i) => !results[i]);
      return new Response(`Failed to send to: ${failed.join(', ')}`, { status: 500 });
    }
  } catch (err: any) {
    return new Response(`Error: ${err.message || 'Report failed'}`, { status: 500 });
  }
}
