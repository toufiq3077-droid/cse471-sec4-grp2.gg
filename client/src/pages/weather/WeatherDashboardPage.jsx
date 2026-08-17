import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { weatherApi } from '../../services/weatherApi';
import { notificationApi } from '../../services/notificationApi';
import { useSocket } from '../../context/SocketContext';
import {
  Cloud, Wind, Droplets, Thermometer, Eye, Gauge, MapPin,
  RefreshCw, Locate, Save, AlertTriangle, CheckCircle, XCircle,
  Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Loader2,
  Sprout, Beaker, Tractor, ShieldCheck, Info, ChevronDown, Zap, Bell
} from 'lucide-react';

// ─── Utility: map OWM icon code to component ──────────────────────────────────
function WeatherIcon({ icon, className = 'w-8 h-8' }) {
  const code = icon || '01d';
  if (code.startsWith('01')) return <Sun className={className + ' text-amber-400'} />;
  if (code.startsWith('02') || code.startsWith('03') || code.startsWith('04'))
    return <Cloud className={className + ' text-slate-400'} />;
  if (code.startsWith('09')) return <CloudDrizzle className={className + ' text-blue-400'} />;
  if (code.startsWith('10')) return <CloudRain className={className + ' text-blue-500'} />;
  if (code.startsWith('11')) return <CloudLightning className={className + ' text-purple-400'} />;
  if (code.startsWith('13')) return <CloudSnow className={className + ' text-sky-300'} />;
  return <Cloud className={className + ' text-slate-400'} />;
}

// ─── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, label, value, unit, color = 'text-slate-700' }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/60 backdrop-blur rounded-2xl px-4 py-3 border border-white/40 shadow-sm">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}<span className="text-xs font-normal text-slate-500 ml-0.5">{unit}</span></span>
    </div>
  );
}

