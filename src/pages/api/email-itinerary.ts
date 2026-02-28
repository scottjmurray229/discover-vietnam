export const prerender = false;

import type { APIContext } from 'astro';
import { signEmailCookie } from '../../lib/email-cookie';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface DayItem {
  time: string;
  description: string;
  pricePhp?: number;
  priceUsd?: number;
  category: string;
  affiliateType?: string | null;
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
  totalBudget?: { php: number; usd: number };
  days: Day[];
}

const DEST_NAMES: Record<string, string> = {
  'hanoi': 'Hanoi', 'ho-chi-minh-city': 'Ho Chi Minh City', 'da-nang': 'Da Nang',
  'hoi-an': 'Hoi An', 'hue': 'Hue', 'ha-long-bay': 'Ha Long Bay',
  'sapa': 'Sapa', 'nha-trang': 'Nha Trang', 'phu-quoc': 'Phu Quoc',
  'dalat': 'Dalat', 'ninh-binh': 'Ninh Binh', 'mui-ne': 'Mui Ne',
  'can-tho': 'Can Tho', 'phong-nha': 'Phong Nha',
};

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface TripParams {
  checkin?: string;
  checkout?: string;
  adults?: number;
  children?: number;
}

function buildAffiliateUrl(type: string | null | undefined, destination: string, description: string, tp?: TripParams): string {
  const destName = DEST_NAMES[destination] || destination.replace(/-/g, ' ');
  const enc = encodeURIComponent;
  if (type === 'hotel') {
    // Extract hotel name from description (text before "or similar", comma, period, or dash)
    const hotelName = description.split(/\s+or\s+similar|[.,—]/)[0].replace(/^check\s*into\s*/i, '').trim();
    const query = hotelName ? hotelName + ' ' + destName : destName + ' Vietnam';
    let url = `https://www.booking.com/searchresults.html?ss=${enc(query)}&aid=2778866&label=discovervietnam`;
    if (tp?.checkin) url += `&checkin=${tp.checkin}&checkout=${tp.checkout}`;
    url += `&group_adults=${tp?.adults || 2}&no_rooms=1`;
    if (tp?.children) url += `&group_children=${tp.children}`;
    return url;
  }
  if (type === 'tour') {
    const query = destName + ' ' + description.split(/[.,—]/)[0].trim().slice(0, 40);
    return `https://www.klook.com/en-PH/search/result/?query=${enc(query)}&aid=112015&sub_id=discovervietnam`;
  }
  if (type === 'transport') {
    return `https://www.klook.com/en-PH/search/result/?query=${enc(destName + ' transport transfer')}&aid=112015&sub_id=discovervietnam`;
  }
  return `https://www.klook.com/en-PH/search/result/?query=${enc(destName)}&aid=112015&sub_id=discovervietnam`;
}

function buildHotelsComUrl(destination: string, description: string): string {
  const destName = DEST_NAMES[destination] || destination.replace(/-/g, ' ');
  const hotelName = description.split(/\s+or\s+similar|[.,—]/)[0].replace(/^check\s*into\s*/i, '').trim();
  const query = hotelName || destName;
  const landingPage = encodeURIComponent(`https://www.hotels.com/Hotel-Search?destination=${encodeURIComponent(query + ' Vietnam')}`);
  return `https://hotels.com/affiliate?landingPage=${landingPage}&camref=1101l5Eohj&creativeref=1011l66481&adref=email-itinerary`;
}

const CATEGORY_ICONS: Record<string, string> = {
  transport: '&#128656;', accommodation: '&#127976;', activity: '&#127940;',
  food: '&#127860;', ferry: '&#9972;',
};

