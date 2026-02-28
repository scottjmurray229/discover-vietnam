import { useEffect, useRef, useState } from 'react';
import { COLORS } from './companion-shared';
interface MiniMapProps {
  activities: Array<{ lat: number; lng: number; title: string; icon: string }>;
  dayColor: string;
  onTap?: () => void;
}

const MAPS_KEY = 'AIzaSyDH8mQKwqzyfCrgGZVDdP1-E-346QUiods';

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;
  if (typeof google !== 'undefined' && google.maps) return Promise.resolve();
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    script.async = true;
    script.onload = () => {
      fetch('/api/track-maps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: 'companion-mini' }) }).catch(() => {});
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export default function CompanionMiniMap({ activities, dayColor, onTap }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || activities.length === 0) return;

    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        zoom: 10,
        center: { lat: activities[0].lat, lng: activities[0].lng },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'none',
        disableDefaultUI: true,
        clickableIcons: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#E8F4F5' }] },
          { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F5F0E8' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#EBE4D8' }] },
        ],
      });
    }

    const map = mapInstance.current;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    activities.forEach((a, i) => {
      const pos = { lat: a.lat, lng: a.lng };
      bounds.extend(pos);

      const marker = new google.maps.Marker({
        position: pos,
        map,
        label: { text: String(i + 1), color: '#fff', fontSize: '10px', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: dayColor,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        },
      });
      markersRef.current.push(marker);
    });

    map.fitBounds(bounds, { top: 15, bottom: 15, left: 15, right: 15 });
  }, [ready, activities, dayColor]);

  if (activities.length === 0) return null;

  return (
    <div style={{
      height: 180, borderRadius: 12, overflow: 'hidden',
      marginBottom: 14, position: 'relative', background: COLORS.sand,
    }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
        {!ready && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: COLORS.gray400, fontSize: 12,
          }}>Loading map...</div>
        )}
      </div>
      {/* Click overlay sits above all Google Maps layers */}
      {onTap && (
        <div
          onClick={onTap}
          style={{
            position: 'absolute', inset: 0, zIndex: 999, cursor: 'pointer',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: 8,
          }}
        >
          <div style={{
            background: 'rgba(13,115,119,0.9)', color: '#fff',
            fontSize: 11, fontWeight: 600, padding: '4px 10px',
            borderRadius: 20, backdropFilter: 'blur(4px)',
          }}>
            🗺️ Open Map
          </div>
        </div>
      )}
    </div>
  );
}
