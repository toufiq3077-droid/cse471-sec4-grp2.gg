const axios = require('axios');
const User = require('../models/User');

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const FALLBACK_CENTER = { lat: 23.8103, lng: 90.4125, label: 'Dhaka, Bangladesh' };
const DEMO_DURATION_SECONDS = 45;
const USER_AGENT = 'Khet-i-Smart-Agriculture/1.0 (delivery-routing-demo)';

function haversineMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

function routeLengthMeters(coordinates) {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += haversineMeters(coordinates[i], coordinates[i + 1]);
  }
  return total;
}

function toLocalDateKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isValidPoint(point) {
  return !!point && point.lat != null && point.lng != null && !isNaN(Number(point.lat)) && !isNaN(Number(point.lng));
}

function samePoint(a, b) {
  return a && b && Math.abs(Number(a.lat) - Number(b.lat)) < 1e-6 && Math.abs(Number(a.lng) - Number(b.lng)) < 1e-6;
}

/**
 * Forward geocode a free-text query using the public Nominatim API.
 * Returns null when nothing is found or the API is unreachable.
 */
async function geocode(query) {
  if (!query || !String(query).trim()) return null;

  try {
    const res = await axios.get(NOMINATIM_SEARCH_URL, {
      params: { q: String(query).trim(), format: 'json', limit: 1, countrycodes: 'bd' },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000,
    });
    const hit = res.data?.[0];
    if (hit && hit.lat && hit.lon) {
      return {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name || String(query).trim(),
      };
    }
    return null;
  } catch (error) {
    console.warn('[trackingService] Nominatim geocode failed:', error.message);
    return null;
  }
}

/**
 * Geocode a structured address (street/city/district) into coordinates.
 */
async function geocodeAddress(address) {
  const query = [address.street, address.city, address.district].filter(Boolean).join(', ');
  return geocode(query);
}

/**
 * Reverse geocode coordinates into a readable address label + address parts.
 */
async function reverseGeocode(lat, lng) {
  try {
    const res = await axios.get(NOMINATIM_REVERSE_URL, {
      params: { lat, lon: lng, format: 'json' },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000,
    });
    const d = res.data;
    if (d && d.lat && d.lon) {
      const a = d.address || {};
      return {
        lat: Number(d.lat),
        lng: Number(d.lon),
        label: d.display_name || 'Selected location',
        street: [a.road, a.suburb, a.neighbourhood, a.hamlet].filter(Boolean).join(', '),
        city: a.city || a.town || a.village || a.county || '',
        district: a.state_district || a.state || '',
        postalCode: a.postcode || '',
      };
    }
    return null;
  } catch (error) {
    console.warn('[trackingService] Nominatim reverse geocode failed:', error.message);
    return null;
  }
}

/**
 * Fetch a driving route (distance, duration, polyline) from the public OSRM API.
 */
async function getDrivingRoute(origin, destination) {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  try {
    const res = await axios.get(`${OSRM_URL}/${coords}`, {
      params: { overview: 'full', geometries: 'geojson' },
      timeout: 10000,
    });
    const route = res.data?.routes?.[0];
    if (!route || !route.geometry?.coordinates?.length) return null;

    return {
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    };
  } catch (error) {
    console.warn('[trackingService] OSRM route failed:', error.message);
    return null;
  }
}

/**
 * Compute the point at a fraction (0..1) along a list of coordinates.
 */
function computePositionAlongRoute(coordinates, fraction) {
  if (!coordinates || coordinates.length === 0) return null;
  if (coordinates.length === 1) return coordinates[0];

  const clamped = Math.max(0, Math.min(1, fraction));
  const totalLen = routeLengthMeters(coordinates);
  const target = totalLen * clamped;
  let acc = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const segLen = haversineMeters(coordinates[i], coordinates[i + 1]);
    if (acc + segLen >= target || i === coordinates.length - 2) {
      const t = segLen === 0 ? 0 : Math.max(0, Math.min(1, (target - acc) / segLen));
      return {
        lat: coordinates[i].lat + (coordinates[i + 1].lat - coordinates[i].lat) * t,
        lng: coordinates[i].lng + (coordinates[i + 1].lng - coordinates[i].lng) * t,
      };
    }
    acc += segLen;
  }

  return coordinates[coordinates.length - 1];
}

/**
 * Resolve the pickup point for an order — the farm location of the first item's farmer.
 */
async function resolvePickupLocation(order) {
  const farmerId = order.items?.[0]?.farmerId;
  if (farmerId) {
    const farmer = await User.findById(farmerId).select('farmLocation name').lean();
    if (farmer?.farmLocation?.latitude && farmer?.farmLocation?.longitude) {
      const { latitude, longitude } = farmer.farmLocation;
      return {
        lat: Number(latitude),
        lng: Number(longitude),
        label: farmer.farmLocation.locationName || farmer.name || 'Farm pickup',
      };
    }
  }
  return { ...FALLBACK_CENTER };
}

/**
 * Build (and persist) tracking data for an order when a rider starts delivery.
 * Route is built rider → farm pickup hub → delivery address, with per-leg details.
 */
