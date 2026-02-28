# Google Maps Integration — Implementation Plan

## Executive Summary

Add Google Maps visualization to both the **AI Trip Planner** (`/plan/`) and the **Trip Companion** (`/companion/app/`) to show per-day route maps, activity locations, transport legs, and estimated travel times. The plan page already loads the Google Maps JS API and renders 56 destination markers — this plan extends that foundation into the itinerary display and the companion app.

**Outcome:** Users see their itinerary on an interactive map, with pins for every activity, polyline routes between stops, and real travel-time estimates. The companion app gains a dedicated Map tab and per-day inline maps in the Trip tab.

---

## Current State

| Component | Google Maps Status | Details |
|-----------|-------------------|---------|
| `/plan/` (Plan page) | **Active** — 56 destination markers | API key loaded, custom markers, InfoWindows, click-to-select. Key: `AIzaSyDH8mQKwqzyfCrgGZVDdP1-E-346QUiods` |
| `/plan/` itinerary result | **None** | Itinerary renders as HTML cards only — no map |
| `/companion/app/` Trip tab | **None** | Day activities render as list cards only |
| `/companion/app/` other tabs | **None** | No map in any tab |
| Itinerary data model | **No coordinates** | `Activity.directions` is a text string, no lat/lng |
| `TripDay` data model | **No coordinates** | `TripDay.location` is a string like "El Nido, Palawan" |
| API response (`generate-itinerary`) | **No coordinates** | `ApiDayItem` has description + category, no geo data |

### Existing API Key & Billing

The plan page already loads:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDH8mQKwqzyfCrgGZVDdP1-E-346QUiods&libraries=places"></script>
```

The `places` library is already included. Billing status and quota limits should be verified in Google Cloud Console before implementing Directions API and additional Places calls.

### Existing Destination Coordinates (56 markers)

The plan page has a `geoMarkers` array with lat/lng for all destinations:
```
Cebu: 10.3157, 123.8854
El Nido: 11.1784, 119.393
Siquijor: 9.2, 123.51
Coron: 12.0054, 120.2027
...56 total
```

This data can be reused as the "destination centroid" for any day that names a destination.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google Maps Platform                          │
│                                                                  │
│  Maps JavaScript API ─── Already loaded on /plan/                │
│  Places API (New)   ─── Place search, photos, details            │
│  Directions API     ─── Route polylines, ETAs, transport modes   │
│  Geocoding API      ─── Fallback: address string → lat/lng       │
│                                                                  │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
    ┌──────────▼──────────┐    ┌─────────▼──────────────┐
    │   /plan/ page       │    │  /companion/app/        │
    │                     │    │                          │
    │  Existing: dest map │    │  NEW: Map tab (6th tab)  │
    │  NEW: itinerary map │    │  NEW: inline day maps    │
    │  NEW: route lines   │    │  NEW: route navigation   │
    └─────────────────────┘    └──────────────────────────┘
               │                          │
    ┌──────────▼──────────────────────────▼──────────────┐
    │              Shared Data Layer                      │
    │                                                     │
    │  Activity.lat / Activity.lng  (new fields)          │
    │  Activity.placeId             (new field)           │
    │  TripDay.bounds               (new field)           │
    │  GeocodingCache               (localStorage)        │
    │  DestinationCoords            (shared constant)     │
    └────────────────────────────────────────────────────┘
```

---

## Phase 1: Data Model — Add Coordinates to Activities

### Goal
Every activity in a generated itinerary should carry lat/lng coordinates so maps can render without additional API calls at display time.

### 1A. Extend `Activity` interface in `companion-shared.ts`

```typescript
interface Activity {
  // ... existing fields ...
  lat?: number;          // NEW — latitude
  lng?: number;          // NEW — longitude
  placeId?: string;      // NEW — Google Place ID for deep linking
}
```

### 1B. Extend `TripDay` interface

