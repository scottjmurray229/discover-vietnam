# Design System Specification v2

All pages MUST use these design tokens. Do NOT invent new values.

## Color Palette — WCAG Validated

| Token | Hex | Usage | Contrast on White | WCAG |
|-------|-----|-------|-------------------|------|
| Ocean Teal (Primary) | #0D7377 | Headers, links, CTAs, nav accents | 4.6:1 | AA (normal text) |
| Ocean Teal Dark | #095456 | Hover states, active states | — | — |
| Ocean Teal Light | #11969B | Accents, highlights | — | — |
| Warm Coral (Accent) | #E8654A | Highlights, festival badges, urgency CTAs | 3.5:1 | **Large text only** |
| Coral Hover | #D4553B | Coral hover/active state | — | — |
| Deep Night (Text) | #1A2332 | H1/H2 headings, primary body text | 16.2:1 | AAA |
| Slate (Body) | #4A5568 | Paragraph text, secondary info | 7.0:1 | AAA |
| Sand (Background) | #F5F0E8 | Page backgrounds, card backgrounds | — | Neutral base |
| Sand Dark | #EBE4D8 | Card hover, borders | — | — |
| Sky (Highlight BG) | #E8F4F5 | Quick Facts blocks, callout boxes, GEO extraction targets | — | Subtle teal tint |
| Warm Gold | #D4A574 | Accent borders, premium indicators | 2.7:1 | **Decorative only** |
| Success Green | #38A169 | Availability, open now, confirmed | 3.3:1 | AA (large text) |

**CRITICAL:** Warm Coral and Warm Gold do NOT meet AA contrast on white for body text. Use only for large text (18px+), badges, decorative elements, or on dark backgrounds.

## Destination Gradients

Each destination has a signature gradient for hero overlays, ImmersiveBreak sections, and card accents.

| Destination | CSS Gradient | Mood |
|-------------|-------------|------|
| Siquijor | `linear-gradient(135deg, #4C1D95, #3730A3, #5B21B6)` | Purple/mystic |
| Cebu | `linear-gradient(135deg, #0E4D5C, #0D7377, #14B8A6)` | Teal/ocean |
| Bohol | `linear-gradient(135deg, #065F46, #059669, #34D399)` | Green/nature |
| Palawan | `linear-gradient(135deg, #064E3B, #0D7377, #06B6D4)` | Teal-blue/lagoon |
| Boracay | `linear-gradient(135deg, #9D174D, #E8654A, #FB923C)` | Coral-sunset |
| Clark | `linear-gradient(135deg, #78350F, #B45309, #F59E0B)` | Gold/heritage |
| Siargao | `linear-gradient(135deg, #0E7490, #14B8A6, #5EEAD4)` | Surf-teal |

## Typography — Exact Specs

**Display font:** DM Serif Display (serif) — headings, hero text, blockquotes
**Body font:** Outfit (sans-serif) — body text, navigation, UI, labels
Both loaded via Google Fonts.

| Element | Font | Weight | Size (Mobile / Desktop) | Line Height |
|---------|------|--------|------------------------|-------------|
| H1 (Page Title) | DM Serif Display | 400 (Regular) | 32px / 48px | 1.15 |
| H2 (Section) | DM Serif Display | 400 (Regular) | 24px / 32px | 1.25 |
| H3 (Subsection) | Outfit | 700 (Bold) | 18px / 22px | 1.35 |
| Body | Outfit | 400 (Regular) | 16px / 17px | 1.65 |
| Caption / Meta | Outfit | 300 (Light) | 13px / 14px | 1.5 |
| Button / CTA | Outfit | 600 (SemiBold) | 15px / 16px | 1.0 |
| Navigation | Outfit | 500 (Medium) | 15px / 15px | 1.0 |
| Blockquote | DM Serif Display | 400 Italic | 18px / 22px | 1.6 |
| Quick Facts Labels | Outfit | 600 (SemiBold) | 13px / 14px | 1.3 |
| Quick Facts Values | Outfit | 800 (ExtraBold) | 16px / 18px | 1.2 |

## Responsive Grid System

8px base grid with 4px half-grid for fine adjustments. 12-column CSS Grid on desktop, single column on mobile.

| Breakpoint | Width | Columns | Gutter | Content Max-Width |
|-----------|-------|---------|--------|-------------------|
| Mobile (default) | < 640px | 1 | 16px padding | 100% |
| Tablet | 640px–1023px | 6 or 12 | 24px | 640px |
| Desktop | 1024px–1279px | 12 | 24px | 960px |
| Wide | >= 1280px | 12 | 32px | 1120px |

## Spacing & Radius

- **Spacing grid:** 8px base (`--space-1` through `--space-24`)
- **Content widths:** `--content-width-sm/md/lg/prose`
- **Border radius:** sm (8px), md (16px), lg (24px), full (9999px)
- **Card shadow:** `0 2px 8px rgba(0,0,0,0.08)`
- **Elevated shadow:** `0 8px 24px rgba(0,0,0,0.12)`
- **Transition:** `0.4s cubic-bezier(0.4, 0, 0.2, 1)`

## Styling Architecture

- `global.css` handles design tokens and base styles via CSS custom properties
- Tailwind CSS for utility classes, design tokens mapped to Tailwind config
- Components use scoped `<style>` blocks
- Per-destination gradient classes: `.gradient-siquijor`, `.gradient-cebu`, etc.

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | ≥ 95 |
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |
| Time to Interactive | < 3.5s |
| Total Bundle Size (no video) | < 200KB |
