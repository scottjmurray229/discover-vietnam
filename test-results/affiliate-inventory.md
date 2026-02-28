# Affiliate Link Inventory — Discover Philippines

**Generated:** 2026-02-24
**Scope:** All files in `src/content/destinations/`, `src/content/blog/`, `src/pages/`, `src/components/`, and `src/layouts/`

---

## Summary Table

| Partner | Frontmatter Links | Body/Inline Links | Total | Pages With Links |
|---------|------------------:|------------------:|------:|-----------------|
| **Booking.com** (aid=2778866) | 104 | 142 | 246 | 43 destinations + plan.astro + email-itinerary.ts |
| **Klook** (aid=112015) | 27 | 100 | 127 | 42 destinations + plan.astro + email-itinerary.ts |
| **12Go Asia** (z=15062413) | 20 | 7 | 27 | 20 destinations + plan.astro + practical/index.astro + TripTab.tsx |
| **Amazon Associates** (tag=discoverphili-20) | 0 | 37 | 37 | practical/index.astro + finer-things/index.astro + wellness-philippines/index.astro |
| **SafetyWing** (referenceID=24858745) | 0 | 7 | 7 | DestinationLayout.astro (all 43 dest pages) + plan.astro + practical/index.astro + blog/travel-insurance + ToolsTab.tsx |
| **GetYourGuide** (partner_id=IVN6IQ3) | 0 | 3 | 3 | plan.astro (2 dynamic builders) + BaseLayout.astro (widget script) |
| **Hotels.com** (camref=1101l5Eohj) | 0 | 2 | 2 | plan.astro + email-itinerary.ts (dynamic builders) |
| **Viator** (pid=P00290009) | 0 | 1 | 1 | plan.astro (dynamic builder) |
| **TOTALS** | **151** | **299** | **450** | |

**Note on dynamic links:** plan.astro, email-itinerary.ts, and DestinationLayout.astro generate affiliate links dynamically at runtime. The counts above reflect the number of URL-building code paths, not the number of links that will appear on rendered pages. For example, Booking.com in plan.astro generates a link for every hotel in every AI-generated itinerary. SafetyWing in DestinationLayout.astro renders on all 43 destination pages (2 links each = 86 rendered links).

---

## 1. Booking.com (aid=2778866)

**Affiliate ID:** `aid=2778866`
**Total static links in content:** 246 (104 frontmatter + 142 body inline)
**Dynamic link builders:** 2 (plan.astro, email-itinerary.ts)

### Frontmatter affiliatePicks (104 links across 42 destinations)

| Destination | Frontmatter Links |
|-------------|------------------:|
| bacolod | 3 |
| baguio | 3 |
| baler | 2 |
| banaue | 2 |
| bataan | 1 |
| batanes | 2 |
| batangas | 2 |
| biliran | 1 |
| bohol | 2 |
| boracay | 3 |
| camiguin | 2 |
| caramoan | 2 |
| cebu | 3 |
| clark | 3 |
| coron | 2 |
| cuyo | 1 |
| davao | 3 |
| donsol | 3 |
| dumaguete | 3 |
| el-nido | 3 |
| guimaras | 3 |
| iloilo | 3 |
| la-union | 3 |
| laguna | 3 |
| laoag | 3 |
| legazpi | 3 |
| malapascua | 3 |
| manila | 3 |
| marinduque | 3 |
| mt-pulag | 3 |
| pagudpud | 3 |
| puerto-galera | 3 |
| puerto-princesa | 2 |
| samar | 1 |
| siargao | 2 |
| sipalay | 2 |
| siquijor | 3 |
| subic | 2 |
| tacloban | 2 |
| tagaytay | 3 |
| vigan | 2 |
| zambales | 3 |
| **TOTAL** | **104** |

### Body Inline Links (142 links across 43 destinations)