// ─── Insight card ──────────────────────────────────────────────────────────────
const insightConfig = {
  Optimal: { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
  'Safe': { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
  'Standard': { color: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-400', icon: Info },
  'Moderate': { color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400', icon: AlertTriangle },
  'Low': { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
  'High (Fungal Hazard)': { color: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500', icon: XCircle },
  'Increase Irrigation': { color: 'bg-orange-50 border-orange-200 text-orange-700', dot: 'bg-orange-400', icon: AlertTriangle },
  'Hold Irrigation': { color: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-400', icon: Info },
  'Unsafe (High Wind)': { color: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500', icon: XCircle },
  'Unsafe (Rain Expected)': { color: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500', icon: XCircle },
  'Postpone': { color: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500', icon: XCircle },
};

function InsightCard({ title, icon: Icon, status, advice }) {
  const cfg = insightConfig[status] || { color: 'bg-slate-50 border-slate-200 text-slate-700', dot: 'bg-slate-400', icon: Info };
  const StatusIcon = cfg.icon;
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${cfg.color}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 opacity-80" />
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="font-bold text-sm">{status}</span>
        <StatusIcon className="w-4 h-4 ml-auto opacity-70" />
      </div>
      <p className="text-xs leading-relaxed opacity-80">{advice}</p>
    </div>
  );
}

// ─── Daily forecast card ───────────────────────────────────────────────────────
function ForecastCard({ day }) {
  const isToday = day.dayName === 'Today';
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl p-4 border text-center transition
      ${isToday ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg scale-105' : 'bg-white border-slate-200 text-slate-700 hover:shadow-md'}`}>
      <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-emerald-100' : 'text-slate-400'}`}>
        {day.dayName}
      </span>
      <WeatherIcon icon={day.icon} className={`w-7 h-7 ${isToday ? '' : ''}`} />
      <div className="flex flex-col items-center">
        <span className="text-base font-black">{day.tempMax}°</span>
        <span className={`text-xs font-medium ${isToday ? 'text-emerald-200' : 'text-slate-400'}`}>{day.tempMin}°</span>
      </div>
      <div className={`flex items-center gap-1 text-xs ${isToday ? 'text-emerald-100' : 'text-blue-500'}`}>
        <Droplets className="w-3.5 h-3.5" />
        <span>{day.rainProbability}%</span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function WeatherDashboardPage() {
  const { token, user } = useAuth();
  const { connected } = useSocket() || {};
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [activeLat, setActiveLat] = useState(null);
  const [activeLon, setActiveLon] = useState(null);
  const [testAlertLoading, setTestAlertLoading] = useState(false);
  const [testAlertMsg, setTestAlertMsg] = useState(null);

  const autoAlertSentRef = React.useRef(false);

  const fetchWeather = useCallback(async (lat = null, lon = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await weatherApi.getWeather(token, lat, lon);
      setWeather(res.data);
      if (lat) setActiveLat(lat);
      if (lon) setActiveLon(lon);

      // Automatically send notification if weather risk detected
      if (res.data && !autoAlertSentRef.current) {
        const { current, agriInsights } = res.data;
        const hasRisk = 
          agriInsights?.spraying?.status?.includes('Unsafe') ||
          agriInsights?.diseaseRisk?.status?.includes('High') ||
          agriInsights?.diseaseRisk?.status?.includes('Moderate') ||
          agriInsights?.harvest?.status?.includes('Postpone') ||
          (current?.rainProbability && current.rainProbability >= 40);

        if (hasRisk) {
          autoAlertSentRef.current = true;
          const riskDetail = agriInsights?.spraying?.advice || agriInsights?.diseaseRisk?.advice || agriInsights?.harvest?.advice || 'Weather hazards detected near your farm.';
          notificationApi.triggerTestWeatherAlert(token, {
            title: `⚠️ Weather Risk at ${current?.locationName || 'Your Farm'}!`,
            message: riskDetail,
            severity: agriInsights?.diseaseRisk?.status?.includes('High') || (current?.rainProbability > 60) ? 'critical' : 'warning',
            riskType: agriInsights?.spraying?.status || agriInsights?.diseaseRisk?.status || 'Severe Weather Risk',
          }).catch(() => {});
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const handleGpsLocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        setManualLat(String(lat));
        setManualLon(String(lon));
        setLocating(false);
        fetchWeather(lat, lon);
      },
      () => {
        setLocating(false);
        setError('Location access denied. Please enter coordinates manually.');
        setShowManual(true);
      }
    );
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) {
      setError('Please enter valid decimal latitude and longitude values.');
      return;
    }
    fetchWeather(lat, lon);
  };

  const handleSaveLocation = async () => {
    const lat = activeLat || weather?.latitude;
    const lon = activeLon || weather?.longitude;
    if (!lat || !lon) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await weatherApi.updateFarmLocation(token, {
        latitude: lat,
        longitude: lon,
        locationName: weather?.current?.locationName || `Farm (${lat}, ${lon})`,
        district: 'My Farm',
      });
      setSaveMsg({ type: 'success', text: '📍 Farm location saved to your profile!' });
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  // Background gradient based on condition
  const getBg = () => {
    const cond = weather?.current?.condition?.toLowerCase() || '';
    if (cond.includes('rain') || cond.includes('drizzle')) return 'from-slate-700 via-blue-700 to-slate-800';
    if (cond.includes('thunder')) return 'from-slate-800 via-purple-900 to-slate-900';
    if (cond.includes('snow')) return 'from-sky-300 via-blue-100 to-slate-200';
    if (cond.includes('cloud')) return 'from-slate-500 via-slate-600 to-slate-700';
    return 'from-sky-400 via-blue-500 to-emerald-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero Header */}
      <div className={`bg-gradient-to-br ${getBg()} text-white px-4 pt-8 pb-16`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-widest font-semibold mb-1">
                <Cloud className="w-4 h-4" /> Hyper-Local Weather Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">Farm Weather Intelligence</h1>
              <p className="text-white/70 text-sm mt-1">Real-time conditions & 7-day agricultural forecast tied to your farm coordinates</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                id="btn-gps-locate"
                onClick={handleGpsLocate}
                disabled={locating}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
              >
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                {locating ? 'Locating...' : 'GPS Auto-Locate'}
              </button>
              <button
                id="btn-manual-coords"
                onClick={() => setShowManual(!showManual)}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <MapPin className="w-4 h-4" />
                Manual Coordinates
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showManual ? 'rotate-180' : ''}`} />
              </button>
              <button
                id="btn-refresh-weather"
                onClick={() => fetchWeather(activeLat, activeLon)}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                id="btn-live-alert"
                onClick={async () => {
                  setTestAlertLoading(true);
                  setTestAlertMsg(null);
                  try {
                    const currentRisk = weather?.agriInsights?.spraying?.advice || weather?.agriInsights?.diseaseRisk?.advice || 'Heavy rain (85%) & strong wind (30 km/h) detected. Hold spraying operations immediately.';
                    await notificationApi.triggerTestWeatherAlert(token, {
                      title: `🚨 Live Weather Risk Alert!`,
                      message: `${currentRisk} (Location: ${weather?.current?.locationName || 'My Farm'})`,
                      severity: 'critical',
                      riskType: weather?.agriInsights?.diseaseRisk?.status || 'High Wind & Heavy Rain',
                    });
                    setTestAlertMsg('⚡ Live alert sent! Check your notification bell.');
                  } catch (e) {
                    setTestAlertMsg('Failed: ' + e.message);
                  } finally {
                    setTestAlertLoading(false);
                    setTimeout(() => setTestAlertMsg(null), 5000);
                  }
                }}
                disabled={testAlertLoading}
                className="inline-flex items-center gap-2 bg-amber-400/30 hover:bg-amber-400/50 backdrop-blur border border-amber-300/50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-60"
              >
                {testAlertLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                Live Alert
              </button>
            </div>
            {testAlertMsg && (
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white font-medium">
                {testAlertMsg}
              </div>
            )}
          </div>

          {/* Manual Coordinate Input */}
          {showManual && (
            <form onSubmit={handleManualSearch} className="flex flex-wrap gap-3 items-end bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-white/70 text-xs font-semibold">Latitude</label>
                <input
                  id="input-latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 23.8103"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-white placeholder-white/50 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white/70 text-xs font-semibold">Longitude</label>
                <input
                  id="input-longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 90.4125"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-white placeholder-white/50 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                id="btn-search-coords"
                type="submit"
                className="bg-white text-blue-700 font-bold text-sm px-5 py-2 rounded-xl hover:bg-blue-50 transition"
              >
                Search
              </button>
            </form>
          )}

          {/* Current Weather Hero */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-white/60" />
              <span className="ml-3 text-white/70 text-sm">Fetching your farm weather data...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-300 flex-shrink-0" />
              <span className="text-white/90 text-sm">{error}</span>
            </div>
          )}

          {weather && !loading && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-8">
              {/* Big temp display */}
              <div className="flex items-center gap-6">
                <WeatherIcon icon={weather.current.icon} className="w-20 h-20 drop-shadow-lg" />
                <div>
                  <div className="text-7xl font-black tracking-tight leading-none">{weather.current.temp}°<span className="text-4xl">C</span></div>
                  <div className="text-white/80 capitalize mt-1 text-base">{weather.current.description}</div>
                  <div className="flex items-center gap-1.5 text-white/60 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{weather.current.locationName}</span>
                  </div>
                  {weather.isFallback && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs bg-amber-400/20 text-amber-200 border border-amber-300/30 rounded-full px-2.5 py-0.5">
                      <AlertTriangle className="w-3 h-3" /> Estimated data (API key activating)
                    </span>
                  )}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 flex-1">
                <StatChip icon={Thermometer} label="Feels Like" value={weather.current.feelsLike} unit="°C" color="text-orange-300" />
                <StatChip icon={Droplets} label="Humidity" value={weather.current.humidity} unit="%" color="text-blue-300" />
                <StatChip icon={Wind} label="Wind" value={weather.current.windSpeed} unit="km/h" color="text-teal-300" />
                <StatChip icon={CloudRain} label="Rain Risk" value={weather.current.rainProbability} unit="%" color="text-sky-300" />
                <StatChip icon={Gauge} label="Pressure" value={weather.current.pressure} unit="hPa" color="text-purple-300" />
                <StatChip icon={Cloud} label="Cloud Cover" value={weather.current.clouds} unit="%" color="text-slate-300" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content below hero */}
      {weather && !loading && (
        <div className="max-w-5xl mx-auto px-4 -mt-8 space-y-6">

          {/* Save Location Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Viewing: {weather.current.locationName}
                </p>
                <p className="text-xs text-slate-500">
                  {weather.latitude?.toFixed(4)}° N, {weather.longitude?.toFixed(4)}° E
                  {weather.savedFarmLocation && ' · Farm location saved ✓'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveMsg && (
                <span className={`text-xs font-medium ${saveMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {saveMsg.text}
                </span>
              )}
              <button
                id="btn-save-farm-location"
                onClick={handleSaveLocation}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save as My Farm Location
              </button>
            </div>
          </div>

          {/* Smart Agricultural Insights */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Sprout className="w-6 h-6 text-emerald-600" />
              Smart Farming Insights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InsightCard
                title="Spraying Conditions"
                icon={Beaker}
                status={weather.agriInsights.spraying.status}
                advice={weather.agriInsights.spraying.advice}
              />
              <InsightCard
                title="Irrigation Requirements"
                icon={Droplets}
                status={weather.agriInsights.irrigation.status}
                advice={weather.agriInsights.irrigation.advice}
              />
              <InsightCard
                title="Disease & Fungal Risk"
                icon={AlertTriangle}
                status={weather.agriInsights.diseaseRisk.status}
                advice={weather.agriInsights.diseaseRisk.advice}
              />
              <InsightCard
                title="Harvest Safety"
                icon={Tractor}
                status={weather.agriInsights.harvest.status}
                advice={weather.agriInsights.harvest.advice}
              />
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Sun className="w-6 h-6 text-amber-500" />
              7-Day Agricultural Forecast
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {weather.dailyForecast.map((day) => (
                <ForecastCard key={day.date} day={day} />
              ))}
            </div>
          </div>

          {/* Detailed Daily Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Detailed Daily Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Day</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Condition</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">High / Low</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Humidity</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rain %</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Wind</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weather.dailyForecast.map((day, i) => (
                    <tr key={day.date} className={`hover:bg-slate-50 transition ${i === 0 ? 'bg-emerald-50/50' : ''}`}>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {day.dayName}
                        {i === 0 && <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">Today</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <WeatherIcon icon={day.icon} className="w-5 h-5" />
                          <span className="text-slate-600">{day.condition}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-slate-800">{day.tempMax}°</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">{day.tempMin}°</span>
                      </td>
                      <td className="px-4 py-4 text-center text-slate-600">{day.humidity}%</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-semibold ${day.rainProbability > 60 ? 'text-blue-600' : day.rainProbability > 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {day.rainProbability}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-slate-600">{day.windSpeed} km/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-400 pb-4">
            {weather.isFallback
              ? '⚠️ Displaying estimated data while OpenWeather API key activates (can take up to 2 hours after creation).'
              : `✅ Live data from OpenWeatherMap · Updated ${new Date(weather.current.updatedAt).toLocaleTimeString()}`}
          </p>
        </div>
      )}
    </div>
  );
}
