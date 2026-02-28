# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discover Philippines — a travel guide website built with Astro 5, Tailwind CSS 4, and deployed to Cloudflare Pages. Content is markdown-based using Astro's content collections with Zod schemas.

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview production build locally
```

No test runner is configured. No linter is configured.

## Architecture

### Content Collections (`src/content/`)

Two collections defined in `src/content/config.ts`:
- **destinations** — Travel destination pages with typed schema (region enum: visayas/luzon/mindanao, budgetPerDay object, highlights array, contentStatus workflow, gradientColors for per-destination theming)
- **blog** — Articles with categories (destination, food, festival, practical, budget, culture)

Both collections use a `draft: true` default. Content status tracks: draft → review → published → needs-update.

### Routing (`src/pages/`)

- `index.astro` — Home page
- `destinations/[...slug].astro` — Dynamic catch-all route, generates static pages from the destinations collection via `getStaticPaths()`
- `404.astro` — Custom error page

### Layouts

- `BaseLayout.astro` — Root layout with SEO meta (OG, Twitter cards, canonical URL), imports FloatingNav + Footer + global styles
- `DestinationLayout.astro` — Wraps BaseLayout, adds hero with per-destination gradient, quick facts bar, highlights section

### Components (`src/components/`)

- `FloatingNav.astro` — Dual navigation: mobile bottom tab bar (fixed) + desktop top nav bar. Active link detection via `Astro.url.pathname`.
- `Footer.astro` — 3-column grid with brand info, destination links, legal links

### Styling (`src/styles/global.css`)

Design system uses CSS custom properties for tokens:
- Colors: Ocean Teal `#0D7377` (primary), Warm Coral `#E8654A` (accent), Deep Night `#1A2332`, Sand `#F5F0E8` (bg)
- 8px spacing grid (`--space-1` through `--space-24`)
- Content width tokens: `--content-width-sm/md/lg/prose`
- Per-destination gradient classes (`.gradient-siquijor`, `.gradient-cebu`, etc.)
- Utility classes: `.container-content`, `.container-prose`, `.section-padding`, `.touch-target`

Tailwind is used for utility classes; global.css handles design tokens and base styles. Components use scoped `<style>` blocks.

### Deployment

Cloudflare Pages via `@astrojs/cloudflare` adapter. Config in `wrangler.jsonc`. Build output at `dist/` with worker at `dist/_worker.js/index.js`. Node.js compatibility enabled.

### Content Management

Front Matter CMS configured in `frontmatter.json` for visual editing of both content types with field definitions matching the Zod schemas.

## Design Documents

See @docs/design-system.md for colors (WCAG validated), typography, responsive grid, spacing tokens, and performance targets
See @docs/content-templates.md for page structure specifications (destination, festival, food, practical)
See @docs/component-reference.md for component build order, props, dependencies, schema markup, and full routing table
See @docs/destination-data.md for master destination list with tiers and cross-linking rules
See @docs/seo-geo-rules.md for SEO meta, schema markup, and GEO optimization tactics
See @docs/ai-trip-planner-spec.md for AI Trip Planner product spec

## Design Principles

1. Immersion First — 360° video heroes and cinematic photography dominate
2. Mobile-Native — Design starts at 375px. Touch targets 44px minimum.
3. Trust Through Specificity — No stock photography. Include specific dishes, real prices.
4. AI-Surface Ready — Quick Facts blocks, question-based headings, SpeakableSpecification schema

## Content Rules

- First-person plural voice: "we discovered...", "our first morning..."
- Scott = logistics/practical. Jenice = cultural/local.
- **Names rule:** Only use "Scott", "Jenice", and "I/we" in content. Never include names of family members, children, or other travel companions. Use generic terms like "our toddler", "our group", "family" instead.
- All prices in both PHP and USD
- Cross-link every page to at least 2 other content pillars
- Question-based H2/H3 headings for GEO
- Answer-first paragraphs: lead with the answer, then supporting detail

### Destination Page Completeness

Every destination page must include tourist recommendations alongside any off-the-beaten-path content provided by the user. Supplement where content is light:
- **Things to Do** — Named activities with entrance fees in PHP/USD
- **Where to Stay** — 3-5 specific hotels across budget ranges with nightly rates in PHP/USD
- **Where to Eat** — 4-6 specific restaurants with what they're known for and price per person
- **Festivals** — At least one local festival with month and brief description
- **Content Pillars** — Emphasize relevant pillar topics on every page: snorkeling, festivals, cuisine, WWII history, practical travel tips. Not every page needs all five, but include what's relevant.
- **Keep pages concise** — Don't let pages get too long. Tourist recommendations should be brief and factual (name, what it's known for, price), not multi-paragraph descriptions.

### Required Practical Sections (Every Destination Page)

Every destination page MUST include a "Scott's Pro Tips" block covering ALL of these topics (1-2 sentences each, brief and factual):

1. **Logistics & Getting There** — Directions from Manila/Cebu, airport codes, ferry terminal names
2. **Best Time to Visit** — Dry vs wet season, typhoon risk window, best months
3. **Getting Around** — Tricycles, jeepneys, scooter rental, approximate costs in PHP
4. **Money & ATMs** — ATM availability (specific banks), cash necessity, daily budget range
5. **Safety & Health** — Areas to avoid, tap water safety, nearest hospital (name it)
6. **Packing Essentials** — Mosquito repellent, reef-safe sunscreen, sturdy flip-flops, rain jacket
7. **Local Culture & Etiquette** — "Kuya"/"Ate" for staff, "po"/"opo" for respect, local language phrases, tipping norms

Use `<div class="scott-tips">` block format. If a topic is already covered elsewhere on the page, a brief mention with cross-reference is sufficient.

### Required Email Capture (Every Page)

Every destination page and pillar page MUST include a destination/topic-specific EmailCapture component:
- **Destination pages**: `leadMagnet="Get Our Free [Destination] Travel Guide"` with description and 4 specific bullets about what's in the guide
- **Pillar pages**: Topic-specific guide (e.g., "Festival Trip Planner", "Filipino Food Guide", "WWII Heritage Trail Guide") with relevant bullets
- Always include `guideTag` prop for subscriber segmentation (e.g., `destination-cebu`, `pillar-festivals`)
- Place between the CTA section and cross-links section

### Pillar Pages

Five content pillars, each with a dedicated page linked from the nav "Discover" dropdown:
- `/snorkeling-philippines/` — 13 destinations ranked, comparison table, hub-and-spoke
- `/festivals/` — Calendar grid (12 months), 16 festivals, click-to-destination
- `/cuisine/` — Menu format by region (Luzon/Visayas/Mindanao), 24 dishes, click-to-destination
- `/history/` — WWII timeline (25 events, 1941-1945), era-coded, events with/without destination links
- `/practical/` — (Planned) Visa, money, transport, safety practical guides

## Build Priority

1. Blocker components in dependency order (see @docs/component-reference.md)
2. Siquijor as first complete destination page
3. Remaining Tier 1 destinations
4. AI Trip Planner MVP

## Video Tracking
See video-tracking/CLAUDE-CODE-INSTRUCTIONS.md for video inventory workflow.

## Master Plan Updates

After completing significant work (audits, content milestones, bug fix batches, deploys), update the **central master plan** at `C:\Users\scott\documents\discover-more\docs\master-plan.md`:
- Update the **Current Status table** row for this site
- Add a session log entry to `C:\Users\scott\documents\discover-more\docs\session-log.md` with date and summary
- Update **Conference Targets** table if metrics changed (page counts, destination counts, etc.)
