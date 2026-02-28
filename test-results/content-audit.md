# Content Audit Report — All 43 Destination Pages

**Audit Date:** 2026-02-24
**Audited by:** Automated script + manual review
**Scope:** All `.md` files in `src/content/destinations/` (excluding `tl/` subdirectory)
**Files audited:** 43

---

## Executive Summary

| Category | Pass | Fail | Details |
|----------|------|------|---------|
| **Frontmatter completeness** | 42 | 1 | sagada.md missing `affiliatePicks` |
| **draft: false** | 43 | 0 | All destinations are live |
| **contentStatus: published** | 43 | 0 | All destinations are published |
| **heroVideo present** | 43 | 0 | All have non-empty heroVideo paths |
| **Scott's Pro Tips** | 43 | 0 | All have `class="scott-tips"` |
| **Immersive Video Breaks** | 43 | 0 | All have at least 3 breaks |
| **Where to Stay section** | 43 | 0 | All have a Stay heading |
| **Where to Eat section** | 43 | 0 | All have an Eat heading |
| **Jenice callout** | 43 | 0 | All have `class="jenice-callout"` |
| **affiliatePicks present** | 42 | 1 | sagada.md missing entirely |
| **Hotel affiliateUrls valid** | 42 | 0 | All hotel picks with URLs include `aid=2778866` |
| **Hotels missing affiliateUrl** | 0 | 0 | No hotel picks missing URL |
| **File encoding** | 42 | 1 | zambales.md has UTF-8 BOM |

**Overall: 42/43 destinations fully complete. 1 destination (sagada) missing affiliatePicks.**

---

## 1. Frontmatter Completeness

All 17 required frontmatter fields checked: `title`, `description`, `heroVideo`, `tagline`, `region`, `bestMonths`, `budgetPerDay`, `gettingThere`, `essentials`, `highlights`, `gradientColors`, `relatedDestinations`, `faqItems`, `affiliatePicks`, `lastVerified`, `contentStatus`, `draft`.

| Destination | All Fields Present | Missing Fields |
|-------------|-------------------|----------------|
| bacolod | PASS | -- |
| baguio | PASS | -- |
| baler | PASS | -- |
| banaue | PASS | -- |
| bataan | PASS | -- |
| batanes | PASS | -- |
| batangas | PASS | -- |
| biliran | PASS | -- |
| bohol | PASS | -- |
| boracay | PASS | -- |
| camiguin | PASS | -- |
| caramoan | PASS | -- |
| cebu | PASS | -- |
| clark | PASS | -- |
| coron | PASS | -- |
| cuyo | PASS | -- |
| davao | PASS | -- |
| donsol | PASS | -- |
| dumaguete | PASS | -- |
| el-nido | PASS | -- |
| guimaras | PASS | -- |
| iloilo | PASS | -- |
| la-union | PASS | -- |
| laguna | PASS | -- |
| laoag | PASS | -- |
| legazpi | PASS | -- |
| malapascua | PASS | -- |
| manila | PASS | -- |
| marinduque | PASS | -- |
| mt-pulag | PASS | -- |
| pagudpud | PASS | -- |
| puerto-galera | PASS | -- |
| puerto-princesa | PASS | -- |
| **sagada** | **FAIL** | **affiliatePicks** |
| samar | PASS | -- |
| siargao | PASS | -- |
| sipalay | PASS | -- |
| siquijor | PASS | -- |
| subic | PASS | -- |
| tacloban | PASS | -- |
| tagaytay | PASS | -- |
| vigan | PASS | -- |
| zambales | PASS | -- |

---

## 2. Required Body Sections

All 43 destinations have all five required body sections present.

| Section | Pattern Searched | Pass Count | Fail Count |
|---------|-----------------|------------|------------|
| Scott's Pro Tips | `class="scott-tips"` | 43/43 | 0 |
| Immersive Video Breaks | `class="immersive-break-inline"` | 43/43 | 0 |
| Where to Stay | `##` heading containing "Stay" | 43/43 | 0 |
| Where to Eat | `##` heading containing "Eat" | 43/43 | 0 |
| Jenice Callout | `class="jenice-callout"` | 43/43 | 0 |

---

## 3. Immersive Video Breaks & Video Sources (per destination)

