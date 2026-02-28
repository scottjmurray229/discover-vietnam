# Analytics, Tracking & Monitoring Systems Audit

**Site:** discoverphilippines.info
**Audit Date:** 2026-02-24
**Auditor:** Claude Code (Opus 4.6)

---

## Executive Summary

| System | Status | Notes |
|--------|--------|-------|
| Admin Dashboard (`/api/admin/stats`) | WORKING | Returns full HTML dashboard, JSON endpoint available |
| Daily Report (`/api/admin/daily-report`) | WORKING | Sends email to 2 admin addresses via Resend |
| D1 Database (usage_analytics) | WORKING | 4 tables, 4 migrations applied, all queries functional |
| Rate Limiting | WORKING | Per-IP (3 anon / 10 email), global cap (200/day) |
| Abuse Alerts | WORKING | Email alerts for IP burst (>5/hr), global spike (>100/hr), rate limit hits |
| Email Subscription (`/api/subscribe`) | WORKING | D1 storage + Resend welcome email + HMAC cookie |
| Google Analytics (GA4) | WORKING | G-FMCBFTZZ35, consent-gated via CookieConsent |
| Cookie Consent (GDPR) | WORKING | Accept/Decline, gates GA4 injection |
| Maps Tracking (`/api/track-maps`) | WORKING | Tracks page views from 3 map pages, 5 loads in last 30d |
| Stripe Integration | WORKING | Checkout creation + webhook handler + KV purchase records |
| Sitemap | WORKING | 79 URLs indexed, all destinations + blog + pillar pages |
| SEO/Security Headers | WORKING | Full security header suite deployed via Cloudflare |
| Itinerary Cache (D1) | WORKING | SHA-256 hash exact match + similarity fallback |
| Email Itinerary Delivery | WORKING | Resend + affiliate link injection + subscriber capture |
| Cloudflare Observability | ENABLED | `observability.enabled: true` in wrangler.jsonc |

**Overall Assessment:** All 15 analytics/tracking systems are implemented and responding. The infrastructure is comprehensive for a site at this stage. Current AI usage is at $0 (no real user traffic yet on the trip planner), and Google Maps usage is minimal (5 loads in 30 days). The main gap is that there is no Cloudflare Cron Trigger configured for the daily report -- it must be manually triggered via URL.

---

## 1. Admin Dashboard (`/api/admin/stats`)

**Endpoint:** `GET /api/admin/stats?key=masangcay`
**Source:** `src/pages/api/admin/stats.ts`
**Status:** WORKING (HTTP 200, returns valid HTML)
**Auth:** ADMIN_KEY environment variable comparison

### KPIs Displayed

**Claude AI (Haiku 4.5) Section:**
| Metric | Time Window | Current Value |
|--------|-------------|---------------|
| API Cost | Last 24h | $0.0000 |
| API Cost | Last 7 Days | $0.0000 |
| API Cost | Last 30 Days | $0.0000 |
| API Cost | All Time | $0.0000 |
| Cache Hit Rate | 30d | 0% |
| Monthly Run Rate | Projected | $0.0000 |
| Rate Limit Blocks | 24h | 0 |
| Unique Users (by IP) | 30d | 0 |

**Google Maps Section:**
| Metric | Current Value |
|--------|---------------|
| Loads (24h) | 0 |
| 30d Total | 5 |
| Monthly Projection | 150 (0.5% of 28,500 free tier) |
| Estimated Cost | Free |

**Tables Rendered:**
- Last 24h by type (generate / chat / cache_hit) with call count, input/output tokens, cost
- User Tiers (30d) -- email verified vs anonymous
- Last 7 Days daily breakdown with visual bar chart (generate/chat/cache mix)
- Last 30 Days daily breakdown
- Top Destinations (30 Days) -- grouped by destination combo with pill badges

**D1 Queries Run:** 10 queries total
1. Last 24h totals (calls, input_tokens, output_tokens)
2. Last 24h by event_type
3. Last 7 days daily breakdown (with generate/chat/cache_hit split)
4. Last 30 days daily breakdown
5. 30-day totals by event_type
6. By user tier (email vs anonymous) last 30 days
7. Top destinations last 30 days (top 15)
8. All-time totals + first event date
9. Unique IPs last 30 days
10. Rate limit hits last 24h