| Destination | Body Inline Links |
|-------------|------------------:|
| bacolod | 3 |
| baguio | 3 |
| baler | 2 |
| banaue | 1 |
| bataan | 2 |
| batanes | 5 |
| batangas | 5 |
| biliran | 2 |
| bohol | 4 |
| boracay | 1 |
| camiguin | 5 |
| caramoan | 2 |
| cebu | 4 |
| clark | 3 |
| coron | 4 |
| cuyo | 1 |
| davao | 5 |
| donsol | 2 |
| dumaguete | 1 |
| el-nido | 5 |
| guimaras | 3 |
| iloilo | 4 |
| la-union | 2 |
| laguna | 3 |
| laoag | 4 |
| legazpi | 5 |
| malapascua | 3 |
| manila | 10 |
| marinduque | 3 |
| mt-pulag | 2 |
| pagudpud | 2 |
| puerto-galera | 5 |
| puerto-princesa | 3 |
| sagada | 2 |
| samar | 3 |
| siargao | 4 |
| sipalay | 2 |
| siquijor | 4 |
| subic | 3 |
| tacloban | 4 |
| tagaytay | 4 |
| vigan | 5 |
| zambales | 2 |
| **TOTAL** | **142** |

### Dynamic Builders (runtime-generated links)

| File | Location | Notes |
|------|----------|-------|
| `src/pages/plan.astro` | Line 477 | `buildAffiliateUrl()` — generates Booking.com link for every hotel item in AI itineraries |
| `src/pages/api/email-itinerary.ts` | Line 61 | Same pattern for emailed itineraries |

### Destinations Missing Booking.com Frontmatter affiliatePicks

All 42 destinations with frontmatter Booking.com links have at least 1. The only destination without frontmatter Booking.com links would be any destination without `affiliatePicks` at all. Sagada has body inline Booking.com links (2) but no frontmatter affiliatePicks.

---

## 2. Klook (aid=112015)

**Affiliate ID:** `aid=112015`
**Total static links in content:** 127 (27 frontmatter + 100 body inline)
**Dynamic link builders:** 3 (plan.astro implicit via buildAffiliateUrl, email-itinerary.ts x3)

### Frontmatter affiliatePicks (27 links across 18 destinations)

| Destination | Frontmatter Links |
|-------------|------------------:|
| baler | 2 |
| banaue | 1 |
| bataan | 1 |
| batanes | 2 |
| batangas | 1 |
| biliran | 2 |
| bohol | 2 |
| camiguin | 1 |
| caramoan | 1 |
| coron | 2 |
| puerto-princesa | 1 |
| samar | 2 |
| siargao | 2 |
| sipalay | 1 |
| subic | 2 |
| tacloban | 1 |
| tagaytay | 1 |
| vigan | 2 |
| **TOTAL** | **27** |

### Body Inline Links (100 links across 42 destinations)

| Destination | Body Inline Links |
|-------------|------------------:|
| bacolod | 3 |
| baguio | 3 |
| baler | 3 |
| banaue | 2 |
| bataan | 3 |
| batanes | 3 |
| batangas | 3 |
| bohol | 3 |
| boracay | 1 |
| camiguin | 3 |
| caramoan | 1 |
| cebu | 3 |
| clark | 3 |
| coron | 3 |
| cuyo | 2 |
| davao | 3 |
| donsol | 2 |
| dumaguete | 1 |
| el-nido | 3 |
| guimaras | 1 |
| iloilo | 2 |
| la-union | 3 |
| laguna | 3 |
| laoag | 3 |
| legazpi | 3 |
| malapascua | 2 |
| manila | 1 |
| marinduque | 1 |
| mt-pulag | 2 |
| pagudpud | 2 |
| puerto-galera | 3 |
| puerto-princesa | 2 |
| sagada | 3 |
| samar | 2 |
| siargao | 3 |
| sipalay | 2 |
| siquijor | 2 |
| subic | 2 |
| tacloban | 2 |
| tagaytay | 3 |
| vigan | 2 |
| zambales | 3 |
| **TOTAL** | **100** |

### Dynamic Builders