```typescript
interface TripDay {
  // ... existing fields ...
  bounds?: {             // NEW — map viewport for this day
    north: number;
    south: number;
    east: number;
    west: number;
  };
}
```

### 1C. Extend `ApiDayItem` in `generate-itinerary.ts`

```typescript
interface ApiDayItem {
  // ... existing fields ...
  locationName?: string;   // NEW — e.g., "Nacpan Beach", "El Nido Lio Airport"
}
```

Add `locationName` to the Claude prompt instructions so the AI returns a specific, geocodable place name for each activity item. This is the most cost-effective approach — the AI already knows the places and can name them precisely.

### 1D. Shared destination coordinates constant

Extract the 56-marker `geoMarkers` array from `plan.astro` into a shared module:

**New file:** `src/data/destination-coords.ts`

```typescript
export const DESTINATION_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  siquijor: { lat: 9.2, lng: 123.51, label: 'Siquijor' },
  cebu: { lat: 10.3157, lng: 123.8854, label: 'Cebu' },
  // ... all 56
};
```

Both `plan.astro` and the companion app import from this single source of truth.

### 1E. Geocoding strategy in `transform-itinerary.ts`

When transforming an API response into `TripData`, resolve coordinates for each activity:

```
Priority order:
1. If activity.locationName matches a known landmark → use hardcoded coords
2. If activity.destination matches DESTINATION_COORDS → use as fallback centroid
3. If neither → geocode activity.locationName via Geocoding API (batched, cached)
```

**Known landmarks database** — Build a static lookup of ~200 popular Philippine POIs:

**New file:** `src/data/landmark-coords.ts`

```typescript
export const LANDMARK_COORDS: Record<string, { lat: number; lng: number }> = {
  // El Nido
  'nacpan beach': { lat: 11.2483, lng: 119.3867 },
  'el nido lio airport': { lat: 11.2024, lng: 119.4162 },
  'big lagoon': { lat: 11.1863, lng: 119.3241 },
  'small lagoon': { lat: 11.1875, lng: 119.3273 },
  'secret lagoon': { lat: 11.1608, lng: 119.3433 },
  // Cebu
  'kawasan falls': { lat: 9.8085, lng: 123.4256 },
  'oslob whale sharks': { lat: 9.4612, lng: 123.3815 },
  'tops lookout cebu': { lat: 10.3436, lng: 123.8897 },
  // Coron
  'kayangan lake': { lat: 11.9942, lng: 120.2389 },
  'twin lagoon': { lat: 12.0105, lng: 120.1908 },
  'maquinit hot springs': { lat: 11.9814, lng: 120.2622 },
  // ... ~200 entries covering top activities at all 43 destinations
};
```

This avoids the vast majority of Geocoding API calls. The AI-generated `locationName` is normalized (lowercased, trimmed) and matched against this dictionary. Only truly unknown locations hit the Geocoding API.

### 1F. Geocoding API fallback (server-side)

For locations not in the static database, add a lightweight geocoding step in the `generate-itinerary` API route, **after** Claude returns the itinerary but before sending the response:

```typescript
// In generate-itinerary.ts, after AI response parsing:
for (const day of itinerary.days) {
  for (const item of day.items) {
    const key = item.locationName?.toLowerCase().trim();
    if (key && LANDMARK_COORDS[key]) {
      item.lat = LANDMARK_COORDS[key].lat;
      item.lng = LANDMARK_COORDS[key].lng;
    } else if (DESTINATION_COORDS[day.destination]) {
      item.lat = DESTINATION_COORDS[day.destination].lat;
      item.lng = DESTINATION_COORDS[day.destination].lng;
    }
    // Geocoding API call only if both lookups fail — expected <5% of items
  }
}
```

**Cost note:** Geocoding API is $5 per 1,000 requests. With the static database covering 95%+ of activities, expect <10 geocoding calls per itinerary = $0.05/itinerary worst case. Most itineraries will need zero.

---

## Phase 2: Plan Page — Itinerary Route Map

