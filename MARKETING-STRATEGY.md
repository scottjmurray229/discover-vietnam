# Discover Philippines — Gap Analysis & Weekly Marketing Strategy
**Generated: February 19, 2026**
**Source: Business & Marketing Plan v4, Content Bible v8, Marketing Promotion Plan, Git Workflow + full site audit**

---

## PART 1: GAP ANALYSIS — Plan vs. What's Actually Built

### SITE STRUCTURE & PAGES

| What Plan Called For | What's Built | Status |
|---------------------|-------------|--------|
| 26 core + 3 bonus = 29 destinations | **43 destinations**, all live, all `contentStatus: published` | EXCEEDED (+14) |
| 5 pillar hub pages | **5/5 built**: snorkeling (1,359 lines), festivals (1,323), cuisine (1,101), history (1,431), practical (754) | COMPLETE |
| 48 individual pillar sub-pages (13 WWII, 17 food, 12 festival, 6 practical) | None built — all content lives on hub pages | NOT STARTED |
| 67 blog posts | **5 published** (3 destination, 2 culture) | 7% |
| ~141 total content pages at full build | ~60 pages (43 dest + 5 blog + 5 pillar + about + legal + companion) | 43% |
| Author pages (/about/scott, /about/jenice) | Both built (589 & 586 lines) + team overview (876 lines) | COMPLETE |
| Homepage | Built with map, hero video, destination cards, EmailCapture | COMPLETE |
| 404 page | Built | COMPLETE |
| Legal pages (privacy, terms, affiliate disclosure) | All 3 built | COMPLETE |
| AI Trip Planner (`/plan/`) | Built with Claude API, map, full intake flow | COMPLETE |
| Trip Companion PWA (Phases 1-7) | Phases 1-5 done: marketing, intake, Stripe, 5-tab app, Claude AI chat | AHEAD OF PLAN |
| Founding Explorer program | `/founding-explorer/` + `/founding-explorer/feedback/` built | BONUS (not in plan) |
| Tagalog routes (`/tl/destinations/`, `/tl/blog/`) | Route infrastructure built, only 2 translations (el-nido, clark) | 5% content |
| WordPress 301 redirects (old URLs → Astro) | **Not verified** — plan says all old WP URLs should redirect | UNKNOWN |

### DESTINATION PAGE COMPLETENESS (All 43 Pages)

| Section/Feature | Coverage | Status |
|----------------|----------|--------|
| Hero video (dedicated per destination) | **43/43** | COMPLETE |
| Scott's Pro Tips block | **43/43** | COMPLETE |
| Immersive video breaks (inline HTML) | **43/43** (176 break clips total) | COMPLETE |
| FAQ items in frontmatter | **43/43** | COMPLETE |
| Related destinations | **43/43** | COMPLETE |
| EmailCapture (via DestinationLayout) | **43/43** (generic bullets, not destination-specific) | COMPLETE |
| Where to Stay | **29/43** (67%) | 14 MISSING |
| Where to Eat | **26/43** (60%) | 17 MISSING |
| affiliatePicks (Amazon gear links) | **22/43** (51%) | 21 MISSING |
| Trip Companion CTA ("Take this offline") | **0/43** | NOT STARTED |
| Interactive destination map | **0/43** (maps only on homepage, snorkeling, plan) | NOT STARTED |

**Missing Where to Stay (14):** batangas, biliran, bohol, cebu, donsol, el-nido, guimaras, iloilo, laguna, legazpi, manila, puerto-galera, samar, tacloban

**Missing Where to Eat (17):** bacolod, batangas, biliran, bohol, boracay, cebu, clark, donsol, el-nido, guimaras, iloilo, legazpi, manila, marinduque, mt-pulag, samar, tacloban

**Missing affiliatePicks (21):** baler, banaue, bataan, batanes, batangas, biliran, bohol, camiguin, caramoan, coron, cuyo, puerto-princesa, sagada, samar, siargao, sipalay, subic, tacloban, tagaytay, vigan, zambales

### COMPONENTS

