# CLAUDE.md Additions — Merge Into Your Init-Generated File

Add these sections to the CLAUDE.md that `/init` created. Keep everything it already generated (tech stack, routing, content collections, styling, deployment). Add these below:

---

## Design Documents

See @docs/design-system.md for colors (WCAG validated), typography (exact sizes/weights), responsive grid, spacing tokens, and performance targets
See @docs/content-templates.md for page structure specifications (destination, festival, food, practical guides)
See @docs/component-reference.md for component build order, props, dependencies, schema markup by page type, and full routing table
See @docs/destination-data.md for the master destination list (26 destinations, 3 tiers) with cross-linking rules
See @docs/seo-geo-rules.md for SEO meta, schema markup rules, and GEO optimization tactics
See @docs/ai-trip-planner-spec.md for AI Trip Planner product spec (defer until after destination pages)

## Design Principles (Follow These Always)

1. **Immersion First** — 360° video heroes and cinematic photography dominate. White space frames content.
2. **Utility Over Decoration** — Every UI element serves a planning purpose. If it doesn't help a traveler decide, remove it.
3. **Mobile-Native** — Design starts at 375px (iPhone SE). Desktop is responsive enhancement. Touch targets 44px minimum.
4. **Trust Through Specificity** — No stock photography. Include specific dishes to order, not just restaurant names.
5. **Warmth Without Clutter** — No sidebars, no pop-ups, no cookie banners beyond legal requirements.
6. **Email-First** — Email capture is the single most important conversion on every page.
7. **Accessible by Default** — WCAG AA compliance in every component. Alt text, captions, keyboard nav.
8. **AI-Surface Ready** — Quick Facts blocks, question-based headings, SpeakableSpecification schema on every content page.

## Content Rules

- Every page must include at least one authority signature (Scott's Pro Tips, Jenice's Local Knowledge, etc.)
- First-person plural voice: "we discovered...", "our first morning..."
- Scott = logistics/practical. Jenice = cultural/local.
- All prices in both PHP and USD
- All affiliate links via component (never hardcoded) with proper tracking parameters
- Cross-link every page to at least 2 other content pillars
- Content status: draft → review → published → needs-update
- Warm Coral (#E8654A) is LARGE TEXT ONLY — never use for body text on white backgrounds
- Question-based H2/H3 headings for GEO: "How Do You Get Around Siquijor?" not "Getting Around"
- Answer-first paragraphs: lead with the answer in first 1-2 sentences, then supporting detail
- 120-180 words per section between headings (GEO sweet spot)

## Build Priority

1. Blocker components in dependency order (see @docs/component-reference.md Phase 1)
2. Siquijor as first complete destination page (validate full pipeline)
3. Remaining Tier 1 destinations (Boracay, Cebu, El Nido, Coron, Bohol, Siargao, Dumaguete)
4. AI Trip Planner MVP (Cloudflare Worker + Claude API — basic form only)

## What NOT to Do

- Do NOT invent design tokens — use only values from @docs/design-system.md
- Do NOT skip ImmersiveBreak sections in destination pages
- Do NOT create destination pages without QuickFacts + SpeakableSpecification
- Do NOT use inline styles — use CSS custom properties or Tailwind utilities
- Do NOT hardcode affiliate links — use OurPickCard/AffiliateCard components
- Do NOT use Warm Coral for body text on white (fails WCAG AA)
- Do NOT skip FAQ section — every content page needs FAQPage schema
