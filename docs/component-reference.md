# Component Reference & Build Order

## Build Order (Dependencies Matter)

Build in this EXACT order. Components with dependencies cannot be built until their deps exist.

### Phase 1: Blocker Components (4.5–6.5 hours total)

| # | Component | Build Time | Depends On | What It Does |
|---|-----------|-----------|------------|-------------|
| 1 | `EmailCapture.astro` | 15–20 min | None | Kit/ConvertKit form + GDPR consent checkbox. Region-specific lead magnets. Build shell even if Kit not configured yet. |
| 2 | `FAQ.astro` | 20–30 min | None | Accordion FAQ with toggle interaction. Auto-generates FAQPage JSON-LD. Takes `{question, answer}[]` from frontmatter. |
| 3 | `SchemaMarkup.astro` | 45–60 min | None | JSON-LD structured data injection for all page types. See Schema by Page Type section below. |
| 4 | `FloatingNav.astro` | 30–45 min | None | Dual navigation: mobile bottom tab bar (fixed) + desktop top nav bar. Transparent → solid on scroll via IntersectionObserver. Active link detection via `Astro.url.pathname`. Mobile hamburger menu. |
| 5 | `Footer.astro` | 20–30 min | #1 | 3-column grid: brand column, destination links, explore links, legal links. EmailCapture embedded. FTC disclosure. |
| 6 | `QuickFacts.astro` | 30–45 min | #3 | GEO-critical structured card. Sky (#E8F4F5) background. Renders budget, best time, getting there from frontmatter. SpeakableSpecification schema. **Single most important GEO tactic.** |
| 7 | `BaseLayout.astro` | 30 min | #3, #4, #5 | Root layout: HTML shell, SEO meta (OG, Twitter cards, canonical URL), imports FloatingNav + Footer + global styles. Analytics injection. |
| 8 | `DestinationLayout.astro` | 60–90 min | #6, #7, #2 | Transforms destination Markdown → complete styled page. Hero with per-destination gradient, QuickFacts bar, byline, editorial sections, ImmersiveBreaks, FAQ, email capture. |
| 9 | Author Pages (`/about/scott`, `/about/jenice`) | 45–60 min | #3 | ProfilePage + Person schema. Bio, credentials, content authored list. Required by Feb 2026 Core Update. |

### Phase 2: High-Priority Components (3.5–5 hours additional)

| Component | Build Time | What It Does |
|-----------|-----------|-------------|
| `Breadcrumb.astro` | 15–20 min | Visual breadcrumb trail + BreadcrumbList JSON-LD schema |
| `ImmersiveBreak.astro` | 30–40 min | Full-viewport (55vh) video-background section. Destination gradient overlay. Fallback: CSS gradient if video fails. Short evocative heading + optional pull quote. |
| `Video360Embed.astro` | 30–40 min | Cloudinary 360° video wrapper. Lazy loading, poster image, play button. |
| `AudioMemoryPlayer.astro` | 25–35 min | Audio player for personal Story Recorder clips. AudioObject schema. |
| `OurPickCard.astro` | 20–25 min | Contextual affiliate card. Photo, name, price, personal note, "We stayed here" badge. |
| `CompleteTripFooter.astro` | 20–25 min | Grouped affiliate section at page bottom. Books entire trip in one section. |
| `FTCDisclosure.astro` | 10 min | Required affiliate disclosure banner. |
| `CookieConsent.astro` | 20–30 min | GDPR consent banner (Astro island for client-side JS). No GA4 until consent given. |
| `BlogLayout.astro` | 30–45 min | Blog post template. Article schema, author byline, reading time, tags. |
| `HeritageLayout.astro` | 30–45 min | WWII page template. Documentary narrative structure, historical photography. |
| `SnorkelingPillarLayout.astro` | 30–45 min | Hub page template. Comparison table, spoke sections, circuit map. |

## Component Props Reference

| Component | Props | Revenue? |
|-----------|-------|----------|
| `<QuickFacts>` | destination data from frontmatter | No — GEO/SEO |
| `<FAQ>` | `items[]` ({question, answer}) | No |
| `<PlannerCTA>` | destination, festival, text | Indirect |
| `<Video360>` | cloudinaryId, poster, alt | No |
| `<ImmersiveBreak>` | videoSrc, gradient, overlayVariant, title, text | No |
| `<EmailCapture>` | leadMagnet, placement, variant | No |
| `<BreadcrumbNav>` | path[] | No — SEO |
| `<AudioMemoryPlayer>` | author, destination, audioSrc, transcript | No |
| `<OurPickCard>` | name, photo, price, note, affiliateUrl | **Yes** |
| `<CompleteTripFooter>` | items[], region | **Yes** |
| `<ContributorByline>` | author, verifier, credentials | Trust |
| `<FTCDisclosure>` | placement (footer\|inline) | Compliance |
| `<CookieConsent>` | region (auto-detect) | Compliance |
| `<SchemaMarkup>` | pageType, data | No — SEO/GEO |
| `<FloatingNav>` | links[], logo | No |
| `<RelatedDestCard>` | name, videoSrc, hook, url | No |

## Interactive Map — Zoom & Pan Pattern

Every Philippines map uses the same zoom/pan behavior. Implemented inline per page (not a shared component) due to page-specific CSS class prefixes.