| Component | Plan | Built | Status |
|-----------|------|-------|--------|
| FloatingNav.astro | Dual mobile/desktop nav | Built — 5-tab mobile bar, desktop top nav, Discover dropdown, language switcher, Trip Companion CTA | COMPLETE |
| Footer.astro | 3-column grid | Built — brand + EmailCapture, destinations, explore/legal + FTC disclosure | COMPLETE |
| EmailCapture.astro | Email form (Resend backend) | Built — used in 13+ locations (all layouts, all pillars, homepage, about pages) | COMPLETE |
| FAQ.astro | Accordion + FAQPage JSON-LD | Built | COMPLETE |
| SchemaMarkup.astro | JSON-LD for all page types | Built — rendered on every page via BaseLayout | COMPLETE |
| QuickFacts.astro | GEO-critical card | Built — SpeakableSpecification schema | COMPLETE |
| Breadcrumb.astro | BreadcrumbList JSON-LD | Built — used on pillar pages | COMPLETE |
| ImmersiveBreak.astro | Standalone component | Built — but destinations use inline `<div class="immersive-break-inline">` HTML instead | HYBRID |
| CompleteTripFooter.astro | Grouped affiliate section | Built — renders affiliatePicks from frontmatter | COMPLETE |
| OurPickCard.astro | Contextual affiliate card | Built | COMPLETE |
| FTCDisclosure.astro | Affiliate disclosure banner | Built | COMPLETE |
| CookieConsent.astro | GDPR consent + GA4 gating | Built — consent-gated analytics | COMPLETE |
| LanguageSwitcher.astro | EN/TL toggle | Built — in FloatingNav | COMPLETE |
| BlogLayout.astro | Article template | Built — byline, reading time, hero video, EmailCapture | COMPLETE |
| Video360Embed.astro | 360 video player | **Not built** | NOT STARTED |
| AudioMemoryPlayer.astro | Story Recorder audio player | **Not built** | NOT STARTED |
| Real-Time Cost Calculator | Phase 1 moat feature | **Not built** | NOT STARTED |
| Verified by Locals Trust Badges | Phase 1 moat feature | **Not built** | NOT STARTED |
| ContributorByline | Standalone component | Not standalone — inline in layouts | WORKING |

### TECHNICAL INFRASTRUCTURE

| Feature | Status | Notes |
|---------|--------|-------|
| Astro 5 + Tailwind CSS 4 + React | COMPLETE | `@astrojs/react` integration |
| Cloudflare Pages deployment | COMPLETE | Production on `master` branch |
| GA4 Analytics (consent-gated) | COMPLETE | Via CookieConsent component |
| Cloudflare Web Analytics (privacy-first) | **NOT ENABLED** | Plan calls for dual analytics: CF Analytics + GA4 |
| Google Search Console | READY | robots.txt + sitemap-index.xml deployed |
| Security headers (`_headers`) | COMPLETE | X-Frame-Options, HSTS, CSP headers |
| OG default image | COMPLETE | Branded 1200x630 gradient image |
| i18n routing (EN/TL) | COMPLETE | Route infrastructure + language switcher |
| D1 database | CONFIGURED | `trip-planner-cache` in wrangler.jsonc |
| Stripe integration | COMPLETE | Checkout + webhook + verify-purchase APIs |
| Claude API integration | COMPLETE | generate-itinerary + chat-itinerary APIs |
| Email subscribe API + Resend | COMPLETE | `/api/subscribe` endpoint, Resend configured and tested |
| Agoda partner verification | PENDING | `AgodaPartnerVerification.htm` in public/ |
| Story Recorder PWA | PARTIAL | `/recorder/` has index.html, manifest.json, sw.js — functionality unclear |
| WordPress 301 redirects | **UNKNOWN** | Plan says old WP URLs must redirect to Astro equivalents |

### DESIGN SYSTEM DISCREPANCY

| Spec (design-system.md) | Actual (global.css) | Impact |
|------------------------|---------------------|--------|
| Fonts: DM Serif Display + Outfit | Fonts: Inter + Georgia | MISMATCH — site uses different fonts than spec |
| 43 destination gradient classes | 8 gradient CSS vars (siquijor, cebu, bohol, dumaguete, palawan, boracay, siargao, clark) | 35 destinations use fallback gradients |

### VIDEO ASSETS (354 files in public/videos/)

| Category | Count | Notes |
|----------|-------|-------|
| Destination heroes | 44 | All 43 destinations + boracay-hero-full |
| Destination previews | 31 | Subset of destinations |
| Destination breaks | 176 | 3-6 clips per destination |
| Destination posters | 63 | In /posters/ subdirectory |
| Blog videos | 3 | archipelago-effect-hero, blog-hero, filipino-food-hero |
| Pillar videos | 37 | Heroes + breaks for all 5 pillars, festival cards (10), ww2 cards (7), about heroes |
| **Total** | **354** | |

### LEAD MAGNETS & DOWNLOADABLE CONTENT

| What Plan Calls For | What Exists | Status |
|--------------------|-------------|--------|
| Destination-specific PDF guides (per EmailCapture promises) | Only `clark-travel-guide.pdf` in `/public/guides/` | 1/43 |
| `/public/downloads/` directory for PDFs | Directory exists but empty | EMPTY |
| Destination-specific EmailCapture bullets | All 43 use generic bullets from DestinationLayout | GENERIC |

### AFFILIATE & REVENUE INFRASTRUCTURE