| File | Location | Notes |
|------|----------|-------|
| `src/pages/api/email-itinerary.ts` | Lines 69, 72, 74 | 3 URL patterns for tour, transport, and generic Klook links in emailed itineraries |

### Destinations WITHOUT Klook (frontmatter or inline)

Only **dumaguete** has Klook links in frontmatter but not in body inline (1 inline). All 42 destinations except **boracay** (which has only 1 inline Klook) have decent Klook coverage.

---

## 3. 12Go Asia (z=15062413)

**Affiliate ID:** `z=15062413`, `sub_id=discoverph`
**Total static links:** 22 (20 frontmatter + 2 inline in pages)
**Dynamic/widget:** 5 additional references (widgets + dynamic builder)

### Frontmatter affiliatePicks (20 links across 20 destinations)

| Destination | Frontmatter Links |
|-------------|------------------:|
| bacolod | 1 |
| batangas | 1 |
| bohol | 1 |
| boracay | 1 |
| camiguin | 1 |
| cebu | 1 |
| coron | 1 |
| davao | 1 |
| donsol | 1 |
| dumaguete | 1 |
| el-nido | 1 |
| iloilo | 1 |
| legazpi | 1 |
| malapascua | 1 |
| manila | 1 |
| puerto-galera | 1 |
| puerto-princesa | 1 |
| siargao | 1 |
| siquijor | 1 |
| vigan | 1 |
| **TOTAL** | **20** |

### Page/Component Links

| File | Type | Count | Notes |
|------|------|------:|-------|
| `src/pages/plan.astro` | Dynamic builder | 1 | Line 489 — builds 12Go link for transport items |
| `src/pages/plan.astro` | Widget script | 1 | Line 1052 — 12Go search widget embed |
| `src/pages/plan.astro` | Powered-by link | 1 | Line 929 |
| `src/pages/practical/index.astro` | Widget script | 1 | Line 227 — 12Go search widget embed |
| `src/pages/practical/index.astro` | Powered-by link | 1 | Line 229 |
| `src/components/companion/tabs/TripTab.tsx` | Inline link | 1 | Line 138 — companion app transport link |
| **TOTAL** | | **6** | |

### Destinations WITHOUT 12Go

23 destinations have no 12Go frontmatter link: baguio, baler, banaue, bataan, batanes, biliran, caramoan, clark, cuyo, guimaras, la-union, laguna, laoag, marinduque, mt-pulag, pagudpud, sagada, samar, sipalay, subic, tacloban, tagaytay, zambales.

---

## 4. Amazon Associates (tag=discoverphili-20)

**Affiliate Tag:** `tag=discoverphili-20`
**Total links:** 37
**All inline links (no frontmatter)**

### By Page

| Page | Count | Product Categories |
|------|------:|-------------------|
| `src/pages/practical/index.astro` | 22 | Packing gear: sunscreen, repellent, dry bag, power strip, rain jacket, footwear (x3), first aid kit, electrolyte tablets, UV rashguards, UV hat, cargo shorts, swim trunks, water wallet, phone pouch, snorkel mask, snorkel, Baron mask, water shoes, tracksuit, travel pillow, packing cubes, sling bag |
| `src/pages/finer-things/index.astro` | 8 | Spirits gear: padded bottle protector (x2), wine travel bag (x2), travel humidor, butane lighter, cigar cutter, wine bottle protector sleeve |
| `src/pages/wellness-philippines/index.astro` | 7 | Arnis: escrima sticks, padded gloves, headguard. Gym: resistance bands, gym towel, wireless earbuds, training shoes |
| **TOTAL** | **37** | |

### Amazon Product Breakdown

