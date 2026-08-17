import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { Loader, LocateFixed, MapPin } from 'lucide-react';
import { geocodingApi } from '../../services/geocodingApi';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_VIEW = [23.8103, 90.4125];

function pickerIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#e11d48;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;line-height:1;">📍</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

export default function AddressPickerMap({
  value,
  onChange,
  height = '320px',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const reverseTimerRef = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const [resolving, setResolving] = useState(false);

  function placeMarker(lat, lng) {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: pickerIcon(), zIndexOffset: 1000 }).addTo(map);
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
  }

  async function resolvePoint(lat, lng) {
    setResolving(true);
    try {
      const res = await geocodingApi.reverse(lat, lng);
      const point = res.data;
      onChangeRef.current?.({
        lat: point.lat ?? lat,
        lng: point.lng ?? lng,
        label: point.label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        street: point.street || '',
        city: point.city || '',
        district: point.district || '',
        postalCode: point.postalCode || '',
      });
    } catch (err) {
      onChangeRef.current?.({
        lat,
        lng,
        label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      });
    } finally {
      setResolving(false);
    }
  }

  function scheduleReverse(lat, lng) {
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    reverseTimerRef.current = setTimeout(() => resolvePoint(lat, lng), 1200);
  }

  // Create the map once
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, { zoomControl: true }).setView(DEFAULT_VIEW, 12);
    L.tileLayer(TILE_URL, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);
      scheduleReverse(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    };
  }, []);

  // Sync marker when the value changes externally
  useEffect(() => {
    const current = valueRef.current;
    if (current && current.lat != null && current.lng != null) {
      placeMarker(Number(current.lat), Number(current.lng));
    }
  }, [value?.lat, value?.lng]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser.');
      return;
    }
    setResolving(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeMarker(latitude, longitude);
        mapRef.current?.setView([latitude, longitude], 16, { animate: true });
        resolvePoint(latitude, longitude);
      },
      (err) => {
        setResolving(false);
        toast.error(`Could not get your location: ${err.message || 'permission denied'}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const selected = valueRef.current;

  return (
    <div>
      <div className="relative">
        <div ref={containerRef} style={{ height }} className="w-full rounded-2xl z-0 overflow-hidden" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none bg-white/95 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap">
          Click anywhere on the map to set the point
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={resolving}
          className="absolute bottom-3 right-3 z-[1000] inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition disabled:opacity-60"
        >
          {resolving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
          Use my location
        </button>
      </div>

      <p className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500 min-h-[1.25rem]">
        {selected && selected.lat != null && (
          <>
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {selected.label || `${Number(selected.lat).toFixed(5)}°, ${Number(selected.lng).toFixed(5)}°`}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