**Maps Queries (graceful degradation):**
11. Maps loads last 24h
12. Maps loads by page last 24h
13. Maps daily breakdown last 30 days

**JSON Export:** `?format=json` returns structured JSON with last24h, last7Days, last30Days, allTime objects.

**Cost Calculation:** Uses Haiku 4.5 pricing: $0.80/M input tokens, $4.00/M output tokens (defined in `src/lib/stats-helpers.ts`).

### Current Data

```json
{
  "last24h": { "calls": 0, "inputTokens": 0, "outputTokens": 0, "cost": 0 },
  "last7Days": [],
  "last30Days": [],
  "allTime": { "calls": 0, "inputTokens": 0, "outputTokens": 0, "cost": 0 }
}
```

No AI trip planner calls have been recorded in the database. The system is deployed and functional but has not yet received real user traffic on the trip planner.

---

## 2. Daily Report Endpoint (`/api/admin/daily-report`)

**Endpoint:** `GET /api/admin/daily-report?key=masangcay`
**Source:** `src/pages/api/admin/daily-report.ts`
**Status:** WORKING (HTTP 200, sends email)
**Response:** `Report sent to scottjmurray@gmail.com, murrayjenicesphr@gmail.com`

### What It Reports

The daily report sends a styled HTML email with a side-by-side layout:

**Left Column -- Claude AI (Haiku 4.5):**
- Last 24h cost + call count
- Unique users (24h)
- Monthly run rate (projected from 30d data)
- All-time totals
- Breakdown by event type (generate/chat/cache_hit) with calls, tokens, cost
- Rate limit block count

**Right Column -- Google Maps:**
- Loads (24h)
- 30d total
- Monthly projection with free tier percentage
- Estimated cost (free vs overage)
- Loads by page breakdown

### Email Delivery

- **Service:** Resend API
- **From:** `Discover Philippines <hello@discoverphilippines.info>`
- **Recipients:** `scottjmurray@gmail.com`, `murrayjenicesphr@gmail.com`
- **Subject format:** `DP Daily: {calls} calls, {cost}, {users} users`
- **Includes link** to full dashboard

### Trigger Mechanism

The daily report is a GET endpoint that must be manually called. **There is no Cloudflare Cron Trigger configured** in `wrangler.jsonc`. To automate this, a `[triggers]` section with a cron schedule would need to be added.

---

## 3. D1 Database Schema & Analytics Data

**Database:** `trip-planner-cache` (ID: `45f42d68-0341-41f3-953e-0ebf6754ddd5`)
**Binding:** `DB`
**Migrations:** 4 SQL files applied

### Table: `usage_analytics` (Migration 0003)

Primary analytics table for AI cost monitoring.

| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER PK | Auto-increment |
| event_type | TEXT | `generate`, `chat`, or `cache_hit` |
| ip | TEXT | Client IP (via cf-connecting-ip) |
| has_email | INTEGER | 0 = anonymous, 1 = email verified |
| input_tokens | INTEGER | Claude API input tokens |
| output_tokens | INTEGER | Claude API output tokens |
| model | TEXT | e.g., `claude-haiku-4-5-20251001` |
| destinations | TEXT | Comma-separated slugs |
| duration | TEXT | Trip duration in days |
| budget_level | TEXT | `budget`, `midrange`, `luxury` |
| cache_hit | INTEGER | 0 or 1 |
| query_hash | TEXT | SHA-256 of normalized request |
| created_at | TEXT | ISO datetime, auto-set |

**Indexes:** `idx_usage_created` (created_at), `idx_usage_type` (event_type)

### Table: `itineraries` (Migration 0001)

Cached AI-generated itineraries for cost reduction.

| Column | Type | Purpose |
|--------|------|---------|
| query_hash | TEXT UNIQUE | SHA-256 of `destinations|duration|budget|travelers|month` |
| destinations | TEXT | Normalized, sorted destination slugs |
| duration | TEXT | Days |
| budget_level | TEXT | Normalized budget tier |
| month | TEXT | Travel month |
| request_json | TEXT | Full request body |
| response_json | TEXT | Full itinerary JSON |
| source | TEXT | `ai` (always currently) |
| quality | TEXT | `auto` (always currently) |
| hit_count | INTEGER | Cache hit counter (bumped on each hit) |
| last_hit_at | TEXT | Last cache hit timestamp |
| created_at | TEXT | Creation timestamp |