| Program | Plan | Status | Commission |
|---------|------|--------|------------|
| Klook | Primary — tours, activities, transport | **SET UP** | 3-5% |
| Booking.com | Primary — hotel bookings | **SET UP** | 4% (25% of Booking revenue) |
| Amazon Associates | Gear & packing lists | **SET UP** | 1-10% by category |
| 12Go Asia | Primary — transport (ferries, buses, trains) | **SET UP** (sub_id=discoverph-plan, AI planner wired) | 5% |
| Agoda | Primary — hotel bookings (Asia focus) | **PENDING APPROVAL** | 4-6% |
| Traveloka (via Partnerize) | Primary — hotels, flights (SE Asia) | **PENDING APPROVAL** | 3-5% |
| GetYourGuide | Primary — tours, activities, experiences | **SET UP** (partner ID IVN6IQ3, analytics + AI planner wired) | 8% |
| Viator (TripAdvisor) | Secondary — tours and activities | **SET UP** (pid=P00290009) | 6-8% |
| SafetyWing | Travel insurance (nomads/travelers) | **SET UP** (referenceID=24858745) | 10% recurring |
| Skyscanner | Secondary — flights (CPC model) | **NOT APPLIED** | €0.30-0.60/click |
| Philippine Airlines / Cebu Pacific | Research — direct airline programs | **NOT RESEARCHED** | Unknown |
| Cooking class affiliates (Cookly, Airbnb Experiences) | Food + festival revenue multiplier | **NOT APPLIED** | $8-25/booking |

### SOCIAL MEDIA & DISTRIBUTION

| Channel | Plan Target | Current State | Status |
|---------|-------------|---------------|--------|
| YouTube channel | Created with branding, playlists, 6 videos | **Channel created**, no content uploaded | CHANNEL ONLY |
| YouTube playlists | 6 playlists (Destination Guides, 360 Immersive, Snorkeling, Food Tours, Travel Tips, Heritage) | **Not created** | NOT STARTED |
| YouTube end screen template | Standardized: Subscribe + Trip Planner + next video | **Not created** | NOT STARTED |
| Pinterest Business | Account + website claimed + 8-10 boards + 30-40 pins | **Not created** | NOT STARTED |
| Instagram | Account + 3-4 feed posts/week + 2-3 reels/week | **Not created** | NOT STARTED |
| Instagram link-in-bio | Linktree or Beacons.ai (site + planner + YouTube) | **Not created** | NOT STARTED |
| Facebook page | Page + CTA button + group engagement | **Not created** | NOT STARTED |
| Facebook boost budget | $50-100/month for best-performing posts | **Not allocated** | NOT STARTED |
| TikTok | Optional — cross-post Instagram Reels | **Not created** | DEFERRED (correct per plan) |

### EMAIL MARKETING

| What Plan Calls For | Status |
|--------------------|--------|
| Resend email platform | **CONFIGURED AND TESTED** |
| Welcome email sequence (7 emails) | **NOT WRITTEN** |
| Email 1: Deliver lead magnet (PDF/guide) | Not written |
| Email 2 (Day 2): "The One Mistake Everyone Makes in the Philippines" | Not written |
| Email 3 (Day 5): Transport tips + Klook affiliate link | Not written |
| Email 4 (Day 8): AI Trip Planner introduction | Not written |
| Email 5 (Day 12): 360 video showcase — "See Siquijor like you're standing there" | Not written |
| Email 6 (Day 16): Trip Companion PWA teaser | Not written |
| Email 7 (Day 21): Budget breakdown + Agoda hotel picks | Not written |
| Monthly newsletter (1x/month) | **NOT STARTED** — destination spotlight + YouTube + seasonal tip + affiliate deal |
| Email open rate / click-through tracking | Resend provides this, not yet monitored |

### TRAVEL SHOW PREP (May 12-15, Las Vegas — Travel Agent Forum, Paris Las Vegas)

| Item | Deadline | Status |
|------|----------|--------|
| Business cards (500 min) — front: logo + landscape, back: QR code + contact | Order by Apr 15 | NOT STARTED |
| NFC-enabled business cards option | Apr 15 | NOT DECIDED |
| Retractable banner stand (33"x80") — hero image + logo + QR code | May 1 | NOT STARTED |
| iPad/tablet running site in kiosk mode | May 1 | NOT STARTED |
| Printed destination postcards (50-100) with site URL | May 1 | NOT STARTED |
| Branded stickers or luggage tags (giveaway) | May 1 | NOT STARTED |
| iPad with email signup form (QR code backup) | May 1 | NOT STARTED |
| 3-5 min looping video for booth display | May 1 | NOT STARTED |
| Elevator pitch (30 sec) rehearsed | May 1 | NOT REHEARSED |
| Post-show follow-up email template | May 1 | NOT WRITTEN |

**Elevator Pitch (from plan):** "We create immersive Philippines travel guides with 360° video — the only site where you can virtually explore a beach before you book. Plus our AI trip planner builds custom itineraries in 2 minutes. 23 years of on-the-ground experience from a Filipino-American couple."

### LOCAL PROMOTION — ANGELES & PAMPANGA