async function initDeliveryTracking(order, riderLocation) {
  const pickup = await resolvePickupLocation(order);

  const buyerPoint = order.deliveryPoint || {};
  let delivery = null;
  if (isValidPoint(buyerPoint)) {
    delivery = {
      lat: Number(buyerPoint.lat),
      lng: Number(buyerPoint.lng),
      label: buyerPoint.label || 'Delivery address',
    };
  } else {
    delivery = await geocodeAddress(order.shippingAddress || {});
  }
  const deliveryLocation = delivery || { ...FALLBACK_CENTER };

  const origin = isValidPoint(riderLocation)
    ? {
        lat: Number(riderLocation.lat),
        lng: Number(riderLocation.lng),
        label: riderLocation.label || 'Rider location',
      }
    : pickup;

  const legs = [];
  const allCoords = [];
  let isFallback = false;

  // Leg A: rider → pickup (farm hub)
  const needHubLeg = haversineMeters(origin, pickup) > 200;
  if (needHubLeg) {
    const legA = await getDrivingRoute(origin, pickup);
    if (legA) {
      legs.push({
        label: 'Rider to pickup',
        originName: origin.label,
        destinationName: pickup.label,
        distanceMeters: legA.distanceMeters,
        durationSeconds: legA.durationSeconds,
      });
      allCoords.push(...legA.coordinates);
    } else {
      isFallback = true;
      legs.push({
        label: 'Rider to pickup',
        originName: origin.label,
        destinationName: pickup.label,
        distanceMeters: haversineMeters(origin, pickup),
        durationSeconds: 0,
      });
      allCoords.push(origin, pickup);
    }
  } else {
    allCoords.push(origin);
  }

  // Leg B: pickup → delivery
  const hubForDelivery = needHubLeg ? pickup : origin;
  const legB = await getDrivingRoute(hubForDelivery, deliveryLocation);
  const junction = allCoords.length ? allCoords[allCoords.length - 1] : null;

  if (legB) {
    legs.push({
      label: 'Pickup to delivery',
      originName: hubForDelivery.label,
      destinationName: deliveryLocation.label,
      distanceMeters: legB.distanceMeters,
      durationSeconds: legB.durationSeconds,
    });
    const coords = junction && samePoint(junction, legB.coordinates[0]) ? legB.coordinates.slice(1) : legB.coordinates;
    allCoords.push(...coords);
  } else {
    isFallback = true;
    legs.push({
      label: 'Pickup to delivery',
      originName: hubForDelivery.label,
      destinationName: deliveryLocation.label,
      distanceMeters: haversineMeters(hubForDelivery, deliveryLocation),
      durationSeconds: 0,
    });
    if (!(junction && samePoint(junction, deliveryLocation))) {
      allCoords.push(deliveryLocation);
    }
  }

  order.tracking = {
    riderLocation: origin,
    pickupLocation: pickup,
    deliveryLocation,
    routeCoordinates: allCoords,
    legs,
    distanceMeters: legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
    durationSeconds: legs.reduce((sum, leg) => sum + leg.durationSeconds, 0),
    demoStartedAt: new Date(),
    isFallback,
  };
  await order.save();
}

/**
 * Compute the current live state (position, progress, route, ETA) for an order.
 * Primary info: full route, total distance and real estimated delivery time.
 * Movement is simulated: the trip completes in DEMO_DURATION_SECONDS.
 */
function buildLiveTracking(order) {
  const tracking = order.tracking || {};

  const pickupRaw = tracking.pickupLocation || {};
  const deliveryRaw = tracking.deliveryLocation || {};
  const originRaw = tracking.riderLocation || {};

  const pickup = isValidPoint(pickupRaw) ? pickupRaw : { ...FALLBACK_CENTER };
  const delivery = isValidPoint(deliveryRaw) ? deliveryRaw : { ...FALLBACK_CENTER };
  const origin = isValidPoint(originRaw) ? originRaw : pickup;

  let progress = 0;
  let currentLocation = origin;
  let arrived = false;

  if (order.status === 'delivered') {
    progress = 1;
    currentLocation = delivery;
    arrived = true;
  } else if (order.status === 'shipped' && tracking.demoStartedAt) {
    const elapsedMs = Date.now() - new Date(tracking.demoStartedAt).getTime();
    progress = Math.max(0, Math.min(1, elapsedMs / 1000 / DEMO_DURATION_SECONDS));
    if (progress >= 1) {
      currentLocation = delivery;
      arrived = true;
    } else {
      currentLocation =
        computePositionAlongRoute(tracking.routeCoordinates, progress) ||
        computePositionAlongRoute([origin, delivery], progress) ||
        origin;
    }
  } else if (order.status === 'processing') {
    progress = 0;
    currentLocation = origin;
  }

  const totalDistance = tracking.distanceMeters || haversineMeters(origin, delivery);
  const remainingMeters = Math.round(Math.max(0, totalDistance * (1 - progress)));

  return {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    deliveredAt: order.deliveredAt,
    originLocation: origin,
    pickupLocation: pickup,
    deliveryLocation: delivery,
    routeCoordinates: tracking.routeCoordinates || [],
    legs: tracking.legs || [],
    distanceMeters: totalDistance,
    durationSeconds: tracking.durationSeconds || 0,
    etaMinutes: Math.max(1, Math.round((tracking.durationSeconds || 0) / 60)),
    demoStartedAt: tracking.demoStartedAt,
    isFallback: tracking.isFallback || false,
    currentLocation,
    progress: Number(progress.toFixed(3)),
    arrived,
    remainingMeters,
  };
}

module.exports = {
  initDeliveryTracking,
  buildLiveTracking,
  geocode,
  geocodeAddress,
  reverseGeocode,
  getDrivingRoute,
  computePositionAlongRoute,
  isValidPoint,
  toLocalDateKey,
  DEMO_DURATION_SECONDS,
};