function buildItineraryEmail(it: Itinerary, tp?: TripParams): string {
  let daysHtml = '';

  for (const day of it.days) {
    let itemsHtml = '';
    let dayPhp = 0;
    let dayUsd = 0;

    for (const item of day.items) {
      const icon = CATEGORY_ICONS[item.category] || '';
      let priceStr = '';
      if (item.pricePhp) {
        dayPhp += item.pricePhp;
        if (item.priceUsd) dayUsd += item.priceUsd;
        priceStr = ` — ₫${item.pricePhp.toLocaleString()}`;
        if (item.priceUsd) priceStr += ` (~$${item.priceUsd} USD)`;
      }

      let bookLink = '';
      if (item.affiliateSlotId && item.affiliateType) {
        const url = buildAffiliateUrl(item.affiliateType, day.destination, item.description, tp);
        if (item.affiliateType === 'hotel') {
          const hotelsComUrl = buildHotelsComUrl(day.destination, item.description);
          bookLink = ` <a href="${esc(url)}" style="display:inline-block;font-size:12px;font-weight:600;color:#0D7377;text-decoration:none;border:1px solid #0D7377;padding:2px 10px;border-radius:100px;margin-left:4px;white-space:nowrap;">Booking.com &rarr;</a> <a href="${esc(hotelsComUrl)}" style="display:inline-block;font-size:12px;font-weight:600;color:#E8654A;text-decoration:none;border:1px solid #E8654A;padding:2px 10px;border-radius:100px;margin-left:4px;white-space:nowrap;">Hotels.com &rarr;</a>`;
        } else {
          const label = item.affiliateType === 'tour' ? 'Book Tour' : item.affiliateType === 'transport' ? 'Book Transport' : 'Book This';
          bookLink = ` <a href="${esc(url)}" style="display:inline-block;font-size:12px;font-weight:600;color:#0D7377;text-decoration:none;border:1px solid #0D7377;padding:2px 10px;border-radius:100px;margin-left:4px;white-space:nowrap;">${label} &rarr;</a>`;
        }
      }

      itemsHtml += `
        <tr>
          <td style="padding:6px 8px 6px 0;vertical-align:top;width:24px;font-size:14px;">${icon}</td>
          <td style="padding:6px 0;vertical-align:top;">
            <span style="font-size:12px;font-weight:600;color:#0D7377;">${esc(item.time)}</span><br>
            <span style="font-size:14px;color:#4A5568;line-height:1.5;">${esc(item.description)}${priceStr ? `<span style="display:inline-block;background:#F5F0E8;padding:1px 6px;border-radius:100px;font-size:12px;font-weight:600;color:#1A2332;margin-left:4px;">${priceStr}</span>` : ''}${bookLink}</span>
          </td>
        </tr>`;
    }

    const subtotalHtml = dayPhp > 0 ? `<tr><td colspan="2" style="text-align:right;font-size:12px;font-weight:600;color:#1A2332;padding-top:8px;border-top:1px solid #EBE4D8;">Day total: ₫${dayPhp.toLocaleString()} (~$${dayUsd} USD)</td></tr>` : '';

    daysHtml += `
      <div style="background:white;border-radius:12px;padding:20px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#E8654A;margin-bottom:4px;">Day ${day.dayNumber}</div>
        <div style="font-size:16px;font-weight:700;color:#1A2332;margin-bottom:12px;">${esc(day.title)}</div>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">${itemsHtml}${subtotalHtml}</table>
      </div>`;
  }

  const budgetHtml = it.totalBudget ? `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#E8F4F5;border-radius:10px;padding:12px 20px;margin-bottom:20px;">
      <span style="font-size:14px;font-weight:600;color:#0D7377;">Estimated Total</span>
      <span style="font-size:16px;font-weight:800;color:#1A2332;">₫${it.totalBudget.php?.toLocaleString() || '—'} <span style="font-size:13px;font-weight:400;color:#0D7377;">(~$${it.totalBudget.usd?.toLocaleString() || '—'} USD)</span></span>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0D7377,#14B8A6);border-radius:16px 16px 0 0;padding:28px 24px;text-align:center;">
      <h1 style="color:white;font-size:22px;margin:0 0 6px;">Your Vietnam Itinerary</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">${esc(it.subtitle)}</p>
    </div>

    <!-- Body -->
    <div style="background:#F5F0E8;border-radius:0 0 16px 16px;padding:24px 20px;">
      <h2 style="font-size:18px;color:#1A2332;margin:0 0 16px;text-align:center;">${esc(it.title)}</h2>
      ${budgetHtml}
      ${daysHtml}

      <!-- CTA -->
      <div style="text-align:center;padding:24px 0 16px;">
        <a href="https://discovervietnam.info/plan/" style="display:inline-block;background:#E8654A;color:white;padding:14px 32px;border-radius:100px;text-decoration:none;font-weight:700;font-size:15px;">Generate Another Itinerary</a>
      </div>

      <p style="font-size:12px;color:#94A3B8;text-align:center;line-height:1.5;margin:0;">
        Generated by <a href="https://discovervietnam.info/" style="color:#0D7377;text-decoration:none;">Discover Vietnam</a> AI Trip Planner<br>
        Real prices &middot; Real experience &middot; 20+ trips since 2003
      </p>
    </div>

    <!-- Footer -->
    <p style="color:#94A3B8;font-size:11px;text-align:center;margin:16px 0 0;line-height:1.5;">
      <a href="https://discovervietnam.info/legal/privacy/" style="color:#94A3B8;">Privacy Policy</a> &middot;
      <a href="https://discovervietnam.info/legal/affiliate-disclosure/" style="color:#94A3B8;">Affiliate Disclosure</a>
    </p>
  </div>
</body>
</html>`;
}