| ASIN | Product | Page |
|------|---------|------|
| B07PKWHTR1 | Reef-safe sunscreen SPF 50+ | practical |
| B004H89KFC | DEET mosquito repellent | practical |
| B0BKQGXYQ9 | Osprey ultralight dry bag | practical |
| B0CXD881LN | Travel power strip with USB | practical |
| B0CLR8QXKW | Lightweight packable rain jacket | practical |
| B097755RHH | Closed-toe Crocs | practical |
| B002Y25BSS | Keen Newport sandals | practical |
| B0DB794BKQ | Small first aid kit | practical |
| B0DK26RFG4 | Electrolyte tablets | practical |
| B0DQC8QTPL | UV-rated rashguards | practical |
| B08DYFR4PN | Cooling UV hat | practical |
| B0B1LHFCBP | Cargo shorts | practical |
| B0CLQRX346 | Swim trunks with pockets | practical |
| B0DZXJPX6X | Water wallet | practical |
| B079HV3TC9 | Waterproof phone pouch | practical |
| B001PR12QI | Cressi Big Eyes Evolution mask | practical |
| B007MAKHUO | Cressi Supernova dry snorkel | practical |
| B07Z5M55PG | Cressi Baron mask | practical |
| B0DSG9CH7W | Water shoes | practical |
| B0CHMSD8S2 | Tracksuit/sweatsuit | practical |
| B079X4S4DQ | Cabeau travel pillow | practical |
| B014VBI5MS | Packing cubes | practical |
| B0DKTBMFZJ | Crossbody sling bag | practical |
| B00IR0HB3G | Wine bottle protector sleeve | finer-things (x2) |
| B0BPQFWKXM | Padded wine travel bag | finer-things (x2) |
| B089QFVWX6 | Travel humidor case | finer-things |
| B07WFBC8X8 | Butane torch lighter | finer-things |
| B07D1FPQJF | Cigar cutter | finer-things |
| B009P2BFYG | Rattan escrima sticks | wellness |
| B07KQBFKG2 | Padded escrima gloves | wellness |
| B07LC9BGWT | Training headguard | wellness |
| B088KT2NRF | Resistance bands | wellness |
| B07BGBXVNL | Quick-dry gym towel | wellness |
| B074DTJKFM | Wireless earbuds | wellness |
| B09WN2NFZR | Minimalist training shoes | wellness |

---

## 5. SafetyWing (referenceID=24858745)

**Affiliate ID:** `referenceID=24858745`, `utm_medium=Ambassador`
**Total unique code locations:** 7
**Rendered instances:** 89+ (all 43 destination pages via DestinationLayout + others)

### By File

| File | Count | Notes |
|------|------:|-------|
| `src/layouts/DestinationLayout.astro` | 2 | Lines 258, 260 — renders on ALL 43 destination pages (text link + CTA button) |
| `src/pages/plan.astro` | 2 | Lines 919, 921 — trip planner SafetyWing CTA block |
| `src/pages/practical/index.astro` | 1 | Line 88 — safety section travel insurance item |
| `src/content/blog/travel-insurance-philippines.md` | 1 | Line 65 — blog post dedicated to SafetyWing review |
| `src/components/companion/tabs/ToolsTab.tsx` | 1 | Line 190 — companion app tools tab |
| **TOTAL** | **7** | |

**Effective reach:** 43 destination pages (via layout) + plan page + practical page + 1 blog post + companion app = **47 pages** with SafetyWing links.

---

## 6. GetYourGuide (partner_id=IVN6IQ3)

**Partner ID:** `IVN6IQ3`
**Total code references:** 3

| File | Line | Type | Notes |
|------|------|------|-------|
| `src/layouts/BaseLayout.astro` | 92 | Widget script | Global GYG widget loaded on EVERY page |
| `src/pages/plan.astro` | 485 | Dynamic builder | Tour-type affiliate URL builder (query-based) |
| `src/pages/plan.astro` | 491 | Dynamic builder | Fallback destination-based GYG URL builder |

**Effective reach:** Widget script loads on every page site-wide. Dynamic links appear on AI trip planner itineraries for tour-type items.

---

## 7. Hotels.com (camref=1101l5Eohj)

**Affiliate IDs:** `camref=1101l5Eohj`, `creativeref=1011l66481`
**Total code references:** 2