### Goal
When the user generates an itinerary on `/plan/`, show an interactive map alongside the day-by-day cards with route polylines and activity pins.

### 2A. Itinerary map container

Add a map div inside `#itineraryResult` that renders after itinerary generation:

```html
<div id="itineraryMapContainer" class="plan-itin-map" style="display:none;">
  <div id="itineraryMap" style="width:100%; height:400px; border-radius:16px;"></div>
  <div class="plan-itin-map-legend">
    <!-- Day color legend pills -->
  </div>
</div>
```

### 2B. Map initialization after itinerary loads

After the itinerary HTML is injected into `#itineraryResult`, initialize a second Google Map instance:

```javascript
function renderItineraryMap(itinerary) {
  const mapEl = document.getElementById('itineraryMap');
  const map = new google.maps.Map(mapEl, {
    zoom: 7,
    center: { lat: 11.0, lng: 122.0 }, // Philippines center
    mapTypeControl: false,
    streetViewControl: false,
    styles: CUSTOM_MAP_STYLES, // Match site design tokens
  });

  const bounds = new google.maps.LatLngBounds();
  const dayColors = ['#0D7377', '#E8654A', '#5B21B6', '#059669', '#9A3412', '#1565C0', '#991B1B'];

  itinerary.days.forEach((day, i) => {
    const color = dayColors[i % dayColors.length];
    const dayCoords = [];

    day.items.forEach((item, j) => {
      if (!item.lat || !item.lng) return;
      const pos = { lat: item.lat, lng: item.lng };
      bounds.extend(pos);
      dayCoords.push(pos);

      // Numbered marker
      new google.maps.Marker({
        position: pos,
        map,
        label: { text: String(j + 1), color: '#fff', fontSize: '11px', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: `Day ${day.dayNumber}: ${item.title || item.description}`,
      });
    });

    // Route polyline for this day
    if (dayCoords.length >= 2) {
      new google.maps.Polyline({
        path: dayCoords,
        strokeColor: color,
        strokeOpacity: 0.7,
        strokeWeight: 3,
        geodesic: true,
        map,
      });
    }
  });

  map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
}
```

### 2C. Day filtering

Add day-filter pills above the map so users can toggle visibility per day:

```javascript
// Toggle markers/polylines per day
function toggleDayOnMap(dayIndex, visible) {
  dayMarkers[dayIndex].forEach(m => m.setVisible(visible));
  dayPolylines[dayIndex].setVisible(visible);
}
```

### 2D. Map ↔ card sync

- **Click map pin** → scroll to corresponding activity card, highlight it
- **Click activity card** → pan map to that pin, open InfoWindow
- **Hover day pill** → highlight that day's route on map

### 2E. Layout

- Desktop: map and cards side-by-side (60% cards / 40% map, sticky map)
- Mobile: map above cards (collapsible, 250px height)
- Map collapses to a "Show Map" button on small screens to save vertical space

---

## Phase 3: Companion App — Map Tab & Inline Maps

### Goal
Add a 6th "Map" tab to the companion app and embed small inline maps in the Trip tab's day view.

### 3A. New Map tab

Add to `TAB_CONFIG` in `TripCompanion.tsx`:

```typescript
const TAB_CONFIG = [
  { id: 'trip', icon: '📋', label: 'Trip' },
  { id: 'map', icon: '🗺️', label: 'Map' },      // NEW — position 2
  { id: 'edit', icon: '✏️', label: 'Edit' },
  { id: 'updates', icon: '🔔', label: 'Updates' },
  { id: 'history', icon: '📜', label: 'History' },
  { id: 'tools', icon: '🧰', label: 'Tools' },
];
```

Six tabs in the bottom bar is the maximum for mobile UX. The Map tab slots in as the second tab since it's the second most-used view after Trip.

### 3B. MapTab component

**New file:** `src/components/companion/MapTab.tsx`

```typescript
interface MapTabProps {
  tripData: TripData;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onActivityClick: (dayIndex: number, activityId: string) => void;
}
```