| Destination | Breaks | Video Sources | Status |
|-------------|--------|---------------|--------|
| bacolod | 4 | 4 | OK |
| baguio | 4 | 4 | OK |
| baler | 3 | 3 | OK |
| banaue | 4 | 4 | OK |
| bataan | 5 | 5 | OK |
| batanes | 4 | 4 | OK |
| batangas | 4 | 4 | OK |
| biliran | 4 | 4 | OK |
| bohol | 5 | 5 | OK |
| boracay | 7 | 7 | OK |
| camiguin | 4 | 4 | OK |
| caramoan | 4 | 4 | OK |
| cebu | 5 | 5 | OK |
| clark | 9 | 9 | OK |
| coron | 4 | 4 | OK |
| cuyo | 4 | 4 | OK |
| davao | 4 | 4 | OK |
| donsol | 4 | 4 | OK |
| dumaguete | 4 | 4 | OK |
| el-nido | 4 | 4 | OK |
| guimaras | 3 | 3 | OK |
| iloilo | 4 | 4 | OK |
| la-union | 4 | 4 | OK |
| laguna | 4 | 4 | OK |
| laoag | 4 | 4 | OK |
| legazpi | 4 | 4 | OK |
| malapascua | 4 | 4 | OK |
| manila | 6 | 6 | OK |
| marinduque | 9 | 9 | OK |
| mt-pulag | 4 | 4 | OK |
| pagudpud | 4 | 4 | OK |
| puerto-galera | 4 | 4 | OK |
| puerto-princesa | 4 | 4 | OK |
| sagada | 4 | 4 | OK |
| samar | 4 | 4 | OK |
| siargao | 4 | 4 | OK |
| sipalay | 4 | 4 | OK |
| siquijor | 12 | 12 | OK |
| subic | 3 | 3 | OK |
| tacloban | 4 | 4 | OK |
| tagaytay | 4 | 4 | OK |
| vigan | 4 | 4 | OK |
| zambales | 4 | 4 | OK |

**Total immersive breaks across all pages:** 196
**Average per page:** 4.6
**Range:** 3 (baler, guimaras, subic) to 12 (siquijor)

All break counts match video source counts (1:1 ratio), confirming no orphaned break divs or missing videos.

---

## 4. affiliatePicks Audit

### Summary

| Metric | Value |
|--------|-------|
| Destinations with affiliatePicks | 42/43 |
| Destinations missing affiliatePicks | 1 (sagada) |
| Total picks across all destinations | 237 |
| Average picks per destination | 5.6 |
| Hotel picks with valid Booking.com URL (aid=2778866) | 103 |
| Hotel picks missing affiliateUrl | 0 |
| Picks missing required fields (name/type/price/personalNote) | 0 |

### Per-Destination Pick Counts

| Destination | Total Picks | Hotels w/ Valid URL | Hotels Missing URL | Issues |
|-------------|-------------|--------------------|--------------------|--------|
| bacolod | 6 | 3 | 0 | -- |
| baguio | 6 | 3 | 0 | -- |
| baler | 5 | 2 | 0 | -- |
| banaue | 4 | 2 | 0 | -- |
| bataan | 4 | 1 | 0 | -- |
| batanes | 5 | 2 | 0 | -- |
| batangas | 5 | 2 | 0 | -- |
| biliran | 4 | 1 | 0 | -- |
| bohol | 6 | 2 | 0 | -- |
| boracay | 7 | 3 | 0 | -- |
| camiguin | 6 | 2 | 0 | -- |
| caramoan | 4 | 2 | 0 | -- |
| cebu | 7 | 3 | 0 | -- |
| clark | 6 | 3 | 0 | -- |
| coron | 6 | 2 | 0 | -- |
| cuyo | 4 | 1 | 0 | -- |
| davao | 7 | 3 | 0 | -- |
| donsol | 6 | 3 | 0 | -- |
| dumaguete | 7 | 3 | 0 | -- |
| el-nido | 7 | 3 | 0 | -- |
| guimaras | 5 | 3 | 0 | -- |
| iloilo | 7 | 3 | 0 | -- |
| la-union | 6 | 3 | 0 | -- |
| laguna | 6 | 3 | 0 | -- |
| laoag | 6 | 3 | 0 | -- |
| legazpi | 7 | 3 | 0 | -- |
| malapascua | 7 | 3 | 0 | -- |
| manila | 7 | 3 | 0 | -- |
| marinduque | 5 | 3 | 0 | -- |
| mt-pulag | 6 | 3 | 0 | -- |
| pagudpud | 6 | 3 | 0 | -- |
| puerto-galera | 6 | 3 | 0 | -- |
| puerto-princesa | 5 | 2 | 0 | -- |
| **sagada** | **0** | **0** | **0** | **No affiliatePicks field** |
| samar | 4 | 1 | 0 | -- |
| siargao | 6 | 2 | 0 | -- |
| sipalay | 4 | 2 | 0 | -- |
| siquijor | 7 | 3 | 0 | -- |
| subic | 5 | 2 | 0 | -- |
| tacloban | 4 | 2 | 0 | -- |
| tagaytay | 5 | 3 | 0 | -- |
| vigan | 6 | 2 | 0 | -- |
| zambales | 5 | 3 | 0 | -- |

