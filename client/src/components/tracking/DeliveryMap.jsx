import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_VIEW = [23.8103, 90.4125];

function pinIcon(color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;line-height:1;">${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

function samePoint(a, b) {
  return a && b && Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
}

function riderIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 10px rgba(37,99,235,.6);position:relative;"><span style="position:absolute;inset:-8px;border-radius:50%;background:rgba(37,99,235,.25);animation:tracking-pulse 1.6s infinite;"></span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function DeliveryMap({ pickup, delivery, rider, origin, routeCoordinates = [], height = '420px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const riderRef = useRef(rider);
  riderRef.current = rider;

  // Create the map once
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, { zoomControl: true }).setView(DEFAULT_VIEW, 12);
    L.tileLayer(TILE_URL, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const overlay = L.layerGroup().addTo(map);
    mapRef.current = map;
    overlayRef.current = overlay;

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
      riderMarkerRef.current = null;
    };
  }, []);

  // Static layers (route, pickup, delivery) — rebuild only when these change
  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;

    overlay.clearLayers();
    riderMarkerRef.current = null;

    const points = [];

    if (routeCoordinates && routeCoordinates.length > 1) {
      const latlngs = routeCoordinates.map((p) => [p.lat, p.lng]);
      L.polyline(latlngs, { color: '#059669', weight: 4, opacity: 0.85 }).addTo(overlay);
      points.push(...latlngs);
    }

    if (pickup && pickup.lat != null) {
      L.marker([pickup.lat, pickup.lng], { icon: pinIcon('#059669', '🏠') })
        .addTo(overlay)
        .bindTooltip('Pickup (Farm)', { direction: 'top' });
      points.push([pickup.lat, pickup.lng]);
    }

    if (origin && origin.lat != null && !(pickup && pickup.lat != null && samePoint(origin, pickup))) {
      L.marker([origin.lat, origin.lng], { icon: pinIcon('#2563eb', '🚚') })
        .addTo(overlay)
        .bindTooltip('Rider start', { direction: 'top' });
      points.push([origin.lat, origin.lng]);
    }

    if (delivery && delivery.lat != null) {
      L.marker([delivery.lat, delivery.lng], { icon: pinIcon('#e11d48', '🏁') })
        .addTo(overlay)
        .bindTooltip('Delivery Address', { direction: 'top' });
      points.push([delivery.lat, delivery.lng]);
    }

    const currentRider = riderRef.current;
    if (currentRider && currentRider.lat != null) {
      riderMarkerRef.current = L.marker([currentRider.lat, currentRider.lng], {
        icon: riderIcon(),
        zIndexOffset: 1000,
      }).addTo(overlay);
      points.push([currentRider.lat, currentRider.lng]);
    }

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [routeCoordinates, pickup, delivery, origin]);

  // Move the rider marker on each poll without rebuilding the map
  useEffect(() => {
    const marker = riderMarkerRef.current;
    if (marker && rider && rider.lat != null) {
      marker.setLatLng([rider.lat, rider.lng]);
    }
  }, [rider?.lat, rider?.lng]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-2xl z-0 overflow-hidden" />;
}