| Item | Status |
|------|--------|
| Flyer design (half-page, 5.5"x8.5", QR code → trip planner) | NOT DESIGNED |
| Flyer printing (500, local Angeles print shop, ~P7,500-12,500 / $130-220) | NOT PRINTED |
| Distribution: Clark International Airport departures area | NOT STARTED |
| Distribution: Angeles City hotel lobby racks | NOT STARTED |
| Distribution: SM City Clark information desk | NOT STARTED |
| Distribution: Jenice's family/friends at local events | NOT STARTED |
| Jenice video testimonial in Tagalog/Kapampangan for Facebook | NOT RECORDED |
| Word-of-mouth: Jenice posts in family WhatsApp groups | NOT STARTED |
| Word-of-mouth: Family shares on personal Facebook pages | NOT STARTED |
| Target audience: Filipinos living abroad planning to visit home | NOT STARTED |

### TRIP COMPANION PWA PROMOTION (from marketing plan)

| Item | Status |
|------|--------|
| "Take this offline with Trip Companion" CTA at end of every destination page | NOT IMPLEMENTED |
| AI Trip Planner output → one-click export to Trip Companion | NOT IMPLEMENTED |
| Blog posts: inline Trip Companion CTAs in relevant articles | NOT IMPLEMENTED |
| Welcome email 4-5: Introduce Trip Companion as premium upgrade | NOT WRITTEN |
| Beta tester recruitment (10-15 travelers) | Founding Explorer program exists |
| Video demo: Scott walking through Trip Companion on phone | NOT RECORDED |
| Instagram Stories: day-in-the-life using Trip Companion offline | No Instagram account yet |

### CONTENT REPURPOSING PIPELINE (from business plan)

One 10-day Philippines trip produces:
- 8-12 YouTube videos
- 60+ Pinterest pins
- 6-8 blog posts
- 3-4 new destination pages
- 12+ weeks of newsletter content

**Status:** Pipeline not established. No systematic repurposing workflow.

### PHASE 1 MOAT FEATURES (from 60-feature strategy)

| Feature | Status |
|---------|--------|
| AI Trip Planner with LOCAL Knowledge RAG | **BUILT** |
| Interactive 360° Destination Previews | NOT BUILT (Video360Embed not created) |
| Kababayan Network Local Contributors | NOT BUILT (Story Recorder exists but no contributor network) |
| Build My Trip Lead Magnet + Email Nurture | PARTIAL (EmailCapture exists, no nurture sequence, only 1 PDF guide) |
| Real-Time Cost Calculator | NOT BUILT |
| Interactive Destination Maps | PARTIAL (homepage + snorkeling + plan page only) |
| Eat Like a Local Food Guides | PARTIAL (cuisine pillar built, no individual food pages) |
| Getting There & Around Transportation Bible | PARTIAL (practical pillar covers this, no standalone guide) |
| Verified by Locals Trust Badges | NOT BUILT |

### DOMAIN PORTFOLIO (from business plan)

| Tier | Domains | Annual Cost | Status |
|------|---------|-------------|--------|
| Tier 1 (7 domains) | discoverindochina.com, discovervietnam.com, discoverlaos.com, discoverlao.com, discovercambodia.com, discoverbajanorte.com, discovermekong.com | $83.68/yr | UNKNOWN |
| Tier 2 (3 domains) | immersivethailand.com, sandiegotobaja.com, bordertobeach.com | $31.38/yr | UNKNOWN |
| Tier 3 (4 domains) | discoversoutheastasia.com, discoverdestinations.com, immersivecambodia.com, immersivevietnam.com | $41.84/yr | UNKNOWN |
| **Total** | **14 domains** | **~$157/yr** | |

### SCRIPTS & TOOLS

| Tool | Status |
|------|--------|
| `scripts/translate.mjs` — Batch translator | Built |
| `scripts/review-server.mjs` — Translation review | Built |
| `video-tracking/video-inventory.yaml` — 8,220 lines, ~360 entries | Active |
| `video-tracking/thumbnails/catalog.html` — Visual clip identifier | Built |
| `video-tracking/pipeline/shutterstock-lookup.cjs` — Stock lookup | Built |

---

## PART 2: WHAT'S ACTUALLY MISSING (Prioritized)

### CRITICAL — Revenue & Distribution

| # | Gap | Why It Matters |
|---|-----|----------------|
| 1 | YouTube: 9 Shorts + 420 raw clips not uploaded | YouTube is primary traffic + AdSense revenue channel |
| 2 | Only 5/67 blog posts written | Blog drives long-tail SEO, affiliate links, email signups |
| 3 | Welcome email sequence (7 emails) not written | Resend is ready but no nurture → no affiliate conversions from email |
| 4 | Remaining affiliates: Agoda (pending), Viator, Skyscanner, cooking class programs | Missing commission revenue streams |
| 5 | No social media accounts (Pinterest, Instagram, Facebook) | Zero social traffic or brand presence |
| 6 | No lead magnet PDFs | EmailCapture promises guides but only clark PDF exists — trust issue |

### HIGH — Content Completeness