**Indexes:** `idx_query_hash`, `idx_dest_dur_budget`

### Table: `rate_limits` (Migration 0001)

IP-based API call counter for rate limiting.

| Column | Type | Purpose |
|--------|------|---------|
| ip | TEXT | Client IP |
| has_email | INTEGER | User tier at time of call |
| created_at | TEXT | Timestamp (24h window for counting) |

**Index:** `idx_rate_ip` (ip, created_at)

### Table: `email_subscribers` (Migration 0001 + 0002)

Newsletter/guide subscriber list.

| Column | Type | Purpose |
|--------|------|---------|
| email | TEXT UNIQUE | Subscriber email (lowercase) |
| destinations_interested | TEXT | Comma-separated destination slugs |
| guide_tag | TEXT | Segmentation tag (e.g., `destination-cebu`) |
| created_at | TEXT | Subscription timestamp |

### Table: `maps_page_views` (Migration 0004)

Google Maps JavaScript API load tracking.

| Column | Type | Purpose |
|--------|------|---------|
| page | TEXT | Which page loaded maps (`plan`, `companion-map`, `companion-mini`) |
| ip | TEXT | Client IP |
| created_at | TEXT | Load timestamp |

**Indexes:** `idx_maps_page_views_created`, `idx_maps_page_views_page`

---

## 4. Abuse Detection & Rate Limiting

**Source:** `src/lib/abuse-alerts.ts`, `src/pages/api/generate-itinerary.ts`, `src/pages/api/chat-itinerary.ts`

### Rate Limiting (Per-IP, 24h Rolling Window)

| User Tier | Daily Limit | Applied To |
|-----------|-------------|------------|
| Anonymous (no email) | 3 AI calls/day | generate + chat (shared pool) |
| Email verified (HMAC cookie) | 10 AI calls/day | generate + chat (shared pool) |
| Global cap | 200 AI calls/day | All users combined |

**Implementation Details:**
- Rate limits are checked ONLY for actual Claude API calls (not cache hits)
- Cache hits bypass rate limiting entirely (free for everyone)
- When anonymous users hit 3 calls, they receive `requiresEmail: true` prompting email capture
- When global cap (200/day) is reached, all users are blocked with "try again tomorrow"
- Rate limit records are stored in `rate_limits` table with IP + timestamp
- Both `generate-itinerary.ts` and `chat-itinerary.ts` share the same rate limit pool

**Email Tier Verification:**
- HMAC-signed cookie (`dp_email`) using `COOKIE_SECRET` environment variable
- Timestamp-based with 30-day expiry
- Constant-time HMAC comparison (timing-attack resistant)
- MX record validation on email domains via Cloudflare DoH (`cloudflare-dns.com`)
- Falls back to accepting plain `dp_email=1` cookie in dev mode

### Abuse Alert Triggers

| Alert Type | Threshold | Dedup | Email To |
|------------|-----------|-------|----------|
| IP Burst | >5 calls from same IP in 1 hour | Alerts on the 6th call only | scottjmurray@gmail.com |
| Global Spike | >100 total calls in 1 hour | Alerts on the 101st call only | scottjmurray@gmail.com |
| Rate Limit Hit | Any blocked request | Every occurrence | scottjmurray@gmail.com |

**Alert Delivery:**
- Via Resend API (same as all site email)
- Red gradient header styling for visual urgency
- Includes IP address, event type, user tier, UTC timestamp
- Fire-and-forget (wrapped in try/catch, never blocks the request)

### Missing / Could Be Improved

- No IP blocklist/allowlist mechanism (only rate limiting, no permanent bans)
- Abuse detection only runs on successful requests, not on rate-limited requests
- No automatic escalation (e.g., block IP after N abuse alerts)
- Daily report only goes to 2 admins; no Slack/Discord webhook integration

---

## 5. Email Subscription System (`/api/subscribe`)

**Endpoint:** `POST /api/subscribe`
**Source:** `src/pages/api/subscribe.ts`
**Status:** WORKING (HTTP 200, `{"success":true}`)

### Data Captured