### Pick Field Validation

Every affiliatePick entry across all 42 destinations with picks was verified to include:
- `name` -- PASS (all present)
- `type` -- PASS (all present)
- `price` -- PASS (all present)
- `personalNote` -- PASS (all present)

All hotel-type picks include `affiliateUrl` with the correct Booking.com affiliate ID (`aid=2778866`).

Non-hotel picks (restaurants, activities, tours) do not require Booking.com affiliate URLs. Many activity/tour picks link to Klook (`aid=112015`) where applicable.

---

## 5. Content Status & Draft Status

| Destination | draft | contentStatus |
|-------------|-------|---------------|
| bacolod | false | published |
| baguio | false | published |
| baler | false | published |
| banaue | false | published |
| bataan | false | published |
| batanes | false | published |
| batangas | false | published |
| biliran | false | published |
| bohol | false | published |
| boracay | false | published |
| camiguin | false | published |
| caramoan | false | published |
| cebu | false | published |
| clark | false | published |
| coron | false | published |
| cuyo | false | published |
| davao | false | published |
| donsol | false | published |
| dumaguete | false | published |
| el-nido | false | published |
| guimaras | false | published |
| iloilo | false | published |
| la-union | false | published |
| laguna | false | published |
| laoag | false | published |
| legazpi | false | published |
| malapascua | false | published |
| manila | false | published |
| marinduque | false | published |
| mt-pulag | false | published |
| pagudpud | false | published |
| puerto-galera | false | published |
| puerto-princesa | false | published |
| sagada | false | published |
| samar | false | published |
| siargao | false | published |
| sipalay | false | published |
| siquijor | false | published |
| subic | false | published |
| tacloban | false | published |
| tagaytay | false | published |
| vigan | false | published |
| zambales | false | published |

**All 43 destinations: `draft: false`, `contentStatus: published`.** No issues.

---

## 6. heroVideo References

All 43 destinations have a non-empty `heroVideo` path in frontmatter.

| Destination | heroVideo Path |
|-------------|---------------|
| bacolod | /videos/destinations/bacolod-hero.mp4 |
| baguio | /videos/destinations/baguio-hero.mp4 |
| baler | /videos/destinations/baler-hero.mp4 |
| banaue | /videos/destinations/banaue-hero.mp4 |
| bataan | /videos/destinations/bataan-hero.mp4 |
| batanes | /videos/destinations/batanes-hero.mp4 |
| batangas | /videos/destinations/batangas-hero.mp4 |
| biliran | /videos/destinations/biliran-hero.mp4 |
| bohol | /videos/destinations/bohol-hero.mp4 |
| boracay | /videos/destinations/boracay-hero.mp4 |
| camiguin | /videos/destinations/camiguin-hero.mp4 |
| caramoan | /videos/destinations/caramoan-hero.mp4 |
| cebu | /videos/destinations/cebu-hero.mp4 |
| clark | /videos/destinations/clark-hero.mp4 |
| coron | /videos/destinations/coron-hero.mp4 |
| cuyo | /videos/destinations/cuyo-hero.mp4 |
| davao | /videos/destinations/davao-hero.mp4 |
| donsol | /videos/destinations/donsol-hero.mp4 |
| dumaguete | /videos/destinations/dumaguete-hero.mp4 |
| el-nido | /videos/destinations/el-nido-hero.mp4 |
| guimaras | /videos/destinations/guimaras-hero.mp4 |
| iloilo | /videos/destinations/iloilo-hero.mp4 |
| la-union | /videos/destinations/la-union-hero.mp4 |
| laguna | /videos/destinations/laguna-hero.mp4 |
| laoag | /videos/destinations/laoag-hero.mp4 |
| legazpi | /videos/destinations/legazpi-hero.mp4 |
| malapascua | /videos/destinations/malapascua-hero.mp4 |
| manila | /videos/destinations/manila-hero.mp4 |
| marinduque | /videos/destinations/marinduque-hero.mp4 |
| mt-pulag | /videos/destinations/mt-pulag-hero.mp4 |
| pagudpud | /videos/destinations/pagudpud-hero.mp4 |
| puerto-galera | /videos/destinations/puerto-galera-hero.mp4 |
| puerto-princesa | /videos/destinations/puerto-princesa-hero.mp4 |
| sagada | /videos/destinations/sagada-hero.mp4 |
| samar | /videos/destinations/samar-hero.mp4 |
| siargao | /videos/destinations/siargao-hero.mp4 |
| sipalay | /videos/destinations/sipalay-hero.mp4 |
| siquijor | /videos/destinations/siquijor-hero.mp4 |
| subic | /videos/destinations/subic-hero.mp4 |
| tacloban | /videos/destinations/tacloban-hero.mp4 |
| tagaytay | /videos/destinations/tagaytay-hero.mp4 |
| vigan | /videos/destinations/vigan-hero.mp4 |
| zambales | /videos/destinations/zambales-hero.mp4 |

