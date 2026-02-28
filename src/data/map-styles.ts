// Custom Google Maps styling matching the Discover Vietnam design system.
// Sand land, Sky water, muted POIs.

export const MAP_STYLES = [
  // Mute most POIs to reduce clutter
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'on' }] },
  // Water — Sky tint
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

// Day-color palette for pins and polylines (up to 8 days, then wraps)
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