| # | Gap | Why It Matters |
|---|-----|----------------|
| 7 | 14 destinations missing Where to Stay | Hotel affiliate links (Agoda/Booking) can't be placed |
| 8 | 17 destinations missing Where to Eat | Content incompleteness hurts GEO extraction |
| 9 | 21 destinations missing affiliatePicks | No Amazon gear revenue on half the site |
| 10 | 0/43 destination pages have Trip Companion CTA | Missing upsell touchpoint on every page |
| 11 | Monthly newsletter not started | No recurring email engagement with subscribers |
| 12 | YouTube playlists not created | Needed before uploading content for organization |

### MEDIUM — Platform & Polish

| # | Gap | Why It Matters |
|---|-----|----------------|
| 13 | Cloudflare Web Analytics not enabled | Plan calls for dual analytics (privacy-first + GA4) |
| 14 | WordPress 301 redirects not verified | Old WP URLs may 404, losing any existing SEO equity |
| 15 | Font mismatch (Inter/Georgia vs DM Serif Display/Outfit) | Design inconsistency with spec |
| 16 | Only 8/43 destination gradients in CSS | 35 destinations use fallback gradients |
| 17 | Generic EmailCapture bullets on destinations | Plan calls for destination-specific lead magnets |
| 18 | Only 2 Tagalog translations | Translation infrastructure built but no content |
| 19 | Story Recorder PWA unclear status | Files exist but may not be functional |
| 20 | Phase 1 moat features not built | Cost Calculator, Trust Badges, 360 Previews, Kababayan Network |

### LOW / FUTURE

| # | Gap | Timeline |
|---|-----|----------|
| 21 | 48 individual pillar sub-pages | Post-launch expansion |
| 22 | Video360Embed / AudioMemoryPlayer components | When 360 content is ready |
| 23 | Domain portfolio (14 domains, ~$157/yr) | Year 2+ multi-site expansion |
| 24 | Digital products ($29-149) | Year 2+ |
| 25 | TikTok account | After YouTube + Instagram + Pinterest established |
| 26 | Philippine Airlines / Cebu Pacific direct affiliate | Research phase |

---

## PART 3: PRIORITY REMEDIATION (Next 4 Weeks)

### Week 1 (Feb 20-26): Revenue Foundation
1. Build welcome email sequence (at least emails 1-3) in Resend
2. Complete Agoda affiliate application (verification file deployed)
3. Apply to GetYourGuide, Viator, Skyscanner
4. Upload 9 existing Shorts to YouTube channel
5. Create YouTube playlists (6: Destination Guides, 360 Immersive, Snorkeling, Food Tours, Travel Tips, Heritage)
6. Create Pinterest Business account, claim website, create 8-10 boards
7. Enable Cloudflare Web Analytics in dashboard

### Week 2 (Feb 27-Mar 5): Content Sprint
8. Add Where to Stay to 14 missing destinations (batch with Claude)
9. Add Where to Eat to 17 missing destinations (batch with Claude)
10. Add affiliatePicks to 21 missing destinations (batch with Claude)
11. Write 3 blog posts: Budget guide, Packing list, Island hopping
12. Create Instagram + Facebook accounts
13. Design Instagram link-in-bio (Linktree/Beacons.ai → site + planner + YouTube)

### Week 3 (Mar 6-12): Social & Video Launch
14. Design 30 Pinterest pins in Canva (vertical, branded) and schedule via Tailwind
15. Edit + upload first full YouTube destination guide (Siquijor or Cebu)
16. Create YouTube end screen template
17. Post first Instagram reels + feed posts
18. Launch Facebook page with CTA button → Trip Planner
19. Write remaining welcome emails (4-7)
20. Verify WordPress 301 redirects (check old WP URLs)

### Week 4 (Mar 13-19): Monetization & Promotion
21. Add Trip Companion CTA to DestinationLayout (covers all 43 pages)
22. Write first monthly newsletter and send
23. Join 3-5 Facebook groups (Philippines Travel Community, Expats in PH) and engage
24. Start Facebook boost on best-performing post ($50 test)
25. Research cooking class affiliate programs (Cookly, Airbnb Experiences)
26. Research Philippine Airlines / Cebu Pacific direct programs or confirm Skyscanner

---

## PART 4: AUTOMATED WEEKLY MARKETING STRATEGY

### The Weekly Cycle (2-3 hours/week once set up)

Repeatable every week with minimal creative decision-making.

---

### MONDAY: Content Creation Day (45 min)

**Blog Post Production** (rotate weekly):
- Week 1: Destination spotlight (pick next unwritten destination from Tier 1)
- Week 2: Practical tip post (ferry routes, budget breakdown, packing)
- Week 3: Food/culture post (regional dish deep-dive, festival preview)
- Week 4: Listicle/comparison ("5 Best Beaches for Snorkeling", "3-Day Itineraries Under $200")