| File | Line | Type | Notes |
|------|------|------|-------|
| `src/pages/plan.astro` | 504-505 | Dynamic builder | Hotel-type items in AI itineraries get Hotels.com link alongside Booking.com |
| `src/pages/api/email-itinerary.ts` | 81-82 | Dynamic builder | Same pattern for emailed itineraries, `adref=email-itinerary` |

**Effective reach:** Appears on every hotel item in AI-generated itineraries (plan page + emailed itineraries). Always paired with Booking.com as a secondary option.

---

## 8. Viator (pid=P00290009)

**Affiliate IDs:** `pid=P00290009`, `mcid=42383`
**Total code references:** 1

| File | Line | Type | Notes |
|------|------|------|-------|
| `src/pages/plan.astro` | 497 | Dynamic builder | Tour-type items in AI itineraries get Viator link alongside GetYourGuide |

**Effective reach:** Appears on every tour item in AI-generated itineraries. Always paired with GetYourGuide as a secondary option.

---

## Combined Per-Destination Table

Shows total affiliate link count per destination (frontmatter + body inline), broken down by partner. Does NOT include layout-injected SafetyWing or global GYG widget.

| Destination | Booking FM | Booking Body | Klook FM | Klook Body | 12Go FM | Total |
|-------------|----------:|-------------:|---------:|-----------:|--------:|------:|
| bacolod | 3 | 3 | 0 | 3 | 1 | 10 |
| baguio | 3 | 3 | 0 | 3 | 0 | 9 |
| baler | 2 | 2 | 2 | 3 | 0 | 9 |
| banaue | 2 | 1 | 1 | 2 | 0 | 6 |
| bataan | 1 | 2 | 1 | 3 | 0 | 7 |
| batanes | 2 | 5 | 2 | 3 | 0 | 12 |
| batangas | 2 | 5 | 1 | 3 | 1 | 12 |
| biliran | 1 | 2 | 2 | 0 | 0 | 5 |
| bohol | 2 | 4 | 2 | 3 | 1 | 12 |
| boracay | 3 | 1 | 0 | 1 | 1 | 6 |
| camiguin | 2 | 5 | 1 | 3 | 1 | 12 |
| caramoan | 2 | 2 | 1 | 1 | 0 | 6 |
| cebu | 3 | 4 | 0 | 3 | 1 | 11 |
| clark | 3 | 3 | 0 | 3 | 0 | 9 |
| coron | 2 | 4 | 2 | 3 | 1 | 12 |
| cuyo | 1 | 1 | 0 | 2 | 0 | 4 |
| davao | 3 | 5 | 0 | 3 | 1 | 12 |
| donsol | 3 | 2 | 0 | 2 | 1 | 8 |
| dumaguete | 3 | 1 | 0 | 1 | 1 | 6 |
| el-nido | 3 | 5 | 0 | 3 | 1 | 12 |
| guimaras | 3 | 3 | 0 | 1 | 0 | 7 |
| iloilo | 3 | 4 | 0 | 2 | 1 | 10 |
| la-union | 3 | 2 | 0 | 3 | 0 | 8 |
| laguna | 3 | 3 | 0 | 3 | 0 | 9 |
| laoag | 3 | 4 | 0 | 3 | 0 | 10 |
| legazpi | 3 | 5 | 0 | 3 | 1 | 12 |
| malapascua | 3 | 3 | 0 | 2 | 1 | 9 |
| manila | 3 | 10 | 0 | 1 | 1 | 15 |
| marinduque | 3 | 3 | 0 | 1 | 0 | 7 |
| mt-pulag | 3 | 2 | 0 | 2 | 0 | 7 |
| pagudpud | 3 | 2 | 0 | 2 | 0 | 7 |
| puerto-galera | 3 | 5 | 0 | 3 | 1 | 12 |
| puerto-princesa | 2 | 3 | 1 | 2 | 1 | 9 |
| sagada | 0 | 2 | 0 | 3 | 0 | 5 |
| samar | 1 | 3 | 2 | 2 | 0 | 8 |
| siargao | 2 | 4 | 2 | 3 | 1 | 12 |
| sipalay | 2 | 2 | 1 | 2 | 0 | 7 |
| siquijor | 3 | 4 | 0 | 2 | 1 | 10 |
| subic | 2 | 3 | 2 | 2 | 0 | 9 |
| tacloban | 2 | 4 | 1 | 2 | 0 | 9 |
| tagaytay | 3 | 4 | 1 | 3 | 0 | 11 |
| vigan | 2 | 5 | 2 | 2 | 1 | 12 |
| zambales | 3 | 2 | 0 | 3 | 0 | 8 |
| **TOTALS** | **104** | **142** | **27** | **100** | **20** | **393** |

