# SEO & GEO Rules

Follow these rules on EVERY page. Non-negotiable.

## Meta Tags

- **Title format:** "[Destination/Topic] Travel Guide 2026 | Discover Philippines"
- **Meta description:** 150-160 characters, include destination + key activity
- **Canonical URL:** Always set via BaseLayout

## Schema Markup (JSON-LD)

Every page type requires structured data:
- **Destination pages:** TouristDestination + Place + BreadcrumbList
- **Food/Festival pages:** FAQPage + BreadcrumbList
- **All pages:** SpeakableSpecification on Quick Facts blocks
- **Author pages:** Person schema for Scott and Jenice (/about/scott, /about/jenice)

## GEO (Generative Engine Optimization)

These rules optimize for AI search (Google AI Overviews, ChatGPT, Perplexity):

1. **Quick Facts Block** on every destination page — structured data AI can extract
2. **Answer-first formatting** — 120-180 words per section, lead with the answer
3. **Question-based H2/H3 headings** — "When is the best time to visit Siquijor?" not "Best Time"
4. **Entity authority** — consistent brand signals, author attribution on every page
5. **Cross-linking** — every page links to at least 2 other pillars

## E-E-A-T Signals (Include on Every Page)

| Signal | How to Implement |
|--------|-----------------|
| Experience | Reference specific trips, dates, personal anecdotes |
| Expertise | Include real prices (PHP + USD), airline routing details, specific hotel names |
| Authority | Byline: "Scott & Jenice Murray", link to author pages |
| Trust | Real data from verified trips, FTC-compliant affiliate disclosure |

## Image Requirements

- All images must have descriptive alt text (not just "beach" — use "White sand beach at Puka Shell Beach, Boracay at sunset")
- Use Astro's built-in image optimization
- Lazy load all images below the fold
- Hero images: provide both video and image fallback

## Content Freshness Strategy

Pages updated within 3 months get 67% more AI citations. Quarterly refresh schedule:
- **Q1 (Jan–Mar):** Update pricing, festival dates, visa requirements
- **Q2 (Apr–Jun):** Refresh transport routes, seasonal recommendations
- **Q3 (Jul–Sep):** Update based on summer travel reports
- **Q4 (Oct–Dec):** Annual comprehensive refresh

Every refresh updates `dateModified` in schema and `lastVerified` in frontmatter.

## Content Status Tracking

All content uses this workflow in frontmatter:
```
contentStatus: draft → review → published → needs-update
```