**Features:**
1. Full-height map (fills available space between header and tab bar)
2. Day selector pills overlaid at top of map
3. Colored pins for each activity, numbered within the day
4. Polyline connecting activities in order
5. InfoWindow on pin tap showing: time, title, type icon, price
6. "Navigate" button in InfoWindow → opens Google Maps app with directions
7. Current day auto-selected, other days shown as faded pins
8. Fit bounds to selected day's activities

**Map loading strategy:**

Since the companion app is a React island (`client:load`), load Google Maps via the `@googlemaps/js-api-loader` npm package rather than a `<script>` tag:

```typescript
import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: import.meta.env.PUBLIC_GOOGLE_MAPS_KEY,
  version: 'weekly',
  libraries: ['places', 'routes'],
});
```

Store the API key in Cloudflare environment variable `PUBLIC_GOOGLE_MAPS_KEY` rather than hardcoding.

### 3C. Inline day maps in Trip tab

In the Trip tab, add a small map preview (180px height) at the top of each day's activity list:

```typescript
// Inside TripTab, above the activity cards:
<div className="companion-day-map" style={{ height: 180, borderRadius: 12, overflow: 'hidden' }}>
  <CompanionMiniMap
    activities={currentDay.items.filter(a => a.lat && a.lng)}
    dayColor={DAY_COLORS[selectedDay % DAY_COLORS.length]}
    onPinClick={(activityId) => scrollToActivity(activityId)}
  />
</div>
```

This mini-map is non-interactive (zoom/pan disabled) — just a visual reference. Tapping it opens the full Map tab with that day selected.

### 3D. CompanionMiniMap component

**New file:** `src/components/companion/CompanionMiniMap.tsx`

A lightweight wrapper that renders a static-style Google Map:

```typescript
interface CompanionMiniMapProps {
  activities: Array<{ lat: number; lng: number; title: string; icon: string }>;
  dayColor: string;
  onPinClick?: (index: number) => void;
}
```

- Renders numbered markers at each activity location
- Fits bounds to show all activities
- No controls (gestureHandling: 'none')
- Custom minimal styling (no POIs, no transit, muted colors)

### 3E. Navigation deep links

Each activity's InfoWindow includes a "Navigate" button that opens the native Google Maps app:

```typescript
function openNavigation(lat: number, lng: number, label: string) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${placeId || ''}&travelmode=driving`;
  window.open(url, '_blank');
}
```

This works on both iOS and Android — the OS intercepts the `google.com/maps` URL and opens the native app if installed.

---

## Phase 4: Directions API — Route Lines & ETAs

### Goal
Show actual road/ferry routes (not straight lines) between activities, with estimated travel times.

### 4A. When to call Directions API

**NOT on every page load.** Call Directions API once during itinerary generation (server-side) and cache the results:

```typescript
// In generate-itinerary.ts, after geocoding:
for (const day of itinerary.days) {
  const waypoints = day.items
    .filter(item => item.lat && item.lng)
    .map(item => ({ lat: item.lat, lng: item.lng }));

  if (waypoints.length >= 2) {
    const route = await getDirectionsRoute(waypoints, day);
    day.routePolyline = route.encodedPolyline;  // Encoded polyline string
    day.routeLegs = route.legs;                  // Array of { duration, distance }
  }
}
```

### 4B. Extend data model for routes

```typescript
interface TripDay {
  // ... existing fields ...
  routePolyline?: string;    // NEW — Google encoded polyline for the full day route
  routeLegs?: RouteLeg[];    // NEW — leg data between consecutive activities
}