**Process:**
1. Draft post in Claude (use Content Bible templates)
2. Add to `src/content/blog/` with proper frontmatter
3. Include 2-3 affiliate links (Klook tours, Agoda hotels, Amazon gear)
4. Build, verify, deploy

**Content Repurposing:** Every blog post → 3-5 Pinterest pins + 1 Instagram post + 1 Facebook share + newsletter mention

**Claude Prompt:** "Write a 1,200-word blog post following Template E about [topic]. Include specific prices in PHP/USD, 3 affiliate-worthy recommendations, and 4 internal cross-links to existing destination pages."

---

### TUESDAY: YouTube Day (60 min)

**Video Production** (1 video/week target):
- Edit one destination guide from 420+ raw clips in `youtube/raw/`
- Target: 8-12 min for guides, 60 sec for Shorts
- Upload with SEO-optimized title, description, timestamps, tags

**Weekly Rotation:**
- Week 1: Full destination guide (Tier 1 priority)
- Week 2: "Top 5" compilation from existing clips
- Week 3: Short-form batch (3-4 YouTube Shorts)
- Week 4: Practical tip video (budget, transport, food)

**First 6 Videos (from plan):**
1. Siquijor Travel Guide 2026 — 10-12 min destination overview
2. Cebu Travel Guide 2026 — Kawasan Falls + Moalboal + Oslob
3. Bohol in 360° — Chocolate Hills + Tarsier + Panglao
4. Philippines Budget Guide — 10 Days, 4 Islands, $500
5. Island Hopping Like a Local — Ferry routes + transport tips
6. Dumaguete & Dauin — Snorkeling + food guide

**Video SEO Checklist (every upload):**
- [ ] Title: `[Destination] Travel Guide 2026 | Philippines Hidden Gems`
- [ ] Description line 1: Full guide → discoverphilippines.info/destinations/[slug]
- [ ] Description line 2: Free Trip Planner → discoverphilippines.info/plan
- [ ] Timestamps in description
- [ ] Tags: philippines travel, [destination] guide, [destination] things to do, philippines 2026
- [ ] Custom thumbnail: Bold text, cinematic still, consistent brand style
- [ ] End screen: Subscribe + next video + Trip Planner link
- [ ] Pinned comment: Website link + "Full written guide at [URL]"

**YouTube Description Template:**
```
Full guide: discoverphilippines.info/destinations/[slug]
Free AI Trip Planner: discoverphilippines.info/plan
Trip Companion: discoverphilippines.info/companion

Timestamps:
0:00 - Intro
[fill in]

#philippines #travel #[destination] #philippinestravel
```

---

### WEDNESDAY: Pinterest + Social Scheduling (30 min)

**Pinterest** (primary evergreen traffic channel):
- Create 5-8 new pins using Canva templates
- Pin formula: Vertical 1000x1500, bold text overlay, destination photo, site URL
- Schedule via Tailwind ($12.99/mo) across boards

**Pinterest Board Structure (8-10 boards):**
1. Philippines Beaches
2. Siquijor Travel Guide
3. Cebu Travel
4. Bohol Travel
5. Philippines Budget Travel
6. Island Hopping Philippines
7. Filipino Food
8. 360° Philippines
9. Philippines Snorkeling & Diving

**Pin Text Overlays** (rotate):
1. "X Things to Do in [Destination]"
2. "[Destination] Travel Guide 2026"
3. "Best Beaches in [Region]"
4. "[Destination] on a Budget: $X/Day"
5. "How to Get to [Destination] from Manila"
6. "Best Snorkeling in the Philippines"
7. "Filipino Food You Must Try in [City]"