function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

export async function POST(context: APIContext): Promise<Response> {
  const { locals, request } = context;
  const env = (locals as any).runtime?.env;

  let body: { email?: string; itinerary?: Itinerary; tripParams?: TripParams };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ success: false, error: 'Please enter a valid email.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const it = body.itinerary;
  if (!it?.title || !it?.days?.length) {
    return new Response(JSON.stringify({ success: false, error: 'No itinerary to send.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Rate limit email sends (max 5 per IP per hour to prevent Resend abuse) ---
  if (env?.DB) {
    try {
      const ip = getClientIP(request);
      const result = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM rate_limits WHERE ip = ? AND created_at > datetime('now', '-1 hour') AND has_email = 2`
      ).bind(ip).first() as any;
      const emailCount = result?.count || 0;
      if (emailCount >= 5) {
        return new Response(JSON.stringify({ success: false, error: 'Too many email requests. Please try again later.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Record email send (use has_email=2 as a marker for email-type rate limits)
      await env.DB.prepare(
        `INSERT INTO rate_limits (ip, has_email) VALUES (?, 2)`
      ).bind(ip).run();
    } catch {
      // D1 error — allow the email to proceed rather than block the user
    }
  }

  const resendKey = env?.RESEND_API_KEY;
  if (!resendKey) {
    // Dev mode — log and succeed
    console.log('[Email Itinerary - Dev Mode]', { email, title: it.title });
    return new Response(JSON.stringify({ success: true, dev: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const html = buildItineraryEmail(it, body.tripParams);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Discover Vietnam <hello@discovervietnam.info>',
        to: [email],
        subject: `Your Vietnam Itinerary: ${it.title}`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Resend Error]', res.status, text);
      return new Response(JSON.stringify({ success: false, error: 'Failed to send email. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Also save subscriber if DB available
    if (env?.DB) {
      try {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO email_subscribers (email, destinations_interested) VALUES (?, ?)`
        ).bind(email, it.days.map((d: Day) => d.destination).join(',')).run();
      } catch {
        // Non-fatal
      }
    }

    const cookieSecret = env?.COOKIE_SECRET;
    const setCookie = cookieSecret
      ? await signEmailCookie(cookieSecret)
      : 'dv_email=1; Path=/; Max-Age=2592000; SameSite=Lax';

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setCookie,
      },
    });
  } catch (err: any) {
    console.error('[Email Itinerary Error]', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to send email.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