interface RouteLeg {
  fromActivityId: string;
  toActivityId: string;
  durationMinutes: number;    // e.g., 45
  durationText: string;       // e.g., "45 mins"
  distanceKm: number;         // e.g., 32.5
  distanceText: string;       // e.g., "32.5 km"
  travelMode: 'driving' | 'walking' | 'ferry' | 'flight';
}
```

### 4C. Display travel time between activities

In both the Plan page and Companion Trip tab, render travel-time chips between activity cards:

```html
<!-- Between activity cards -->
<div class="travel-leg">
  <span class="travel-leg-icon">🚐</span>
  <span class="travel-leg-text">45 mins · 32.5 km</span>
</div>
```

### 4D. Transport mode detection

The AI already assigns `category: 'transport' | 'ferry'` to transport items. Use this to set the Directions API travel mode:

| Activity category/keyword | Travel mode | Directions API mode |
|---------------------------|-------------|---------------------|
| `flight` in description | Flight | Skip Directions (straight line + flight time) |
| `ferry` category | Ferry | Skip Directions (straight line + ferry time) |
| `tricycle`, `trike`, `scooter` | Driving | `DRIVING` |
| `walk`, `walking` | Walking | `WALKING` |
| Default between activities | Driving | `DRIVING` |

For flights and ferries, use straight-line rendering with estimated durations from the AI text rather than Directions API.

### 4E. Render encoded polylines

On the client, decode the stored polyline and render:

```javascript
const decodedPath = google.maps.geometry.encoding.decodePath(day.routePolyline);
new google.maps.Polyline({
  path: decodedPath,
  strokeColor: dayColor,
  strokeOpacity: 0.8,
  strokeWeight: 4,
  map,
});
```

Requires adding `geometry` to the libraries list.

### 4F. Cost control

| API | Price | Expected usage per itinerary | Cost per itinerary |
|-----|-------|-----------------------------|--------------------|
| Directions | $5 / 1,000 requests | 5–7 days = 5–7 requests | $0.025–0.035 |
| Geocoding | $5 / 1,000 requests | 0–5 fallback requests | $0.00–0.025 |
| Maps JS (loads) | $7 / 1,000 loads | 1 per page view | $0.007 |
| Places (details) | $17 / 1,000 requests | 0 (Phase 5 only) | $0.00 |
| **Total per itinerary** | | | **~$0.03–0.07** |

Combined with the Claude API cost ($0.03/itinerary), total cost per itinerary generation rises to ~$0.06–0.10. Still well within the $0.50–2.00 affiliate revenue per itinerary.

**Rate limit the Directions calls** to match the existing itinerary rate limits (3/day anonymous, 10/day with email, 200/day global).

---

## Phase 5: Enhanced Places Integration (Future)

### Goal
Enrich activity cards with Google Places data — photos, ratings, hours, phone numbers.

### 5A. Place ID resolution

During itinerary generation, resolve Google Place IDs for key activities:

```typescript
// Places API (New) — Text Search
const response = await fetch(
  `https://places.googleapis.com/v1/places:searchText`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.rating,places.photos',
    },
    body: JSON.stringify({
      textQuery: `${item.locationName}, Philippines`,
      locationBias: {
        circle: { center: { latitude: item.lat, longitude: item.lng }, radiusMeters: 5000 },
      },
    }),
  }
);
```

### 5B. Data enrichment

Store on `Activity`:
```typescript
interface Activity {
  // ... existing + Phase 1 fields ...
  placeId?: string;        // Google Place ID
  placeRating?: number;    // e.g., 4.5
  placePhotoRef?: string;  // Photo reference for Places Photos API
  placeHours?: string;     // e.g., "Open 8AM–5PM"
  placePhone?: string;     // e.g., "+63 917 123 4567"
}
```

### 5C. Photo thumbnails

Show a small thumbnail on activity cards using the Places Photos API:

```
https://places.googleapis.com/v1/{photoRef}/media?maxHeightPx=200&maxWidthPx=300&key={API_KEY}
```

### 5D. Cost note

Places API (New) pricing:
- Text Search: $32 / 1,000 requests
- Place Details: $17 / 1,000 requests
- Photos: $7 / 1,000 requests

At ~20 activities per itinerary, this adds ~$0.64 per itinerary for text search alone. **This is expensive** relative to the current $0.03 AI cost. Mitigation strategies:

1. **Only resolve for accommodation and top activities** (not transport/food) — ~5 per itinerary = $0.16
2. **Cache aggressively** — Same places appear across itineraries (e.g., Kawasan Falls, Nacpan Beach)
3. **Make it opt-in** — "Enrich with photos & ratings" button, not automatic
4. **Defer to Phase 5** — Ship maps without Places enrichment first

---

## Phase 6: Offline Maps (Future, PWA)

### Goal
Cache map tiles for offline use in the companion app's Service Worker.

### 6A. Strategy

Google Maps JS API doesn't support true offline tile caching (ToS restriction). Two alternatives:

**Option A: Static map images**
- On itinerary generation, request Static Maps API images for each day
- Cache the images in the Service Worker
- Display cached images when offline, with a "Map unavailable offline" overlay
- Cost: $2 / 1,000 static map requests = $0.014 per itinerary (7 days × 1 image each)

**Option B: OpenStreetMap tiles (free)**
- Use Leaflet + OSM tiles for the offline map layer
- Pre-cache tiles at zoom levels 8–14 for the itinerary bounding box
- Use Google Maps for online, Leaflet/OSM for offline fallback
- Cost: Free (OSM tile servers, subject to fair use policy)

**Recommendation:** Option B for offline, Option A as fallback. Full offline maps are a Phase 6 concern — ship online-only first.

---

## Implementation Order & File Changes

### Phase 1 — Data Model (2–3 hours)

| # | Action | File | Type |
|---|--------|------|------|
| 1 | Extract destination coords to shared module | `src/data/destination-coords.ts` | CREATE |
| 2 | Create landmark coords database (~200 POIs) | `src/data/landmark-coords.ts` | CREATE |
| 3 | Add `lat`, `lng`, `placeId` to Activity interface | `src/components/companion/companion-shared.ts` | MODIFY |
| 4 | Add `bounds`, `routePolyline`, `routeLegs` to TripDay | `src/components/companion/companion-shared.ts` | MODIFY |
| 5 | Add `locationName` to ApiDayItem; update Claude prompt | `src/pages/api/generate-itinerary.ts` | MODIFY |
| 6 | Add geocoding resolution in transform step | `src/components/companion/transform-itinerary.ts` | MODIFY |
| 7 | Import shared coords in plan.astro (replace inline array) | `src/pages/plan.astro` | MODIFY |
| 8 | Update mock trip data with coordinates | `src/data/mock-trip-palawan-family.json` | MODIFY |
| 9 | Move API key to env variable `PUBLIC_GOOGLE_MAPS_KEY` | `wrangler.jsonc` + `.dev.vars` | MODIFY |

### Phase 2 — Plan Page Itinerary Map (3–4 hours)

| # | Action | File | Type |
|---|--------|------|------|
| 1 | Add itinerary map container HTML | `src/pages/plan.astro` | MODIFY |
| 2 | Add `renderItineraryMap()` function | `src/pages/plan.astro` | MODIFY |
| 3 | Add day-filter pills + legend | `src/pages/plan.astro` | MODIFY |
| 4 | Add map ↔ card click/scroll sync | `src/pages/plan.astro` | MODIFY |
| 5 | Add CSS for map layout (desktop side-by-side, mobile stacked) | `src/pages/plan.astro` | MODIFY |
| 6 | Custom map styles matching design system | `src/data/map-styles.ts` | CREATE |

### Phase 3 — Companion App Maps (4–6 hours)

| # | Action | File | Type |
|---|--------|------|------|
| 1 | Install `@googlemaps/js-api-loader` | `package.json` | MODIFY |
| 2 | Create MapTab component | `src/components/companion/MapTab.tsx` | CREATE |
| 3 | Create CompanionMiniMap component | `src/components/companion/CompanionMiniMap.tsx` | CREATE |
| 4 | Add Map tab to TAB_CONFIG, wire routing | `src/components/companion/TripCompanion.tsx` | MODIFY |
| 5 | Add inline mini-map to Trip tab day header | `src/components/companion/TripCompanion.tsx` | MODIFY |
| 6 | Add "Navigate" deep link to activity InfoWindow | `src/components/companion/MapTab.tsx` | (included in #2) |
| 7 | Add Google Maps script to companion app page | `src/pages/companion/app.astro` | MODIFY |

### Phase 4 — Directions & Routes (3–4 hours)

| # | Action | File | Type |
|---|--------|------|------|
| 1 | Add Directions API call after geocoding | `src/pages/api/generate-itinerary.ts` | MODIFY |
| 2 | Store encoded polylines + leg data in response | `src/pages/api/generate-itinerary.ts` | MODIFY |
| 3 | Render decoded polylines on plan page map | `src/pages/plan.astro` | MODIFY |
| 4 | Render decoded polylines in companion MapTab | `src/components/companion/MapTab.tsx` | MODIFY |
| 5 | Add travel-time chips between activity cards | `src/components/companion/TripCompanion.tsx` | MODIFY |
| 6 | Add travel-time chips in plan page itinerary | `src/pages/plan.astro` | MODIFY |
| 7 | Add `geometry` library to Maps loader | Multiple files | MODIFY |

### Phase 5 — Places Enrichment (Future, 4–6 hours)

| # | Action | File | Type |
|---|--------|------|------|
| 1 | Add Places text search for key activities | `src/pages/api/generate-itinerary.ts` | MODIFY |
| 2 | Store Place IDs, ratings, photo refs | `src/components/companion/companion-shared.ts` | MODIFY |
| 3 | Render photo thumbnails on activity cards | `src/components/companion/TripCompanion.tsx` | MODIFY |
| 4 | Add Places cache table in D1 | Migration script | CREATE |

### Phase 6 — Offline Maps (Future, 6–8 hours)

| # | Action | File | Type |
|---|--------|------|------|
| 1 | Add Leaflet as offline fallback | `package.json` | MODIFY |
| 2 | Create Service Worker with tile caching | `public/sw.js` | CREATE |
| 3 | Pre-cache OSM tiles for itinerary bounds | Service Worker logic | CREATE |
| 4 | Online/offline map switching logic | `src/components/companion/MapTab.tsx` | MODIFY |

---

## API Key & Security

### Current state
The API key is hardcoded in `plan.astro`:
```
AIzaSyDH8mQKwqzyfCrgGZVDdP1-E-346QUiods
```

### Required changes

1. **Move to environment variable:**
   - `PUBLIC_GOOGLE_MAPS_KEY` in Cloudflare Pages env vars
   - Access via `import.meta.env.PUBLIC_GOOGLE_MAPS_KEY` in Astro
   - The key must be public (client-side Maps JS), but restrict it

2. **API key restrictions in Google Cloud Console:**
   - **HTTP referrer restrictions:** `discoverphilippines.info/*`, `discover-philippines.pages.dev/*`, `localhost:4321/*`
   - **API restrictions:** Enable only Maps JavaScript API, Places API (New), Directions API, Geocoding API, Static Maps API
   - **Budget alert:** Set at $50/month (covers ~500–700 itineraries/month)

3. **Server-side key for Directions/Geocoding:**
   - Create a separate API key with no referrer restriction
   - Store as `GOOGLE_MAPS_SERVER_KEY` (not `PUBLIC_`) — never exposed to client
   - Use in `generate-itinerary.ts` for server-side Directions and Geocoding calls

---

## Custom Map Styling

Match the site's design system for a cohesive look:

```typescript
export const MAP_STYLES = [
  // Mute most POIs to reduce clutter
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'on' }] },
  // Water — Ocean Teal tint
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#E8F4F5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0D7377' }] },
  // Land — Sand tint
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F5F0E8' }] },
  // Roads — subtle
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#EBE4D8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#D4A574' }] },
  // Transit — muted
  { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
];
```

Day-color palette for pins and polylines:
```typescript
export const DAY_COLORS = [
  '#0D7377', // Ocean Teal — Day 1
  '#E8654A', // Warm Coral — Day 2
  '#5B21B6', // Purple — Day 3
  '#059669', // Green — Day 4
  '#9A3412', // Amber — Day 5
  '#1565C0', // Blue — Day 6
  '#991B1B', // Red — Day 7
  '#78350F', // Brown — Day 8+
];
```

---

## Cost Projections

### Monthly cost at various scales

| Itineraries/month | AI (Claude) | Maps JS Loads | Directions | Geocoding | Total Maps | Total All |
|-------------------|-------------|---------------|------------|-----------|------------|-----------|
| 50 | $1.50 | $0.35 | $1.75 | $0.25 | $2.35 | $3.85 |
| 200 | $6.00 | $1.40 | $7.00 | $1.00 | $9.40 | $15.40 |
| 500 | $15.00 | $3.50 | $17.50 | $2.50 | $23.50 | $38.50 |
| 1,000 | $30.00 | $7.00 | $35.00 | $5.00 | $47.00 | $77.00 |

**Google Maps Platform free tier:** $200/month credit covers ~400 itineraries with full Directions integration, or ~28,500 Maps JS loads alone.

**Break-even:** At $0.50 minimum affiliate revenue per itinerary, break-even is ~77 itineraries/month at the 500-scale cost. The $200 free credit means the first ~400 itineraries/month are effectively free for maps.

### Cost optimization tactics

1. **Cache Directions results** — Same route (Cebu → Bohol) produces identical polylines. Cache in D1 with 30-day TTL.
2. **Skip Directions for single-destination days** — If all activities are in the same city, use straight-line connections (no API call needed).
3. **Lazy-load Maps JS** — Only load on plan page when user scrolls to map section or generates an itinerary. Use `loading=async` or dynamic `<script>` injection.
4. **Static Maps for email** — Use Static Maps API ($2/1,000) for the emailed itinerary rather than embedding interactive maps.

---

## Recommended Ship Order

| Priority | Phase | What ships | User impact |
|----------|-------|-----------|-------------|
| **P0** | Phase 1 | Data model + geocoding | Foundation — no visible change, but enables everything |
| **P1** | Phase 2 | Plan page itinerary map | Immediate "wow" factor — users see their trip on a map |
| **P2** | Phase 3 | Companion Map tab + mini maps | Companion app gains its most-requested feature |
| **P3** | Phase 4 | Directions routes + ETAs | Travel time between stops — practical value |
| **P4** | Phase 5 | Places photos + ratings | Polish — nice to have, expensive |
| **P5** | Phase 6 | Offline maps | PWA completeness — long-term |

**Phases 1–3 can ship as one release.** Phase 4 is a separate release. Phases 5–6 are future enhancements.

---

## Testing Checklist

- [ ] Plan page: generate itinerary → map renders with pins and route lines
- [ ] Plan page: click pin → scroll to activity card
- [ ] Plan page: click activity card → pan map to pin
- [ ] Plan page: day filter pills toggle marker visibility
- [ ] Plan page: mobile layout — map stacks above cards
- [ ] Companion: Map tab renders full-trip map
- [ ] Companion: day selector on Map tab filters pins
- [ ] Companion: tap pin → InfoWindow with activity details
- [ ] Companion: "Navigate" button opens Google Maps app
- [ ] Companion: Trip tab mini-map renders for each day
- [ ] Companion: tap mini-map → switch to Map tab
- [ ] Activities without coordinates gracefully omitted from map
- [ ] API key restricted to allowed domains
- [ ] Server-side Directions calls work in Cloudflare Worker
- [ ] Build passes with no errors
- [ ] Maps load on first visit (no FOUC or blank state)
- [ ] Maps degrade gracefully if API key fails or quota exceeded