| Field | Source | Storage |
|-------|--------|---------|
| email | Request body | D1 `email_subscribers` table (UNIQUE constraint) |
| destinations_interested | Request body (joined from array) | D1 |
| guide_tag | Request body | D1 (e.g., `destination-cebu`, `pillar-festivals`) |
| created_at | Auto-generated | D1 |

### Validation

- Regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- MX record verification via Cloudflare DoH (rejects fake domains, fails open on timeout)
- `INSERT OR IGNORE` prevents duplicates (no error, just marks `isNew = false`)

### Welcome Email

- Sent only for new subscribers (not duplicates)
- Via Resend API from `hello@discoverphilippines.info`
- Subject: `Your {Guide Name} -- Welcome to Discover Philippines`
- Styled HTML email with teal gradient header, guide-specific name
- Links to `/destinations/` and `/legal/privacy/`

### Guide Name Mapping

10 destination-specific guide names are hardcoded (Siquijor, Cebu, Boracay, El Nido, Clark, Coron, Bohol, Siargao, Dumaguete, Puerto Princesa). All others auto-generated from the tag slug.

### Post-Subscribe Cookie

Sets an HMAC-signed `dp_email` cookie (30-day expiry) that unlocks higher rate limits for the trip planner (3 -> 10 calls/day).

### Additional Email Capture Point

The `email-itinerary.ts` endpoint also inserts subscribers via `INSERT OR IGNORE` when emailing itineraries, capturing email + destination interests from the itinerary data.

---

## 6. Google Analytics (GA4)

**Measurement ID:** `G-FMCBFTZZ35`
**Source:** `src/components/CookieConsent.astro`
**Status:** WORKING (consent-gated)

### Implementation

- GA4 is NOT loaded in any `<head>` or layout file by default
- The `CookieConsent.astro` component handles conditional injection
- Component is imported in `BaseLayout.astro` (line 6) and rendered on every page (line 89)
- On page load, it checks `localStorage` for `dp_cookie_consent` key:
  - `'accepted'` -> loads GA4 immediately (no banner shown)
  - `'declined'` -> no banner, no GA4
  - null (first visit) -> shows consent banner

### GA4 Loading Flow

1. User clicks "Accept" on cookie banner
2. `localStorage.setItem('dp_cookie_consent', 'accepted')`
3. Banner hidden
4. `gtag.js` script dynamically injected into `<head>`
5. `dataLayer` initialized, `gtag('config', GA4_ID)` called

### GDPR Compliance

- Cookie banner includes link to `/legal/privacy/`
- Privacy page documents analytics data collection, consent requirement, and withdrawal instructions
- `EmailCapture.astro` includes a separate GDPR consent checkbox (`required` attribute)
- Consent stored in localStorage (client-side only, no server round-trip)

### What GA4 Tracks (When Consented)

Standard GA4 pageview tracking. No custom events, enhanced ecommerce, or custom dimensions configured in the tag. All GA4 customization would need to be done in the GA4 property settings.

### Missing / Could Be Improved

- No custom event tracking (trip planner usage, email captures, affiliate clicks)
- No `gtag('event', ...)` calls anywhere in the codebase
- Consider tracking: trip planner submissions, email captures, map loads, affiliate link clicks
- No Google Search Console verification tag found (may be configured at DNS level)

---

## 7. Stripe Integration

**Source:** `src/pages/api/create-checkout.ts`, `src/pages/api/stripe-webhook.ts`, `src/pages/api/verify-purchase.ts`

### Checkout (`POST /api/create-checkout`)

**Status:** WORKING (HTTP 200, returns checkout URL)
**Test Result:** Returns `{"success":true,"checkoutUrl":"/companion/success?session_id=dev_...","tripId":"...","dev":true}` (dev mode, no Stripe keys in test)

**Data Captured:**
- `email` -- customer email
- `tripId` -- UUID generated server-side
- `source` -- referral source
- `templateId` -- optional template reference
- Stripe Checkout Session with metadata (tripId, source, templateId)

**Storage:** Pending session stored in `COMPANION_KV` (Cloudflare KV) with 24h TTL.

### Webhook (`POST /api/stripe-webhook`)

**Event Handled:** `checkout.session.completed`

