# AI Trip Planner — Product Specification

## Architecture

Three-layer system:
1. **Knowledge Base** — Curated Markdown in Cloudflare D1 (destination data, pricing, transport, WWII sites, snorkeling spots, ferry connections)
2. **LLM Layer** — Claude Sonnet via Cloudflare Worker for natural language itinerary generation
3. **Post-Processing** — Affiliate link injection + email gate + PDF delivery

## User Input Flow

### Step 1: Core Inputs (Required)

| Input | Type | Options | Default |
|-------|------|---------|---------|
| Destinations | Multi-select chips + search | All 26 published destinations. Min 1, max 5. | None (required) |
| Travel Dates | Date range picker | Must be future. Triggers festival detection. | Next month |
| Trip Duration | Dropdown | 3, 5, 7, 10, 14 days, Custom | 7 days |
| Budget Level | 3-option selector | Budget ($30–50/day) \| Mid ($80–150) \| Luxury ($200+) | Mid |
| Travel Style | Multi-select chips | Adventure, Culture, Beach, Food, Nightlife, Family, Romance | None (optional) |

### Step 2: Enhanced Inputs (Optional, Progressive Disclosure)

| Input | Type | Options | Impact on Itinerary |
|-------|------|---------|-------------------|
| Include Festivals? | Toggle | On/Off (auto-detects overlapping) | Adds festival day plan + logistics |
| Food Priority | Slider | Casual > Foodie > Culinary Deep-Dive | Adjusts restaurant count, adds cooking classes |
| Group Composition | Dropdown | Solo, Couple, Friends, Family w/ Kids, Large Group | Activity suitability filtering |
| Accommodation Pref | Dropdown | Hostel, Hotel, Resort, Airbnb, Mix | Affiliate link selection |
| Special Interests | Checkboxes | Diving, Surfing, Photography, History, Wellness | Adds specialized activities |
| Heritage Interest | Toggle | WWII sites, historical landmarks, memorial visits | Adds heritage day trips, links to /history/ pages |
| Snorkeling Priority | Slider | Casual > Dedicated > Snorkeling-focused trip | Adjusts water activity mix, links to snorkeling pillar |

## Unit Economics

| Metric | Value |
|--------|-------|
| Claude Sonnet Input | ~2,000 tokens |
| Claude Sonnet Output | ~3,000 tokens |
| API Cost per Itinerary | $0.03 |
| Affiliate Links per Itinerary | 5–8 (2–3 hotels + 2–3 tours + 1–2 food) |
| Revenue per Itinerary | $0.50–$2.00 |
| ROI per Itinerary | 17x–67x |
| Email Capture Rate | 20–40% (full itinerary gated behind email) |

## Cost Safeguards

| Scale | Itineraries/Day | Monthly Cost | Action |
|-------|----------------|-------------|--------|
| Month 3–6 | 5–10 | $4.50–$9.00 | Monitor only |
| Month 6–12 | 20–50 | $18–$45 | Rate limit 200/day |
| Viral Spike | 500+ | $450+ | Hard cap 500/day. Waitlist. |
| Abuse | 1,000+ (bots) | $900+ | Block. IP ban. Email verify. |

## MVP Scope (Step 9.5 in Roadmap)

Build AFTER destination pages, BEFORE video editing:
- Basic form with core inputs only (no progressive disclosure yet)
- Cloudflare Worker calling Claude Sonnet API
- Simple itinerary display (no PDF, no email gate, no D1, no affiliates initially)
- Iterate from there
