import { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS } from './companion-shared';
import type { TripData } from './companion-shared';
import { DAY_COLORS } from '../../data/map-styles';
interface MapTabProps {
  tripData: TripData;
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

const MAPS_KEY = 'AIzaSyDH8mQKwqzyfCrgGZVDdP1-E-346QUiods';

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#E8F4F5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0D7377' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F5F0E8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#EBE4D8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#D4A574' }] },
  { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
];

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;
  if (typeof google !== 'undefined' && google.maps) return Promise.resolve();
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    script.async = true;
    script.onload = () => {
      fetch('/api/track-maps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: 'companion-map' }) }).catch(() => {});
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export default function MapTab({ tripData, selectedDay, onSelectDay }: MapTabProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[][]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return;
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Build markers and polylines when ready or data changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    // Create map if needed
    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        zoom: 7,
        center: { lat: 11.0, lng: 122.0 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy',
        styles: MAP_STYLES,
      });
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    const map = mapInstance.current;

    // Clear old markers & polylines
    markersRef.current.forEach(dayMarkers => dayMarkers.forEach(m => m.setMap(null)));
    polylinesRef.current.forEach(p => p.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasAny = false;

    tripData.days.forEach((day, dayIdx) => {
      const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
      const isSelected = dayIdx === selectedDay;
      const markers: google.maps.Marker[] = [];
      const coords: google.maps.LatLngLiteral[] = [];

      day.items.forEach((item, itemIdx) => {
        if (item.lat == null || item.lng == null) return;
        const pos = { lat: item.lat, lng: item.lng };
        if (isSelected) bounds.extend(pos);
        hasAny = true;
        coords.push(pos);

        const marker = new google.maps.Marker({
          position: pos,
          map,
          label: { text: String(itemIdx + 1), color: '#fff', fontSize: '11px', fontWeight: 'bold' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 14 : 9,
            fillColor: color,
            fillOpacity: isSelected ? 1 : 0.35,
            strokeColor: '#fff',
            strokeWeight: isSelected ? 2 : 1,
          },
          zIndex: isSelected ? 10 : 1,
          title: item.title,
        });

        marker.addListener('click', () => {
          if (dayIdx !== selectedDay) {
            onSelectDay(dayIdx);
          }
          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}&travelmode=driving`;
          infoWindowRef.current!.setContent(`
            <div style="font-family:Outfit,sans-serif;max-width:220px;">
              <div style="font-size:11px;font-weight:700;color:#0D7377;">Day ${day.day} · ${item.time}</div>
              <div style="font-size:14px;font-weight:700;color:#1A2332;margin:4px 0;">${item.icon} ${item.title}</div>
              <div style="font-size:12px;color:#4A5568;margin-bottom:8px;">${item.detail.substring(0, 100)}${item.detail.length > 100 ? '...' : ''}</div>
              <a href="${navUrl}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:20px;background:#0D7377;color:#fff;font-size:12px;font-weight:600;text-decoration:none;">
                🧭 Navigate
              </a>
            </div>
          `);
          infoWindowRef.current!.open(map, marker);
        });

        markers.push(marker);
      });

      markersRef.current.push(markers);

      // Polyline
      if (coords.length >= 2) {
        const polyline = new google.maps.Polyline({
          path: coords,
          strokeColor: color,
          strokeOpacity: isSelected ? 0.8 : 0.25,
          strokeWeight: isSelected ? 4 : 2,
          geodesic: true,
          map,
        });
        polylinesRef.current.push(polyline);
      }
    });

    if (hasAny) {
      map.fitBounds(bounds, { top: 60, bottom: 20, left: 20, right: 20 });
    }
  }, [ready, tripData, selectedDay, onSelectDay]);

  const recenter = useCallback(() => {
    if (!mapInstance.current) return;
    const bounds = new google.maps.LatLngBounds();
    let hasAny = false;
    const day = tripData.days[selectedDay];
    if (day) {
      day.items.forEach((item) => {
        if (item.lat != null && item.lng != null) {
          bounds.extend({ lat: item.lat, lng: item.lng });
          hasAny = true;
        }
      });
    }
    if (hasAny) {
      mapInstance.current.fitBounds(bounds, { top: 60, bottom: 20, left: 20, right: 20 });
    }
  }, [tripData, selectedDay]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Day selector pills */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto',
        background: '#fff', borderBottom: '1px solid #E8E8EC', flexShrink: 0,
      }}>
        {tripData.days.map((day, i) => {
          const color = DAY_COLORS[i % DAY_COLORS.length];
          return (
            <button key={i} onClick={() => onSelectDay(i)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
              whiteSpace: 'nowrap',
              background: selectedDay === i ? color : '#F5F0E8',
              color: selectedDay === i ? '#fff' : COLORS.gray600,
              transition: 'all 0.2s',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: selectedDay === i ? '#fff' : color,
                flexShrink: 0,
              }} />
              Day {day.day}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
          {!ready && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: COLORS.gray400, fontSize: 14,
            }}>Loading map...</div>
          )}
        </div>
        {/* Recenter button */}
        {ready && (
          <button onClick={recenter} style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 10,
            width: 40, height: 40, borderRadius: 20,
            background: 'rgba(255,255,255,0.95)', border: '1px solid #E8E8EC',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }} title="Recenter map">
            ⊕
          </button>
        )}
      </div>
    </div>
  );
}