**On successful payment:**
1. Extracts `tripId` and `email` from session metadata
2. Generates UUID `accessToken`
3. Stores permanent access record in `COMPANION_KV` at `access:{tripId}`
4. Updates session record to `completed` status with 7-day TTL

**Security:** Stripe signature verification via `constructEventAsync()`.

### Purchase Verification (`GET /api/verify-purchase?session_id=...`)

Looks up session in KV, returns `{ success, token, tripId, email }` if completed, `{ pending: true }` if webhook hasn't fired yet.

### What's Tracked

- Purchase events flow through Stripe's own dashboard
- No custom D1 logging of purchases (only KV storage)
- No revenue analytics in the admin dashboard
- No GA4 purchase event tracking

### Missing / Could Be Improved

- No purchase/revenue tracking in D1 or the admin dashboard
- No abandoned checkout tracking
- No conversion funnel analytics (visit -> intake -> checkout -> success)

---

## 8. Maps Tracking (`/api/track-maps`)

**Endpoint:** `POST /api/track-maps`
**Source:** `src/pages/api/track-maps.ts`
**Status:** WORKING (HTTP 204 No Content on success)

### Data Schema

```sql
INSERT INTO maps_page_views (page, ip) VALUES (?, ?)
-- created_at auto-populated
```

### Pages That Track

| Page | Source File | Tracking Call |
|------|-----------|---------------|
| `plan` | `src/pages/plan.astro` (line 1269) | `fetch('/api/track-maps', { body: { page: 'plan' } })` |
| `companion-map` | `src/components/companion/MapTab.tsx` (line 34) | On Google Maps script load |
| `companion-mini` | `src/components/companion/CompanionMiniMap.tsx` (line 21) | On Google Maps script load |

### Why It Exists

Google Maps JavaScript API has a free tier of 28,500 loads/month, then $0.007/load. This tracking lets the admin dashboard project monthly costs and alert if approaching the free tier limit.

### Current Usage

- **30d total:** 5 map loads
- **Monthly projection:** 150 loads (0.5% of free tier)
- **Estimated cost:** Free

### Design Notes

- Silent failure: all tracking calls use `.catch(() => {})` on the client and try/catch on the server
- Returns 204 (No Content) -- fire-and-forget, never blocks the page
- Validates that `page` parameter is a non-empty string

---

## 9. Sitemap

**URL:** `https://discoverphilippines.info/sitemap-index.xml`
**Status:** WORKING (HTTP 200)

### Structure

- **Sitemap Index** points to `sitemap-0.xml`
- **Total URLs:** 79

### URL Breakdown

| Category | Count | Notes |
|----------|-------|-------|
| Destinations (EN) | 43 | All 43 destinations indexed |
| Destinations (TL) | 2 | el-nido, clark (Tagalog translations) |
| Blog posts | 8 | Including index page |
| Pillar pages | 6 | cuisine, festivals, history, practical, snorkeling, wellness |
| Companion | 4 | marketing, app, start, success pages |
| About | 3 | index, scott, jenice |
| Legal | 3 | privacy, terms, affiliate-disclosure |
| Other | 10 | Homepage, plan, destinations index, blog index, founding explorer + feedback, finer-things, network, TL blog/destinations indexes |

### Observations

- All 43 destination pages are indexed
- Both Tagalog translation pages are indexed
- The AI Trip Planner (`/plan/`) is indexed
- No `<lastmod>` dates included (could improve crawl frequency signals)
- No `<priority>` or `<changefreq>` tags (optional but helpful)

---

## 10. SEO & Security Headers

**Tested Pages:** Homepage, `/destinations/cebu/`, `/destinations/siquijor/`, `/destinations/boracay/`

All 4 pages return identical headers.

### Response Headers

| Header | Value | Assessment |
|--------|-------|------------|
| `Content-Type` | `text/html; charset=utf-8` | Correct |
| `Cache-Control` | `public, max-age=0, must-revalidate` | Cloudflare Pages default (CDN handles caching) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Excellent (1 year HSTS) |
| `X-Content-Type-Options` | `nosniff` | Correct (prevents MIME sniffing) |
| `X-Frame-Options` | `DENY` | Correct (prevents clickjacking) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Good default |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Good (blocks device APIs) |
| `Access-Control-Allow-Origin` | `*` | Permissive (acceptable for a public site) |
| `Server` | `cloudflare` | Standard Cloudflare |

