export const prerender = false;

import type { APIContext } from 'astro';
import { estimateCost, fmtCost, fmtNum, fmtTokens } from '../../../lib/stats-helpers';

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

  // Support ?format=json for programmatic access
  const format = url.searchParams.get('format');

  const db = env.DB;

  try {
    // Last 24 hours totals
    const today = await db.prepare(
      `SELECT COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-1 day')`
    ).first() as any;

    // Last 24 hours by type
    const todayByType = await db.prepare(
      `SELECT event_type, COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-1 day')
       GROUP BY event_type`
    ).all() as any;

    // Last 7 days daily breakdown
    const last7 = await db.prepare(
      `SELECT date(created_at) as day, COUNT(*) as calls,
        SUM(CASE WHEN event_type = 'generate' THEN 1 ELSE 0 END) as generates,
        SUM(CASE WHEN event_type = 'chat' THEN 1 ELSE 0 END) as chats,
        SUM(CASE WHEN event_type = 'cache_hit' THEN 1 ELSE 0 END) as cache_hits,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-7 days')
       GROUP BY date(created_at) ORDER BY day DESC`
    ).all() as any;

    // Last 30 days daily breakdown
    const last30 = await db.prepare(
      `SELECT date(created_at) as day, COUNT(*) as calls,
        SUM(CASE WHEN event_type = 'generate' THEN 1 ELSE 0 END) as generates,
        SUM(CASE WHEN event_type = 'chat' THEN 1 ELSE 0 END) as chats,
        SUM(CASE WHEN event_type = 'cache_hit' THEN 1 ELSE 0 END) as cache_hits,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-30 days')
       GROUP BY date(created_at) ORDER BY day DESC`
    ).all() as any;

    // 30-day totals by type
    const byType30 = await db.prepare(
      `SELECT event_type, COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-30 days')
       GROUP BY event_type`
    ).all() as any;

    // By tier (email vs anonymous) last 30 days
    const byTier = await db.prepare(
      `SELECT CASE WHEN has_email = 1 THEN 'Email verified' ELSE 'Anonymous' END as tier, COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-30 days')
       GROUP BY has_email`
    ).all() as any;

    // Top destinations (last 30 days)
    const topDests = await db.prepare(
      `SELECT destinations, COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
       FROM usage_analytics WHERE created_at >= datetime('now', '-30 days') AND destinations != ''
       GROUP BY destinations ORDER BY calls DESC LIMIT 15`
    ).all() as any;

    // All-time totals
    const allTime = await db.prepare(
      `SELECT COUNT(*) as calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens,
        MIN(created_at) as first_event
       FROM usage_analytics`
    ).first() as any;

    // Unique IPs (last 30 days)
    const uniqueUsers = await db.prepare(
      `SELECT COUNT(DISTINCT ip) as unique_ips FROM usage_analytics WHERE created_at >= datetime('now', '-30 days')`
    ).first() as any;

    // Rate limit hits (last 24h)
    const rateLimitHits = await db.prepare(
      `SELECT COUNT(*) as count FROM rate_limits WHERE created_at > datetime('now', '-1 day')`
    ).first() as any;

    // --- Google Maps Usage (graceful degradation) ---
    let mapsHtml = '';
    try {
      const maps24h = await db.prepare(
        `SELECT COUNT(*) as loads FROM maps_page_views WHERE created_at >= datetime('now', '-1 day')`
      ).first() as any;

      const mapsByPage = await db.prepare(
        `SELECT page, COUNT(*) as loads FROM maps_page_views WHERE created_at >= datetime('now', '-1 day') GROUP BY page ORDER BY loads DESC`
      ).all() as any;

      const maps30d = await db.prepare(
        `SELECT date(created_at) as day, COUNT(*) as loads FROM maps_page_views WHERE created_at >= datetime('now', '-30 days') GROUP BY date(created_at) ORDER BY day DESC`
      ).all() as any;

      const maps30dTotal = (maps30d?.results ?? []).reduce((s: number, r: any) => s + r.loads, 0);
      const maps30dDays = (maps30d?.results ?? []).length || 1;
      const mapsMonthlyRate = Math.round((maps30dTotal / maps30dDays) * 30);
      const mapsFreeLimit = 28500;
      const mapsUsagePct = ((mapsMonthlyRate / mapsFreeLimit) * 100).toFixed(1);
      const mapsOverFree = mapsMonthlyRate > mapsFreeLimit;
      const mapsEstCost = mapsOverFree ? ((mapsMonthlyRate - mapsFreeLimit) * 0.007) : 0;

      mapsHtml = `
    <div class="section">
      <h2>Google Maps</h2>
      <div class="cards" style="margin-bottom:16px;grid-template-columns:1fr 1fr;">
        <div class="card${(maps24h?.loads ?? 0) > 500 ? ' warn' : ''}">
          <div class="label">Last 24h Loads</div>
          <div class="value">${fmtNum(maps24h?.loads ?? 0)}</div>
        </div>
        <div class="card">
          <div class="label">30d Total</div>
          <div class="value">${fmtNum(maps30dTotal)}</div>
        </div>
        <div class="card${mapsOverFree ? ' warn' : ''}">
          <div class="label">Monthly Projection</div>
          <div class="value">${fmtNum(mapsMonthlyRate)}</div>
          <div class="sub">${mapsUsagePct}% of ${fmtNum(mapsFreeLimit)} free tier</div>
        </div>
        <div class="card${mapsEstCost > 0 ? ' warn' : ''}">
          <div class="label">Est. Monthly Cost</div>
          <div class="value">${mapsEstCost > 0 ? fmtCost(mapsEstCost) : 'Free'}</div>
          <div class="sub">$0.007/load over free tier</div>
        </div>
      </div>
      <table>
        <tr><th>Page</th><th class="num">Loads (24h)</th></tr>
        ${((mapsByPage?.results ?? []) as any[]).map((r: any) => `<tr><td>${r.page}</td><td class="num">${fmtNum(r.loads)}</td></tr>`).join('')}
      </table>
      ${(maps30d?.results ?? []).length > 0 ? `
      <details style="margin-top:12px;"><summary style="cursor:pointer;color:#8b949e;font-size:13px;">Daily breakdown (30d)</summary>
      <table style="margin-top:8px;">
        <tr><th>Date</th><th class="num">Loads</th></tr>
        ${((maps30d?.results ?? []) as any[]).map((r: any) => `<tr><td>${r.day}</td><td class="num">${fmtNum(r.loads)}</td></tr>`).join('')}
      </table></details>` : ''}
    </div>`;
    } catch {
      // maps_page_views table may not exist yet — skip section silently
    }

    // Return JSON if requested
    if (format === 'json') {
      const stats = {
        last24h: { calls: today?.calls ?? 0, inputTokens: today?.input_tokens ?? 0, outputTokens: today?.output_tokens ?? 0, cost: estimateCost(today?.input_tokens ?? 0, today?.output_tokens ?? 0) },
        last7Days: (last7?.results ?? []).map((r: any) => ({ day: r.day, calls: r.calls, generates: r.generates, chats: r.chats, cacheHits: r.cache_hits, inputTokens: r.input_tokens, outputTokens: r.output_tokens, cost: estimateCost(r.input_tokens, r.output_tokens) })),
        last30Days: (last30?.results ?? []).map((r: any) => ({ day: r.day, calls: r.calls, generates: r.generates, chats: r.chats, cacheHits: r.cache_hits, inputTokens: r.input_tokens, outputTokens: r.output_tokens, cost: estimateCost(r.input_tokens, r.output_tokens) })),
        allTime: { calls: allTime?.calls ?? 0, inputTokens: allTime?.input_tokens ?? 0, outputTokens: allTime?.output_tokens ?? 0, cost: estimateCost(allTime?.input_tokens ?? 0, allTime?.output_tokens ?? 0) },
      };
      return new Response(JSON.stringify(stats, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // --- Build HTML dashboard ---
    const todayCalls = today?.calls ?? 0;
    const todayIn = today?.input_tokens ?? 0;
    const todayOut = today?.output_tokens ?? 0;
    const todayCost = estimateCost(todayIn, todayOut);

    const allCalls = allTime?.calls ?? 0;
    const allIn = allTime?.input_tokens ?? 0;
    const allOut = allTime?.output_tokens ?? 0;
    const allCost = estimateCost(allIn, allOut);
    const firstEvent = allTime?.first_event ?? '—';

    // 7-day totals
    const d7 = (last7?.results ?? []) as any[];
    const d7Calls = d7.reduce((s: number, r: any) => s + r.calls, 0);
    const d7In = d7.reduce((s: number, r: any) => s + r.input_tokens, 0);
    const d7Out = d7.reduce((s: number, r: any) => s + r.output_tokens, 0);
    const d7Cost = estimateCost(d7In, d7Out);
    const d7Generates = d7.reduce((s: number, r: any) => s + r.generates, 0);
    const d7Chats = d7.reduce((s: number, r: any) => s + r.chats, 0);
    const d7Cache = d7.reduce((s: number, r: any) => s + r.cache_hits, 0);

    // 30-day totals
    const d30 = (last30?.results ?? []) as any[];
    const d30Calls = d30.reduce((s: number, r: any) => s + r.calls, 0);
    const d30In = d30.reduce((s: number, r: any) => s + r.input_tokens, 0);
    const d30Out = d30.reduce((s: number, r: any) => s + r.output_tokens, 0);
    const d30Cost = estimateCost(d30In, d30Out);

    // Last 24h by type map
    const todayTypeMap: Record<string, any> = {};
    for (const r of (todayByType?.results ?? []) as any[]) {
      todayTypeMap[r.event_type] = r;
    }

    // Cache hit rate (30 day)
    const type30Map: Record<string, any> = {};
    for (const r of (byType30?.results ?? []) as any[]) {
      type30Map[r.event_type] = r;
    }
    const totalGenerateAndCache = (type30Map['generate']?.calls ?? 0) + (type30Map['cache_hit']?.calls ?? 0);
    const cacheRate = totalGenerateAndCache > 0 ? ((type30Map['cache_hit']?.calls ?? 0) / totalGenerateAndCache * 100).toFixed(0) : '0';

    // AI calls only (generate + chat, no cache hits)
    const aiCalls30 = (type30Map['generate']?.calls ?? 0) + (type30Map['chat']?.calls ?? 0);

    // Average cost per AI call
    const avgCostPerCall = aiCalls30 > 0 ? d30Cost / aiCalls30 : 0;

    // Monthly run rate
    const daysWithData = d30.length || 1;
    const monthlyRate = (d30Cost / daysWithData) * 30;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Usage Dashboard — Discover Vietnam</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #e1e4e8; min-height: 100vh; }
  .header { background: linear-gradient(135deg, #0D7377, #095456); padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 20px; font-weight: 600; color: #fff; }
  .header .meta { font-size: 13px; color: rgba(255,255,255,0.7); }
  .container { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }

  /* Summary cards */
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; }
  .card .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #8b949e; margin-bottom: 8px; }
  .card .value { font-size: 28px; font-weight: 700; color: #fff; }
  .card .sub { font-size: 13px; color: #8b949e; margin-top: 4px; }
  .card.highlight { border-color: #0D7377; background: linear-gradient(135deg, rgba(13,115,119,0.15), rgba(9,84,86,0.1)); }
  .card.warn { border-color: #d29922; }

  /* Sections */
  .section { margin-bottom: 32px; }
  .section h2 { font-size: 16px; font-weight: 600; color: #c9d1d9; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #21262d; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8b949e; border-bottom: 2px solid #21262d; font-weight: 600; }
  td { padding: 10px 12px; border-bottom: 1px solid #21262d; }
  tr:hover td { background: rgba(13,115,119,0.06); }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .cost { color: #3fb950; font-weight: 600; }
  .muted { color: #8b949e; }
  .totals-row td { border-top: 2px solid #30363d; font-weight: 700; color: #fff; background: rgba(255,255,255,0.03); }

  /* Destination pills */
  .dest-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .dest-pill { background: #21262d; border-radius: 4px; padding: 2px 8px; font-size: 12px; color: #c9d1d9; }

  /* Bar chart simple */
  .bar-wrap { display: flex; align-items: center; gap: 8px; }
  .bar { height: 8px; border-radius: 4px; background: #0D7377; min-width: 2px; }
  .bar.cache { background: #8b949e; }
  .bar.chat { background: #d29922; }

  /* Split layout */
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .split .section { margin-bottom: 0; }

  /* Responsive */
  @media (max-width: 900px) {
    .split { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .cards { grid-template-columns: 1fr 1fr; }
    .card .value { font-size: 22px; }
    .header { padding: 16px; }
    .container { padding: 16px 12px; }
    table { font-size: 13px; }
    th, td { padding: 8px 6px; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>AI Usage Dashboard</h1>
    <div class="meta">Discover Vietnam &middot; Claude Haiku 4.5</div>
  </div>
  <div class="meta" style="text-align:right">
    Tracking since ${firstEvent !== '—' ? firstEvent.split('T')[0] : '—'}
  </div>
</div>

<div class="container">

  <!-- KPIs: AI (left) + Maps (right) -->
  <div class="split">
    <div class="section">
      <h2>Claude AI (Haiku 4.5)</h2>
      <div class="cards" style="grid-template-columns:1fr 1fr;margin-bottom:16px;">
        <div class="card highlight">
          <div class="label">Last 24h</div>
          <div class="value">${fmtCost(todayCost)}</div>
          <div class="sub">${fmtNum(todayCalls)} calls &middot; ${fmtTokens(todayIn + todayOut)} tokens</div>
        </div>
        <div class="card">
          <div class="label">Last 7 Days</div>
          <div class="value">${fmtCost(d7Cost)}</div>
          <div class="sub">${fmtNum(d7Calls)} calls</div>
        </div>
        <div class="card">
          <div class="label">Last 30 Days</div>
          <div class="value">${fmtCost(d30Cost)}</div>
          <div class="sub">${fmtNum(d30Calls)} calls &middot; ${fmtTokens(d30In + d30Out)} tokens</div>
        </div>
        <div class="card">
          <div class="label">All Time</div>
          <div class="value">${fmtCost(allCost)}</div>
          <div class="sub">${fmtNum(allCalls)} calls</div>
        </div>
        <div class="card">
          <div class="label">Cache Hit Rate</div>
          <div class="value">${cacheRate}%</div>
          <div class="sub">of generate requests (30d)</div>
        </div>
        <div class="card ${monthlyRate > 10 ? 'warn' : ''}">
          <div class="label">Monthly Run Rate</div>
          <div class="value">${fmtCost(monthlyRate)}</div>
          <div class="sub">${fmtCost(avgCostPerCall)} avg/call</div>
        </div>
        <div class="card">
          <div class="label">Rate Limits (24h)</div>
          <div class="value">${fmtNum(rateLimitHits?.count ?? 0)}</div>
          <div class="sub">blocked requests</div>
        </div>
        <div class="card">
          <div class="label">Unique Users</div>
          <div class="value">${fmtNum(uniqueUsers?.unique_ips ?? 0)}</div>
          <div class="sub">last 30 days</div>
        </div>
      </div>
      <table>
        <tr><th>Type</th><th class="num">Calls</th><th class="num">Input</th><th class="num">Output</th><th class="num">Cost</th></tr>
        ${['generate', 'chat', 'cache_hit'].map(t => {
          const r = todayTypeMap[t];
          if (!r) return `<tr><td>${t}</td><td class="num muted">0</td><td class="num muted">0</td><td class="num muted">0</td><td class="num muted">$0</td></tr>`;
          return `<tr><td>${t}</td><td class="num">${fmtNum(r.calls)}</td><td class="num">${fmtNum(r.input_tokens)}</td><td class="num">${fmtNum(r.output_tokens)}</td><td class="num cost">${fmtCost(estimateCost(r.input_tokens, r.output_tokens))}</td></tr>`;
        }).join('')}
        <tr class="totals-row"><td>Total</td><td class="num">${fmtNum(todayCalls)}</td><td class="num">${fmtNum(todayIn)}</td><td class="num">${fmtNum(todayOut)}</td><td class="num cost">${fmtCost(todayCost)}</td></tr>
      </table>
      <h2 style="margin-top:20px;">User Tiers (30d)</h2>
      <table>
        <tr><th>Tier</th><th class="num">Calls</th><th class="num">Cost</th></tr>
        ${((byTier?.results ?? []) as any[]).map((r: any) => {
          return `<tr><td>${r.tier}</td><td class="num">${fmtNum(r.calls)}</td><td class="num cost">${fmtCost(estimateCost(r.input_tokens, r.output_tokens))}</td></tr>`;
        }).join('')}
      </table>
    </div>
    ${mapsHtml || '<div class="section"><h2>Google Maps</h2><p class="muted" style="padding:20px 0;">Maps tracking not yet available — deploy migration first.</p></div>'}
  </div>

  <!-- Last 7 days -->
  <div class="section">
    <h2>Last 7 Days</h2>
    <table>
      <tr><th>Date</th><th class="num">Total</th><th class="num">Generate</th><th class="num">Chat</th><th class="num">Cache</th><th class="num">Tokens</th><th class="num">Cost</th><th style="width:120px">Mix</th></tr>
      ${d7.map((r: any) => {
        const cost = estimateCost(r.input_tokens, r.output_tokens);
        const maxCalls = Math.max(...d7.map((x: any) => x.calls), 1);
        const genW = Math.round((r.generates / maxCalls) * 100);
        const chatW = Math.round((r.chats / maxCalls) * 100);
        const cacheW = Math.round((r.cache_hits / maxCalls) * 100);
        return `<tr>
          <td>${r.day}</td>
          <td class="num">${fmtNum(r.calls)}</td>
          <td class="num">${r.generates || '<span class="muted">0</span>'}</td>
          <td class="num">${r.chats || '<span class="muted">0</span>'}</td>
          <td class="num">${r.cache_hits || '<span class="muted">0</span>'}</td>
          <td class="num">${fmtTokens(r.input_tokens + r.output_tokens)}</td>
          <td class="num cost">${fmtCost(cost)}</td>
          <td><div class="bar-wrap"><div class="bar" style="width:${genW}%"></div><div class="bar chat" style="width:${chatW}%"></div><div class="bar cache" style="width:${cacheW}%"></div></div></td>
        </tr>`;
      }).join('')}
      <tr class="totals-row">
        <td>Total</td><td class="num">${fmtNum(d7Calls)}</td>
        <td class="num">${fmtNum(d7Generates)}</td><td class="num">${fmtNum(d7Chats)}</td><td class="num">${fmtNum(d7Cache)}</td>
        <td class="num">${fmtTokens(d7In + d7Out)}</td><td class="num cost">${fmtCost(d7Cost)}</td><td></td>
      </tr>
    </table>
  </div>

  <!-- Last 30 days -->
  <div class="section">
    <h2>Last 30 Days</h2>
    <table>
      <tr><th>Date</th><th class="num">Total</th><th class="num">Generate</th><th class="num">Chat</th><th class="num">Cache</th><th class="num">Tokens</th><th class="num">Cost</th></tr>
      ${d30.map((r: any) => {
        const cost = estimateCost(r.input_tokens, r.output_tokens);
        return `<tr>
          <td>${r.day}</td>
          <td class="num">${fmtNum(r.calls)}</td>
          <td class="num">${r.generates || '<span class="muted">0</span>'}</td>
          <td class="num">${r.chats || '<span class="muted">0</span>'}</td>
          <td class="num">${r.cache_hits || '<span class="muted">0</span>'}</td>
          <td class="num">${fmtTokens(r.input_tokens + r.output_tokens)}</td>
          <td class="num cost">${fmtCost(cost)}</td>
        </tr>`;
      }).join('')}
      <tr class="totals-row">
        <td>Total</td><td class="num">${fmtNum(d30Calls)}</td>
        <td class="num">${d30.reduce((s: number, r: any) => s + r.generates, 0)}</td>
        <td class="num">${d30.reduce((s: number, r: any) => s + r.chats, 0)}</td>
        <td class="num">${d30.reduce((s: number, r: any) => s + r.cache_hits, 0)}</td>
        <td class="num">${fmtTokens(d30In + d30Out)}</td><td class="num cost">${fmtCost(d30Cost)}</td>
      </tr>
    </table>
  </div>

  <!-- Top destinations -->
  <div class="section">
    <h2>Top Destinations (30 Days)</h2>
    <table>
      <tr><th>Destinations</th><th class="num">Requests</th><th class="num">Tokens</th><th class="num">Cost</th><th style="width:200px">Volume</th></tr>
      ${((topDests?.results ?? []) as any[]).map((r: any) => {
        const maxD = Math.max(...(topDests?.results ?? []).map((x: any) => x.calls), 1);
        const barW = Math.round((r.calls / maxD) * 100);
        const cost = estimateCost(r.input_tokens, r.output_tokens);
        return `<tr>
          <td><div class="dest-list">${r.destinations.split(',').map((d: string) => `<span class="dest-pill">${d.trim()}</span>`).join('')}</div></td>
          <td class="num">${fmtNum(r.calls)}</td>
          <td class="num">${fmtTokens(r.input_tokens + r.output_tokens)}</td>
          <td class="num cost">${fmtCost(cost)}</td>
          <td><div class="bar-wrap"><div class="bar" style="width:${barW}%"></div></div></td>
        </tr>`;
      }).join('')}
    </table>
  </div>

  <div style="text-align:center; padding: 24px; color: #484f58; font-size: 12px;">
    Claude Haiku 4.5 &middot; Input $0.80/M &middot; Output $4.00/M &middot; <a href="?key=${key}&format=json" style="color:#0D7377">JSON</a>
  </div>

</div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    return new Response(`Error: ${err.message || 'Query failed'}`, { status: 500 });
  }
}
