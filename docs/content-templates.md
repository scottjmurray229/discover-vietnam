# Content Templates — Page Structure Specifications

These templates define the REQUIRED structure for every page type. Follow them exactly when creating or editing content pages.

## TEMPLATE A: DESTINATION GUIDE

### Required Frontmatter

```yaml
---
title: "[Destination Name]"
description: "[50-155 char SEO description]"
heroVideo: ""
heroImage: ""
tagline: "[3-6 word poetic tagline]"
region: [visayas | luzon | mindanao]
bestMonths: [Month, Month]
budgetPerDay:
  backpacker: [USD]
  midRange: [USD]
  luxury: [USD]
gettingThere: "[One sentence from Manila]"
highlights: ["Activity 1", "Activity 2", "Activity 3"]
gradientColors: "[Tailwind gradient classes]"
relatedDestinations: [slug1, slug2, slug3]
lastVerified: 2026-02-08
contentStatus: draft
draft: true
fmContentType: destination
videoBreaks:
  - id: "arrival"
    videoSrc: "[cloudinary-clip-id]"
    fallbackGradient: "[css-gradient]"
    title: "[2-4 word heading]"
    text: "[1-2 atmospheric sentences]"
    quote: "[optional]"
    quoteAuthor: "[optional]"
  - id: "beach"
  - id: "ocean"
  - id: "farewell"
relatedDestinations:
  - slug: [slug1]
    videoSrc: "[cloudinary-clip-id]"
    hook: "[1-line description]"
  - slug: [slug2]
  - slug: [slug3]
---
```

### Body Structure (Narrative Journey Pattern)

Follow this EXACT section order:

0. **Hero (above fold)** — Full-bleed looping video background (Cloudinary, autoplay muted loop). Destination name + poetic tagline overlay. Poster image fallback. Per-destination gradient overlay.
0b. **Quick Facts Bar** — Immediately after hero. Best time, avg daily cost, nearest airport, island type, difficulty, water temp. Sticky on scroll (desktop). SpeakableSpecification schema. Sky (#E8F4F5) background. **This is the single most important GEO element.**
0c. **Byline + Editorial Intro** — ContributorByline (Scott & Jenice). Links to /about/scott and /about/jenice for E-E-A-T.
1. **Opening Editorial** — 3-5 paragraphs: the STORY of discovering this destination. Byline: Scott & Jenice.
2. **--- IMMERSIVE VIDEO BREAK --- (arrival)** — 2-4 word heading + 1-2 atmospheric sentences. Uses ImmersiveBreak component.
3. **What Makes [Destination] Different** — 2-3 paragraphs: why choose this, comparative data. Hooks the reader.
4. **Cultural/Experience Section** — 2-3 paragraphs: signature experience, first-person. Include Jenice's reaction.
5. **--- IMMERSIVE VIDEO BREAK --- (beach)** — Different clip + gradient palette.
6. **Activity/Nature Section** — Accessibility, costs in PHP, guide recommendations. Practical info woven into narrative.
7. **Where to Eat** — Regional food identity + specific picks with prices. Cross-link to food pillar.
8. **--- IMMERSIVE VIDEO BREAK --- (ocean)** — Underwater or nature clip.
9. **Where to Stay** — Budget / Mid-Range / Upscale with PHP + USD pricing. Use AffiliateCard component placeholders.
10. **Cultural Landmark** — 1-2 paragraphs of atmosphere, sensory detail.
11. **--- IMMERSIVE VIDEO BREAK --- (farewell)** — Reflective departure sentence.
12. **Closing** — 1-2 paragraphs: what surprised you, what brings you back.
13. **Quick-Reference Essentials** — Getting There, Getting Around, Budget, Best Time, Connectivity, Language. Icon + label + value format.
14. **FAQ Section** — 4-6 question-answer pairs from frontmatter. Uses FAQ.astro component. Auto-generates FAQPage JSON-LD schema.
15. **Continue the Journey** — 3 related destinations with video thumbnails. Uses RelatedDestinations component.
16. **Content Pillar Cross-Links** — Cards linking to snorkeling, festivals, cuisine, WWII heritage, and practical guides. Uses pillarLinks array in DestinationLayout.
17. **Email Capture** — Destination-specific lead magnet with EmailCapture component. Must include: `leadMagnet`, `description`, `bullets` (4 items), and `guideTag` props.

### Required Practical Guide Content (Scott's Pro Tips)

Every destination page MUST include a `<div class="scott-tips">` block covering ALL of these topics. Each bullet: 1-2 sentences max, first-person plural voice, practical and direct.

| # | Topic | What to Include |
|---|-------|-----------------|
| 1 | **Logistics & Getting There** | Directions from Manila/Cebu, airport codes (e.g., CEB, DVO), ferry terminal names |
| 2 | **Best Time to Visit** | Specific dry/wet season months, typhoon risk window |
| 3 | **Getting Around** | Tricycles, jeepneys, scooter rental with costs in PHP |
| 4 | **Money & ATMs** | ATM availability (bank names), cash warnings, daily budget range |
| 5 | **Safety & Health** | Areas to avoid, tap water safety, nearest hospital by name |
| 6 | **Packing Essentials** | Mosquito repellent, reef-safe sunscreen, sturdy flip-flops, rain jacket |
| 7 | **Local Culture & Etiquette** | "Kuya"/"Ate" for staff, "po"/"opo", local language phrases, tipping |

Format: `<li><strong>Label:</strong> text</li>` within the scott-tips `<ul>` block.

### Required Email Capture Spec

Every page must have a destination/topic-specific EmailCapture:

```astro
<EmailCapture
  leadMagnet="Get Our Free [Destination] Travel Guide"
  description="Everything you need to plan your [Destination] trip — packed into one PDF."
  bullets={[
    'Day-by-day itinerary with prices',
    'Best hotels and restaurants (budget to splurge)',
    'Getting there, getting around, and money tips',
    'Local phrases and cultural etiquette',
  ]}
  guideTag="destination-[slug]"
/>
```

### Immersive Video Break Rules
- 3-4 per page
- Uses ImmersiveBreak component (55vh, video bg + gradient overlay)
- Fallback: CSS gradient if video fails
- Text is short and cinematic
- Pattern: Editorial > Break > Editorial > Break

### Voice & Perspective
- First-person plural ("we discovered...", "our first morning...")
- Scott provides logistics/practical perspective
- Jenice provides cultural/local perspective
- Real prices, real names, real experiences

## TEMPLATE B: FESTIVAL GUIDE

Sections in order:
1. Origin Story (200-300 words)
2. What to Expect (200-300 words)
3. How to Plan (150-200 words)
4. What to Eat (150-200 words)
5. Tips for Visitors (150-200 words)
6. What the Guidebooks Don't Tell You (100-150 words)
7. Dates (50 words)
8. 🎒 Scott's Pro Tips
9. 🇵🇭 Jenice's Local Knowledge

## TEMPLATE C: REGIONAL FOOD GUIDE

Sections in order:
1. Regional Food Identity (2-3 paragraphs)
2. Signature Dishes (card-style entries)
3. Where to Eat (Breakfast / Lunch & Dinner / Street Food)
4. Cooking Classes
5. Market Guide
6. 🍴 How a Local Eats This (Jenice's perspective)

## TEMPLATE D: DISH DEEP-DIVE

Sections in order:
1. Origin Story (2-3 paragraphs)
2. The Regional Debate
3. Where to Eat the Best [Dish] (5-8 spots)
4. How It's Made (technique overview)
5. Ordering Guide (like a local)

## TEMPLATE E: PRACTICAL GUIDE

Sections in order:
1. Why This Matters (1-2 paragraphs)
2. The Essentials
3. Common Mistakes (3-5)
4. Pro Tips (3-5)
5. 💡 From Experience (Scott + Jenice combined perspective)
6. Quick Reference (table/summary)

## TEMPLATE F: WWII HERITAGE GUIDE

Documentary narrative structure for affluent heritage travelers. Longer pages (4,000-6,000 words for flagship content).

Sections in order:
1. **Hero** — Historical photo or memorial site image. Site name + era subtitle. No monetization here — respect and immersion.
2. **Historical Context** — 3-5 paragraphs: what happened, when, why it matters. Sourced from verified historical accounts.
3. **Personal Connection** — Scott's Arizona Memorial (2001) → Philippines journey narrative. Emotional anchor. E-E-A-T signal.
4. **Site-by-Site Guide** — Each memorial/site: location, hours, entrance fee, what to see, personal observations. Guided tour affiliate links here.
5. **Practical Visiting Info** — How to get there, how long to allocate, what to wear, sensitivity guidelines. Transport/accommodation affiliates.
6. **FAQ Section** — Historical and practical questions. FAQPage schema for AI Overviews.
7. **Related Heritage Sites** — Cross-links to other /history/ pages.
8. **AI Planner CTA** — "Plan a heritage trip" — pre-loaded with history interest.

## TEMPLATE G: SNORKELING PILLAR HUB

Hub-and-spoke architecture. 5,000-6,500 words. Optimized for featured snippet capture.

Sections in order:
1. **Hero** — Underwater video hero. "Best Snorkeling in the Philippines" title.
2. **Quick Facts Block** — When to go, water temps, visibility, gear rental availability. SpeakableSpecification.
3. **Featured Snippet Comparison Table** — Destination | Difficulty | Highlight | Best Time | Cost. Targets featured snippet.
4. **Destination Sections (x13)** — Each spoke: 300-500 word summary, hero image, Quick Facts mini-card, "Read Full Guide" link.
5. **Central Visayas Circuit** — Dumaguete → Siquijor → Bohol ferry-connected itinerary concept.
6. **Gear Guide** — What to bring, what to rent. Affiliate links for snorkel gear.
7. **AI Planner CTA** — "Plan a snorkeling trip" — pre-loaded with water activities.

## Content Authority Signatures

EVERY content template must include at least one of these:
- 🎒 **Scott's Pro Tips:** 3-5 practical logistics tips from 25+ trips
- 🇵🇭 **Jenice's Local Knowledge:** 2-3 cultural insights from Mabalacat, Pampanga perspective
- 🍴 **How a Local Eats This:** Jenice's pairing/ordering/family restaurant perspective
- 📸 **What the Guidebooks Don't Tell You:** Real-talk festival/experience tips
- 💡 **From Experience:** Combined Scott + Jenice perspective for practical guides