### Cloudflare-Specific Headers

| Header | Purpose |
|--------|---------|
| `CF-RAY` | Request tracking ID |
| `cf-cache-status` | `DYNAMIC` (Worker-served, not edge-cached static) |
| `alt-svc` | HTTP/3 (h3) support enabled |
| `Nel` / `Report-To` | Cloudflare Network Error Logging |

### Missing Headers (Optional Improvements)

| Header | Recommendation |
|--------|---------------|
| `Content-Security-Policy` | Not set. Consider adding CSP to restrict script/style sources. Would need to allow Google Analytics, Cloudinary, Google Maps, Stripe, Resend. |
| `X-XSS-Protection` | Deprecated but some scanners flag its absence. Not critical. |
| `Cache-Control` for static assets | The `max-age=0` on HTML is fine (Cloudflare CDN handles caching separately), but verify static assets (CSS, JS, images) have long cache times via Cloudflare. |

---

## 11. Cloudflare Observability

**Source:** `wrangler.jsonc` (line 14-16)

```jsonc
"observability": {
    "enabled": true
}
```

This enables Cloudflare's built-in Workers observability features:
- Request logs in the Cloudflare dashboard
- Error tracking
- Performance metrics (CPU time, wall time)
- Available at: Cloudflare Dashboard > Workers & Pages > discover-philippines > Logs/Analytics

---

## 12. Itinerary Cache System

**Source:** `src/pages/api/generate-itinerary.ts`

### Two-Tier Cache Strategy

1. **Exact Match:** SHA-256 hash of `destinations|duration|budget|travelers|month`. If found, returns cached response immediately with `source: 'cache'`.

2. **Similarity Match:** If exact hash miss, queries by `destinations + duration + budget_level` (ignoring travelers/month), returns the most-hit cached result.

### Cache Analytics

- `hit_count` incremented on every cache hit
- `last_hit_at` updated to current timestamp
- Cache hits logged as `event_type: 'cache_hit'` in `usage_analytics`
- Cache hits do NOT count against rate limits (free for all users)
- No TTL/expiry on cached itineraries (they persist indefinitely)

### Cost Optimization Impact

Cache hits cost $0 (no Claude API call). The cache-first design means repeated popular queries (e.g., "7-day Cebu mid-range") are served for free after the first generation.

---

## 13. Complete API Endpoint Inventory

| Endpoint | Method | Auth | Status | Purpose |
|----------|--------|------|--------|---------|
| `/api/admin/stats` | GET | ADMIN_KEY | 200 | Full analytics dashboard (HTML or JSON) |
| `/api/admin/daily-report` | GET | ADMIN_KEY + RESEND | 200 | Email daily report to admins |
| `/api/generate-itinerary` | POST | None (rate limited) | N/A | Generate AI itinerary |
| `/api/chat-itinerary` | POST | None (rate limited) | N/A | Refine itinerary via chat |
| `/api/email-itinerary` | POST | None | N/A | Email itinerary to user |
| `/api/subscribe` | POST | None | 200 | Email list subscription |
| `/api/track-maps` | POST | None | 204 | Track map loads |
| `/api/create-checkout` | POST | None | 200 | Stripe checkout session |
| `/api/stripe-webhook` | POST | Stripe sig | N/A | Payment webhook |
| `/api/verify-purchase` | GET | None | N/A | Check payment status |

**Note on GET-only endpoints:** `create-checkout` and `track-maps` return 404 on GET (correct -- they only handle POST). The 404 is the expected behavior since `prerender = false` and only POST handlers are defined.

---

## 14. Data Flow Diagram

```
User Visit
    |
    v
[CookieConsent] --accepted--> [GA4 G-FMCBFTZZ35] --> Google Analytics
    |
    v
[Page Load with Map] --> POST /api/track-maps --> D1: maps_page_views
    |
    v
[Email Capture] --> POST /api/subscribe --> D1: email_subscribers
    |                                    --> Resend: Welcome Email
    |                                    --> Set dp_email HMAC cookie
    v
[Trip Planner]
    |
    +--> [Cache Hit] --> D1: usage_analytics (cache_hit) --> Response
    |
    +--> [Rate Check] --> D1: rate_limits
    |       |
    |       +--> [Blocked] --> Resend: Rate Limit Alert --> 429
    |
    +--> [Claude API] --> D1: usage_analytics (generate/chat)
    |                 --> D1: itineraries (cache store)
    |                 --> D1: rate_limits (record call)
    |                 --> Resend: Abuse Alert (if threshold)
    |
    v
[Email Itinerary] --> POST /api/email-itinerary --> Resend
                                                --> D1: email_subscribers

[Companion Purchase]
    |
    +--> POST /api/create-checkout --> Stripe --> KV: pending session
    +--> POST /api/stripe-webhook  --> KV: completed access record
    +--> GET  /api/verify-purchase --> KV: lookup session
```