**Instagram** (2 posts/week):
- Post 1: Destination beauty shot with short caption + 15-20 hashtags (mix broad + niche)
- Post 2: Reel (repurpose YouTube Short)
- Stories (when active): behind-the-scenes, polls, countdown to travel show
- Hashtags: broad (#philippinestravel, #visayas, #islandlife) + niche (#siquijor, #boholdiving, #360video)

**Facebook** (2 posts/week):
- Share blog post with engaging caption
- Share YouTube video (native upload for better reach)
- Join/engage in Facebook groups: Philippines Travel Community, Expats in Philippines
- Monthly: $50-100 boost on best-performing post (target: US, Canada, Australia travelers)

---

### THURSDAY: Email & Community (20 min)

**Welcome Sequence** (7 emails, write once then automated):
1. Immediate: Deliver lead magnet (itinerary PDF or guide)
2. Day 2: "The One Mistake Everyone Makes in the Philippines"
3. Day 5: Practical transport tips + first Klook affiliate link
4. Day 8: AI Trip Planner intro — "Plan your trip in 2 minutes"
5. Day 12: 360° video showcase — "See Siquijor like you're standing there"
6. Day 16: Trip Companion PWA teaser
7. Day 21: Budget breakdown + Agoda hotel picks

**Monthly Newsletter** (1x/month, after welcome sequence):
- Featured destination spotlight
- New YouTube video announcement
- Seasonal tip (monsoon prep, festival guide, best time to visit)
- Affiliate deal of the month (Klook/Agoda special offer)
- User-generated content: reader trip photos + stories

**Community Engagement** (10 min):
- Reply to YouTube comments
- Engage in 2-3 Facebook groups
- Reply to email subscriber questions
- Check Reddit r/Philippines, r/travel for relevant threads

---

### FRIDAY: Analytics & Optimization (15 min)

**Weekly Metrics Check:**
- [ ] GA4: sessions, top pages, traffic sources
- [ ] Cloudflare Web Analytics: privacy-first traffic data
- [ ] Search Console: impressions, clicks, avg position, new queries
- [ ] YouTube: views, watch time, subscriber growth, CTR
- [ ] Pinterest: monthly views, saves, outbound clicks
- [ ] Instagram: followers, engagement rate, reach
- [ ] Email (Resend): open rate, click rate, new subscribers
- [ ] Affiliate dashboards: Klook, Booking, Amazon, Agoda clicks + conversions

**Target Metrics (from marketing plan):**
- Organic search: 500+/month by month 3
- Pages per session: 3+
- Session duration: 2+ min
- Email signup rate: 2-3%
- Trip Planner usage: 100+/month
- YouTube subs: 500 by month 3
- Pinterest views: 10K+ by month 3
- Affiliate clicks: 200+/month by month 3
- Revenue per visitor: $0.10-0.20 by month 6

**Weekly Optimization Action** (pick one):
- Update underperforming meta description based on Search Console data
- Refresh top-performing blog post with new info
- Create new pin variant for top-performing content
- Add internal links from new content to older pages
- Update `lastVerified` dates on refreshed content

---

### SATURDAY/SUNDAY: Optional Bonus Tasks

- Batch-record Instagram Reels / YouTube Shorts
- Design next week's Pinterest pins
- Write email sequence emails
- Translate a destination page to Tagalog
- Record Story Recorder audio with Jenice
- Jenice: share site in WhatsApp groups, post video testimonial in Tagalog/Kapampangan
- Jenice's family: share on personal Facebook pages
- Generate destination-specific lead magnet PDF

---

## PART 5: MONTHLY MILESTONES

### March 2026
- [ ] YouTube: 9 Shorts uploaded + 4 full guide videos
- [ ] YouTube playlists created (6)
- [ ] Pinterest: 30+ pins across 8 boards
- [ ] Instagram + Facebook active
- [ ] Instagram link-in-bio set up (Linktree/Beacons.ai)
- [ ] 3+ new blog posts (8 total)
- [ ] Agoda approved + GetYourGuide/Viator/Skyscanner applied
- [ ] Welcome email sequence started (at least emails 1-3 via Resend)
- [ ] Where to Stay/Eat gaps partially filled
- [ ] Cloudflare Web Analytics enabled
- [ ] WordPress 301 redirects verified
- [ ] First Facebook boost ($50 test)
- [ ] 100+ email subscribers
- [ ] First affiliate sale

### April 2026
- [ ] 8+ YouTube videos published
- [ ] 60+ Pinterest pins
- [ ] 6+ new blog posts (11 total)
- [ ] Where to Stay/Eat complete on all 43 destinations
- [ ] affiliatePicks on all 43 destinations
- [ ] Trip Companion CTA on all destination pages
- [ ] Welcome email sequence complete (all 7 emails)
- [ ] First monthly newsletter sent
- [ ] 250+ email subscribers
- [ ] $50-100 affiliate revenue
- [ ] Travel show materials ordered:
  - [ ] Business cards (500, consider NFC-enabled)
  - [ ] Retractable banner stand (33"x80")
  - [ ] Destination postcards (50-100)
  - [ ] Branded stickers or luggage tags
- [ ] Flyer designed for Angeles/Pampanga distribution
- [ ] 1,000+ monthly site visitors

### May 2026
- [ ] **Travel show (May 12-15, Las Vegas — Travel Agent Forum, Paris Las Vegas)**
- [ ] 3-5 min looping video ready for booth display
- [ ] iPad set up in kiosk mode for demo
- [ ] Elevator pitch rehearsed
- [ ] 150-200 leads from travel show
- [ ] Post-show follow-up email sent within 1 week
- [ ] LinkedIn connections with travel agents/bloggers/media
- [ ] 12+ YouTube videos
- [ ] 100+ Pinterest pins
- [ ] 500 flyers distributed in Angeles/Pampanga (Clark airport, hotels, SM City Clark)
- [ ] Jenice video testimonial posted on Facebook
- [ ] Family word-of-mouth campaign active
- [ ] Trip Companion PWA Phase 6 (offline)
- [ ] 500+ email subscribers
- [ ] $100-200/month affiliate revenue
- [ ] 2,000+ monthly site visitors

### June-August 2026
- [ ] 5,000+ monthly visitors
- [ ] 1,500+ YouTube subscribers
- [ ] 25,000+ Pinterest monthly views
- [ ] $300-500/month revenue (affiliate + Trip Companion)
- [ ] 20+ blog posts
- [ ] 1,500+ email subscribers
- [ ] Monthly newsletter established (recurring)
- [ ] Tagalog translations for top 10 destinations
- [ ] Cooking class/food tour affiliate programs active
- [ ] Content repurposing pipeline systematized

---

## PART 6: AUTOMATION TOOLS & COSTS

### Monthly Recurring
| Tool | Purpose | Cost/Month |
|------|---------|------------|
| Resend | Email delivery | $0 (free tier, configured) |
| Tailwind (Pinterest) | Pin scheduling, analytics | $12.99 |
| Canva Pro | Pin/social/thumbnail graphics | $12.99 |
| Buffer (free tier) | Social scheduling (3 channels) | $0 |
| Facebook boost | Best-performing post reach | $50-100 |
| **Total** | | **$76-126/month** |

### One-Time Costs
| Item | Cost | When |
|------|------|------|
| Business cards (500) | $50-100 | April |
| NFC business cards upgrade (optional) | $100-200 | April |
| Flyers (500, local Angeles print) | ~$130-220 (P7,500-12,500) | April |
| Retractable banner stand | $80-150 | May |
| Destination postcards (100) | $30-50 | May |
| Branded stickers/luggage tags | $40-80 | May |
| iPad stand/holder for booth | $20-40 | May |
| **Total** | **$450-840** | |

---

## PART 7: CONTENT CALENDAR TEMPLATE

```
## Week of [DATE]

### Monday — Content
- [ ] Blog post: [TITLE]
- [ ] Internal links: [2-3 destination pages]
- [ ] Affiliate links: [Klook/Agoda/Amazon targets]
- [ ] Repurpose plan: [# pins, Instagram post, Facebook share]

### Tuesday — Video
- [ ] YouTube: [VIDEO TITLE]
- [ ] Thumbnail designed
- [ ] Description + timestamps written
- [ ] End screen + cards added
- [ ] Pinned comment posted
- [ ] Tags applied

### Wednesday — Social
- [ ] Pinterest: [5-8] new pins scheduled
- [ ] Instagram: [2] posts/reels queued
- [ ] Facebook: [2] posts queued
- [ ] Facebook group engagement: [2-3 groups]

### Thursday — Email & Community
- [ ] Newsletter progress: [draft/schedule/review/send]
- [ ] YouTube comments: [replied]
- [ ] Facebook groups: [engaged]
- [ ] Reddit: [checked r/Philippines, r/travel]

### Friday — Analytics
- [ ] GA4: [sessions this week]
- [ ] Cloudflare Analytics: [checked]
- [ ] Search Console: [impressions/clicks]
- [ ] YouTube: [views/subs]
- [ ] Pinterest: [views/clicks]
- [ ] Email: [open rate/new subs]
- [ ] Affiliates: [clicks/conversions]
- [ ] Optimization action: [what you did]
```

---

## PART 8: QUICK WINS (This Week, No Budget)

1. **Upload 9 existing Shorts** to YouTube channel
2. **Create YouTube playlists** (6 playlists per plan)
3. **Create Pinterest Business account** and claim discoverphilippines.info
4. **Complete Agoda application** (verification file already on site)
5. **Apply to GetYourGuide** (partner.getyourguide.com)
6. **Apply to Viator** (viator.com/affiliates)
7. **Build first welcome email** in Resend (auto-send on subscribe)
8. **Create 5 Pinterest pins** in Canva from destination hero screenshots
9. **Create Instagram account** (@discoverphilippines or closest), post 3 photos
10. **Create Facebook page** with CTA button → discoverphilippines.info/plan
11. **Set up Linktree/Beacons.ai** for Instagram link-in-bio
12. **Enable Cloudflare Web Analytics** in dashboard
13. **Jenice shares** site link in family WhatsApp groups + personal Facebook
14. **Share site** in 3 Philippines travel Facebook groups (provide genuine value)
15. **Add Trip Companion CTA** to DestinationLayout (one code change = 43 pages)

---

## PART 9: EXIT CRITERIA & PIVOT TRIGGERS (from business plan)

**Continue Signals:** Email list growing, affiliate clicks happening, YouTube views increasing, any one metric showing traction.

**Pivot Triggers (after 6 months):** If one channel dominates, double down. If food content outperforms destinations, shift focus.

**Stop Criteria (ALL must be true simultaneously):** 12+ months consistent effort AND <500 email subscribers AND <$30/month revenue AND zero growth trajectory. If even one metric shows traction, continue and optimize.

**The "Zero Google" Test:** If Google organic traffic were permanently zero, could this business survive? Email subscribers have planning intent. YouTube has its own discovery engine. Pinterest pins have 4-month half-lives. AI Trip Planner creates direct value regardless of search rankings.