### Pages with maps

| Page | SVG ID | CSS prefix | Wrapper class |
|------|--------|-----------|---------------|
| Homepage (`index.astro`) | `hpPhMap` | `hp-` | `.hp-map-svg-wrap` |
| Snorkeling (`snorkeling-philippines/index.astro`) | `snkPhMap` | `snk-` | `.snk-map-svg-wrap` |
| AI Trip Planner (`plan.astro`) | `phMap` | (none) | `.map-svg-wrap` |

### Controls

- **+ / − buttons** — zoom in/out by 0.5x steps, top-right corner overlay
- **Reset button (↺)** — appears when zoomed, resets to 1x
- **Mouse wheel** — smooth zoom centered on cursor
- **Drag to pan** — pointer drag when zoomed >1x
- **Pinch zoom** — two-finger gesture on touch devices

### Specs

- Zoom range: 1x – 3.5x
- Step: 0.5x per click, 0.2x per wheel tick
- Pan clamping: prevents scrolling past map edges
- Transition: `transform 0.25s ease` (disabled during drag for responsiveness)
- Button style: 32×32px, `rgba(26,35,50,0.8)` bg, `backdrop-filter: blur(8px)`, 8px border-radius
- Hover: Ocean Teal background `rgba(13,115,119,0.6)`

### Map path source

Island paths derived from `shutterstock_1411662776.eps` (professional vector, 2100×2100 BoundingBox). Transformed to SVG viewBox `0 0 520 780` with scale factor 0.3965, offset (20.0, 35.8). 25 paths classified into 4 regions (Luzon, Visayas, Palawan, Mindanao).

## Schema Markup by Page Type

| Page Type | Schema Types | GEO Signal |
|-----------|-------------|------------|
| Homepage | Organization + WebSite + SearchAction | Brand entity definition |
| Destination | TouristDestination + Place + FAQPage + SpeakableSpecification | Primary AI extraction target |
| WWII Heritage | TouristDestination + Place + FAQPage + SpeakableSpecification | Heritage niche authority |
| Snorkeling Hub | WebPage + ItemList (spokes) + FAQPage | Topical hub authority |
| Blog Post | Article + author Person reference | Content freshness signal |
| Author Page | ProfilePage + Person (sameAs, knowsAbout, worksFor) | E-E-A-T entity authority |
| All Pages | BreadcrumbList | Site hierarchy for AI navigation |

## Layouts

| Layout | Purpose |
|--------|---------|
| `BaseLayout.astro` | Root: HTML shell, SEO meta, FloatingNav, Footer, global styles, analytics |
| `DestinationLayout.astro` | Wraps BaseLayout. Hero with gradient, QuickFacts, highlights, editorial + ImmersiveBreak sections |
| `BlogLayout.astro` | Article schema, author byline, reading time, tags |
| `HeritageLayout.astro` | Documentary narrative, historical photography, memorial site details |
| `SnorkelingPillarLayout.astro` | Hub-and-spoke, comparison table, spoke sections, circuit map |

## Content Collections (src/content/config.ts)

### destinations
- region (enum: visayas/luzon/mindanao), budgetPerDay (object), highlights (array), contentStatus, gradientColors
- v3 additions: difficulty (string), waterTemperature (string), snorkelingSpots (array), nearbyWWIISites (array), speakableSelectors (array)
- Status workflow: `draft → review → published → needs-update`

### blog
- Categories: destination, food, festival, practical, budget

### history (WWII Heritage)
- title, subtitle, slug, heroImage, era, location ({province, region, coordinates}), visitingInfo ({hours, entranceFee, duration, dressCode}), relatedSites[], nearestDestination, guidedTours[], faqs[], personalConnection

### author
- name, slug, image, bio, credentials[], knowsAbout[], sameAs[], worksFor, contentAuthored (auto)

## Routing

| Route | File | Notes |
|-------|------|-------|
| `/` | `index.astro` | Homepage |
| `/destinations/[slug]` | `destinations/[...slug].astro` | Dynamic from destinations collection |
| `/history/[slug]` | `history/[...slug].astro` | WWII heritage pages |
| `/festivals/[name]` | `festivals/[...name].astro` | Festival guides |
| `/food/[region]` | `food/[...region].astro` | Regional food guides |
| `/food/dishes/[dish]` | `food/dishes/[...dish].astro` | Dish deep-dives |
| `/practical/[topic]` | `practical/[...topic].astro` | Practical guides |
| `/snorkeling-philippines/` | `snorkeling-philippines/index.astro` | Snorkeling pillar hub |
| `/blog/[slug]` | `blog/[...slug].astro` | Blog posts |
| `/plan/` | `plan.astro` | AI Trip Planner (SPA) |
| `/about/` | `about/index.astro` | Team overview |
| `/about/scott/` | `about/scott.astro` | Author page — E-E-A-T |
| `/about/jenice/` | `about/jenice.astro` | Author page — E-E-A-T |
| `/legal/privacy/` | `legal/privacy.astro` | Privacy policy |
| `/legal/affiliate-disclosure/` | `legal/affiliate-disclosure.astro` | FTC disclosure |
| `/legal/terms/` | `legal/terms.astro` | Terms of service |
| `/404` | `404.astro` | Custom error page |