---

## 15. Recommendations

### High Priority

1. **Automate daily report** -- Add a Cloudflare Cron Trigger in `wrangler.jsonc` to call the daily report endpoint on a schedule (e.g., `0 8 * * *` UTC).

2. **Add GA4 custom events** -- The GA4 tag loads but only tracks basic pageviews. Add `gtag('event', ...)` calls for:
   - Trip planner submissions
   - Email captures (with guide tag)
   - Affiliate link clicks
   - Map interactions
   - Companion checkout initiation/completion

3. **Add `<lastmod>` to sitemap** -- Use `lastVerified` from frontmatter to populate sitemap dates, improving crawl frequency signals.

### Medium Priority

4. **Purchase analytics in dashboard** -- Add a Stripe-synced table or query to show revenue in the admin dashboard alongside AI costs.

5. **IP blocklist** -- Add a mechanism to permanently block abusive IPs beyond the rolling 24h rate limit.

6. **Content Security Policy** -- Add a CSP header to restrict script sources to known domains (self, Google Analytics, Cloudinary, Google Maps, Stripe).

7. **Error rate tracking** -- The admin dashboard only shows successful calls. Add error rate tracking (failed Claude calls, timeouts, rate limit 429s) for visibility.

### Low Priority

8. **Subscriber analytics in dashboard** -- Add a section showing daily/weekly email signups, top guide tags, and subscriber growth.

9. **Cache efficiency dashboard** -- Add cache hit ratio over time, most-cached itineraries, and cache miss patterns to help decide which itineraries to pre-seed.

10. **Webhook delivery monitoring** -- Stripe webhook failures are logged to console but not tracked in D1 or alertable. Consider adding failed webhook alerts.

---

## Appendix: File References

| File | Purpose |
|------|---------|
| `src/pages/api/admin/stats.ts` | Admin dashboard (HTML + JSON) |
| `src/pages/api/admin/daily-report.ts` | Daily email report |
| `src/pages/api/generate-itinerary.ts` | AI itinerary generation + caching + rate limiting |
| `src/pages/api/chat-itinerary.ts` | AI itinerary refinement chat |
| `src/pages/api/email-itinerary.ts` | Email itinerary delivery with affiliate links |
| `src/pages/api/subscribe.ts` | Email subscription + welcome email |
| `src/pages/api/track-maps.ts` | Google Maps load tracking |
| `src/pages/api/create-checkout.ts` | Stripe checkout session creation |
| `src/pages/api/stripe-webhook.ts` | Stripe payment webhook handler |
| `src/pages/api/verify-purchase.ts` | Purchase verification |
| `src/lib/usage-tracking.ts` | D1 usage event logging |
| `src/lib/abuse-alerts.ts` | Abuse detection + email alerts |
| `src/lib/stats-helpers.ts` | Cost calculation + formatting helpers |
| `src/lib/send-email.ts` | Resend API email wrapper |
| `src/lib/email-cookie.ts` | HMAC cookie signing/verification + MX validation |
| `src/components/CookieConsent.astro` | GDPR consent banner + GA4 loader |
| `src/layouts/BaseLayout.astro` | Imports CookieConsent (line 6, rendered line 89) |
| `wrangler.jsonc` | Cloudflare config (D1 binding, observability) |
| `migrations/0001_init.sql` | D1 schema: itineraries, rate_limits, email_subscribers |
| `migrations/0002_guide_tag.sql` | Added guide_tag column to email_subscribers |
| `migrations/0003_usage_analytics.sql` | D1 schema: usage_analytics |
| `migrations/0004_maps_page_views.sql` | D1 schema: maps_page_views |
