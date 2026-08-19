import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader, Package, MapPin, Timer, Route, CheckCircle2, Truck, AlertTriangle, PackageCheck } from 'lucide-react';
import { trackingApi } from '../../services/trackingApi';
import DeliveryMap from './DeliveryMap';

const STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Picked Up' },
  { key: 'delivered', label: 'Delivered' },
];

function currentStepIndex(status, progress) {
  if (status === 'delivered') return 2;
  if (status === 'shipped') return progress >= 1 ? 2 : 1;
  if (status === 'processing') return 0.5;
  return 0;
}

function formatDistance(meters) {
  if (!meters) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export default function LiveTrackingView({ orderId, backTo, actionLabel, onAction, actionClass = '' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await trackingApi.getTracking(orderId);
      setData(res.data);
      setError('');
      if (res.data.status === 'delivered' || res.data.status === 'cancelled') {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (err) {
      setError(err.message || 'Failed to load tracking');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, 2500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load]);

  const handleAction = async () => {
    if (!onAction) return;
    setBusy(true);
    try {
      await onAction(data);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-rose-600 font-semibold">{error}</p>
        {backTo && (
          <Link to={backTo} className="mt-4 inline-block px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">
            Go Back
          </Link>
        )}
      </div>
    );
  }

  if (!data) return null;

  const stepIndex = currentStepIndex(data.status, data.progress);
  const arrived = data.arrived || data.status === 'delivered';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        {backTo ? (
          <Link to={backTo} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 text-sm font-medium">
            ← Back
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Live Delivery Tracking</h1>
              <p className="text-slate-500 text-sm">Order #{data.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Total distance</p>
              <p className="text-lg font-extrabold text-slate-900">{formatDistance(data.distanceMeters)}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Est. delivery time</p>
              <p className="text-lg font-extrabold text-slate-900">
                {data.etaMinutes ? `~${data.etaMinutes} min` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Step progress */}
        <div className="mt-6 flex items-center">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center w-20">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                    stepIndex >= i
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {stepIndex > i ? '✓' : i + 1}
                </div>
                <span className={`mt-1.5 text-[11px] font-semibold ${stepIndex >= i ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 rounded-full mx-1 mb-5 ${stepIndex > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <DeliveryMap
          pickup={data.pickupLocation}
          delivery={data.deliveryLocation}
          rider={data.currentLocation}
          origin={data.originLocation}
          routeCoordinates={data.routeCoordinates}
          height="440px"
        />
        {data.isFallback && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-t border-amber-100 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Using approximate map coordinates for this demo trip.
          </div>
        )}
      </div>

      {/* Status + stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <Timer className="w-4 h-4" /> Arrival
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {data.status === 'delivered' ? 'Delivered' : data.etaMinutes ? `~${data.etaMinutes} min` : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Estimated arrival time (computed from the route)</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <Route className="w-4 h-4" /> Distance left
          </div>
          <p className="text-xl font-extrabold text-slate-900">{formatDistance(data.remainingMeters)}</p>
          <p className="text-xs text-slate-400 mt-1">Remaining to destination</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4" /> Rider location
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {data.progress >= 1 ? 'Destination' : 'En Route'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {data.currentLocation ? `${data.currentLocation.lat.toFixed(4)}°, ${data.currentLocation.lng.toFixed(4)}°` : '—'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-slate-700">
            {data.status === 'delivered'
              ? 'Delivery complete'
              : arrived
                ? 'Rider has arrived'
                : 'Rider heading to your address'}
          </span>
          <span className="font-extrabold text-emerald-700">{Math.round(data.progress * 100)}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
            style={{ width: `${Math.round(data.progress * 100)}%` }}
          />
        </div>
        {arrived && !onAction && data.status !== 'delivered' && (
          <p className="text-sm text-slate-500 mt-3 flex items-center gap-1.5">
            <PackageCheck className="w-4 h-4 text-emerald-600" /> The rider is at the delivery address — please confirm receipt.
          </p>
        )}
      </div>

      {/* Route breakdown */}
      {data.legs && data.legs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-emerald-600" /> Route breakdown
          </h2>
          <div className="space-y-3">
            {data.legs.map((leg, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{leg.label}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {leg.originName || 'Start'} → {leg.destinationName || 'End'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-slate-900">{formatDistance(leg.distanceMeters)}</p>
                  <p className="text-xs text-slate-400">
                    {leg.durationSeconds ? `~${Math.ceil(leg.durationSeconds / 60)} min` : '—'}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <div className="text-right">
                <p className="text-sm font-extrabold text-emerald-700">{formatDistance(data.distanceMeters)}</p>
                <p className="text-xs text-slate-400">{data.etaMinutes ? `~${data.etaMinutes} min` : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action (rider) */}
      {onAction && (
        <div className="flex justify-end">
          <button
            onClick={handleAction}
            disabled={!arrived || busy}
            className={`inline-flex items-center gap-2 text-white font-semibold py-3 px-6 rounded-xl transition text-sm shadow-sm disabled:opacity-50 ${actionClass || 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {busy ? <Loader className="w-4 h-4 animate-spin" /> : data.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            {actionLabel || (data.status === 'delivered' ? 'Delivered' : 'Mark as Delivered')}
          </button>
        </div>
      )}
    </div>
  );
}