All hero videos follow the naming convention `/videos/destinations/[slug]-hero.mp4`. No empty heroVideo values found.

---

## 7. Detailed Findings & Action Items

### ISSUE 1: sagada.md missing `affiliatePicks` (Priority: Medium)

**File:** `C:\Users\scott\documents\discover-philippines\src\content\destinations\sagada.md`

Sagada is the only destination out of 43 that has no `affiliatePicks` frontmatter field. The page has hotels and restaurants mentioned in the body text with inline Booking.com links (Sagada Earth Village, Sagada Heritage Village), but no structured `affiliatePicks` array in frontmatter.

**Recommendation:** Add an `affiliatePicks` array with at least 4-6 picks:
- Sagada Earth Village (hotel, Booking.com)
- Sagada Heritage Village (hotel, Booking.com)
- Sumaguing Cave guided tour (activity, Klook)
- A restaurant pick (e.g., Yoghurt House or Vincent's)

---

### ISSUE 2: zambales.md has UTF-8 BOM (Priority: Low)

**File:** `C:\Users\scott\documents\discover-philippines\src\content\destinations\zambales.md`

This file starts with a UTF-8 Byte Order Mark (U+FEFF, character code 65279). While this does not affect the Astro build (the content builds and renders correctly), it causes issues with strict text processing tools and could create edge-case bugs in content pipelines.

Additionally, the file contains mojibake characters in the `gettingThere` field: `3â€"4` instead of `3-4` (corrupted em dashes). This is a rendering issue visible to readers.

**Recommendation:**
1. Remove the BOM from the file
2. Fix the corrupted em dash characters (replace `â€"` with proper em dashes or hyphens)

---

### NOTE: MEMORY.md outdated re: affiliatePicks

The project MEMORY.md states "3 destinations still missing affiliatePicks: zambales, tagaytay, marinduque." This is **no longer accurate** -- all three now have affiliatePicks. Only sagada is missing affiliatePicks. The MEMORY.md should be updated.

---

## 8. Complete Audit Matrix

| # | Destination | FM | Body | Draft | Status | Hero | Breaks | Picks | Hotels | Issues |
|---|-------------|-----|------|-------|--------|------|--------|-------|--------|--------|
| 1 | bacolod | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 2 | baguio | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 3 | baler | 17/17 | 5/5 | false | published | OK | 3 | 5 | 2 | -- |
| 4 | banaue | 17/17 | 5/5 | false | published | OK | 4 | 4 | 2 | -- |
| 5 | bataan | 17/17 | 5/5 | false | published | OK | 5 | 4 | 1 | -- |
| 6 | batanes | 17/17 | 5/5 | false | published | OK | 4 | 5 | 2 | -- |
| 7 | batangas | 17/17 | 5/5 | false | published | OK | 4 | 5 | 2 | -- |
| 8 | biliran | 17/17 | 5/5 | false | published | OK | 4 | 4 | 1 | -- |
| 9 | bohol | 17/17 | 5/5 | false | published | OK | 5 | 6 | 2 | -- |
| 10 | boracay | 17/17 | 5/5 | false | published | OK | 7 | 7 | 3 | -- |
| 11 | camiguin | 17/17 | 5/5 | false | published | OK | 4 | 6 | 2 | -- |
| 12 | caramoan | 17/17 | 5/5 | false | published | OK | 4 | 4 | 2 | -- |
| 13 | cebu | 17/17 | 5/5 | false | published | OK | 5 | 7 | 3 | -- |
| 14 | clark | 17/17 | 5/5 | false | published | OK | 9 | 6 | 3 | -- |
| 15 | coron | 17/17 | 5/5 | false | published | OK | 4 | 6 | 2 | -- |
| 16 | cuyo | 17/17 | 5/5 | false | published | OK | 4 | 4 | 1 | -- |
| 17 | davao | 17/17 | 5/5 | false | published | OK | 4 | 7 | 3 | -- |
| 18 | donsol | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 19 | dumaguete | 17/17 | 5/5 | false | published | OK | 4 | 7 | 3 | -- |
| 20 | el-nido | 17/17 | 5/5 | false | published | OK | 4 | 7 | 3 | -- |
| 21 | guimaras | 17/17 | 5/5 | false | published | OK | 3 | 5 | 3 | -- |
| 22 | iloilo | 17/17 | 5/5 | false | published | OK | 4 | 7 | 3 | -- |
| 23 | la-union | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 24 | laguna | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 25 | laoag | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 26 | legazpi | 17/17 | 5/5 | false | published | OK | 4 | 7 | 3 | -- |
| 27 | malapascua | 17/17 | 5/5 | false | published | OK | 4 | 7 | 3 | -- |
| 28 | manila | 17/17 | 5/5 | false | published | OK | 6 | 7 | 3 | -- |
| 29 | marinduque | 17/17 | 5/5 | false | published | OK | 9 | 5 | 3 | -- |
| 30 | mt-pulag | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 31 | pagudpud | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 32 | puerto-galera | 17/17 | 5/5 | false | published | OK | 4 | 6 | 3 | -- |
| 33 | puerto-princesa | 17/17 | 5/5 | false | published | OK | 4 | 5 | 2 | -- |
| 34 | **sagada** | **16/17** | 5/5 | false | published | OK | 4 | **0** | **0** | **Missing affiliatePicks** |
| 35 | samar | 17/17 | 5/5 | false | published | OK | 4 | 4 | 1 | -- |
| 36 | siargao | 17/17 | 5/5 | false | published | OK | 4 | 6 | 2 | -- |
| 37 | sipalay | 17/17 | 5/5 | false | published | OK | 4 | 4 | 2 | -- |
| 38 | siquijor | 17/17 | 5/5 | false | published | OK | 12 | 7 | 3 | -- |
| 39 | subic | 17/17 | 5/5 | false | published | OK | 3 | 5 | 2 | -- |
| 40 | tacloban | 17/17 | 5/5 | false | published | OK | 4 | 4 | 2 | -- |
| 41 | tagaytay | 17/17 | 5/5 | false | published | OK | 4 | 5 | 3 | -- |
| 42 | vigan | 17/17 | 5/5 | false | published | OK | 4 | 6 | 2 | -- |
| 43 | zambales | 17/17 | 5/5 | false | published | OK | 4 | 5 | 3 | BOM + mojibake |

**Legend:**
- FM = Frontmatter fields present out of 17 required
- Body = Body sections present out of 5 required (Scott's Tips, Immersive Breaks, Where to Stay, Where to Eat, Jenice Callout)
- Breaks = Number of `immersive-break-inline` divs
- Picks = Number of affiliatePicks entries
- Hotels = Number of hotel picks with valid Booking.com affiliate URL (aid=2778866)

---

## 9. Aggregate Statistics

| Metric | Value |
|--------|-------|
| Total destination pages | 43 |
| Pages fully complete (all checks pass) | 41 |
| Pages with issues | 2 (sagada: missing affiliatePicks; zambales: BOM/encoding) |
| Total affiliatePicks across all pages | 237 |
| Total hotel picks with valid Booking.com URLs | 103 |
| Hotel picks missing affiliate URLs | 0 |
| Total immersive video breaks | 196 |
| Total video source tags in body | 196 |
| Pages with 3 breaks (minimum) | 3 (baler, guimaras, subic) |
| Pages with 4+ breaks | 40 |
| Pages with 7+ breaks | 4 (boracay: 7, clark: 9, marinduque: 9, siquijor: 12) |
| All pages draft: false | Yes (43/43) |
| All pages contentStatus: published | Yes (43/43) |
| All pages have heroVideo | Yes (43/43) |
| All pages have scott-tips | Yes (43/43) |
| All pages have jenice-callout | Yes (43/43) |
| All pages have Where to Stay | Yes (43/43) |
| All pages have Where to Eat | Yes (43/43) |