---

## Non-Destination Pages With Affiliate Links

| Page | Partners Present | Link Count |
|------|-----------------|----------:|
| `src/pages/plan.astro` | Booking.com, GetYourGuide, 12Go Asia, Viator, Hotels.com, SafetyWing | 8 code paths (dynamic) |
| `src/pages/api/email-itinerary.ts` | Booking.com, Klook, Hotels.com | 5 code paths (dynamic) |
| `src/pages/practical/index.astro` | Amazon (22), SafetyWing (1), 12Go Asia (2 — widget + link) | 25 |
| `src/pages/finer-things/index.astro` | Amazon (8) | 8 |
| `src/pages/wellness-philippines/index.astro` | Amazon (7) | 7 |
| `src/content/blog/travel-insurance-philippines.md` | SafetyWing (1) | 1 |
| `src/layouts/DestinationLayout.astro` | SafetyWing (2) — renders on all 43 dest pages | 2 |
| `src/layouts/BaseLayout.astro` | GetYourGuide widget script — loads on ALL pages | 1 |
| `src/components/companion/tabs/TripTab.tsx` | 12Go Asia (1) | 1 |
| `src/components/companion/tabs/ToolsTab.tsx` | SafetyWing (1) | 1 |

---

## Affiliate Partner Credentials Reference

| Partner | Tracking Parameter | Value |
|---------|-------------------|-------|
| Booking.com | `aid` | `2778866` |
| Klook | `aid` | `112015` |
| 12Go Asia | `z` | `15062413` |
| 12Go Asia | `sub_id` | `discoverph` / `discoverph-plan` / `discoverph-companion` |
| Amazon Associates | `tag` | `discoverphili-20` |
| SafetyWing | `referenceID` | `24858745` |
| SafetyWing | `utm_medium` | `Ambassador` |
| GetYourGuide | `partner_id` | `IVN6IQ3` |
| Hotels.com | `camref` | `1101l5Eohj` |
| Hotels.com | `creativeref` | `1011l66481` |
| Viator | `pid` | `P00290009` |
| Viator | `mcid` | `42383` |

---

## Coverage Gaps

### Destinations missing Klook frontmatter affiliatePicks (25 of 43)
bacolod, baguio, banaue (has 1 -- correction: banaue has 1), boracay, cebu, clark, cuyo, davao, donsol, dumaguete, el-nido, guimaras, iloilo, la-union, laguna, laoag, legazpi, malapascua, manila, marinduque, mt-pulag, pagudpud, puerto-galera, sagada, siquijor, zambales

Note: Many of these DO have Klook body inline links even without frontmatter picks.

### Destinations missing 12Go Asia frontmatter affiliatePicks (23 of 43)
baguio, baler, banaue, bataan, batanes, biliran, caramoan, clark, cuyo, guimaras, la-union, laguna, laoag, marinduque, mt-pulag, pagudpud, sagada, samar, sipalay, subic, tacloban, tagaytay, zambales

### Destinations missing ANY affiliatePicks frontmatter (0)
All 43 destinations have at least some affiliatePicks in frontmatter. However, **sagada** has NO Booking.com frontmatter picks (only body inline links).

### Blog posts with affiliate links (1 of 6)
Only `travel-insurance-philippines.md` contains affiliate links (SafetyWing).
