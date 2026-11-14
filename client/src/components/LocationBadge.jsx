import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ChevronDown, Check, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'ecopulse_user_location';

const INDIAN_HUBS = [
  { city: 'Bengaluru, KA', keywords: ['bengaluru', 'bangalore'], lat: 12.9716, lon: 77.5946, coords: '12.9716° N, 77.5946° E' },
  { city: 'Mumbai, MH', keywords: ['mumbai', 'bombay'], lat: 19.076, lon: 72.8777, coords: '19.0760° N, 72.8777° E' },
  { city: 'Delhi NCR', keywords: ['delhi', 'new delhi', 'gurugram', 'noida'], lat: 28.6139, lon: 77.209, coords: '28.6139° N, 77.2090° E' },
  { city: 'Hyderabad, TS', keywords: ['hyderabad'], lat: 17.385, lon: 78.4867, coords: '17.3850° N, 78.4867° E' },
  { city: 'Chennai, TN', keywords: ['chennai', 'madras'], lat: 13.0827, lon: 80.2707, coords: '13.0827° N, 80.2707° E' },
  { city: 'Pune, MH', keywords: ['pune'], lat: 18.5204, lon: 73.8567, coords: '18.5204° N, 73.8567° E' },
  { city: 'Kolkata, WB', keywords: ['kolkata', 'calcutta'], lat: 22.5726, lon: 88.3639, coords: '22.5726° N, 88.3639° E' },
  { city: 'Kochi, KL', keywords: ['kochi', 'cochin'], lat: 9.9312, lon: 76.2673, coords: '9.9312° N, 76.2673° E' },
  { city: 'Ahmedabad, GJ', keywords: ['ahmedabad'], lat: 23.0225, lon: 72.5714, coords: '23.0225° N, 72.5714° E' },
  { city: 'Jaipur, RJ', keywords: ['jaipur'], lat: 26.9124, lon: 75.7873, coords: '26.9124° N, 75.7873° E' }
];

const QUICK_SELECT_HUBS = INDIAN_HUBS.slice(0, 8);

function formatCoords(lat, lon) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestHub(lat, lon) {
  let closest = null;
  let minDistance = Infinity;
  for (const hub of INDIAN_HUBS) {
    const dist = calculateDistanceKm(lat, lon, hub.lat, hub.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = hub;
    }
  }
  return minDistance <= 150 ? closest : null;
}

function getInitialLocation(user) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.city && parsed?.coords) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage read errors
  }

  const orgName = (user?.name || '').toLowerCase();
  if (orgName) {
    const matched = INDIAN_HUBS.find((hub) =>
      hub.keywords.some((kw) => orgName.includes(kw))
    );
    if (matched) {
      return {
        city: matched.city,
        coords: matched.coords,
        source: 'Kitchen Hub'
      };
    }
  }

  return {
    city: 'Bengaluru, KA',
    coords: '12.9716° N, 77.5946° E',
    source: 'Hub Default'
  };
}

export default function LocationBadge({ user = null }) {
  const [location, setLocation] = useState(() => getInitialLocation(user));
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const saveLocation = (nextLoc) => {
    setLocation(nextLoc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLoc));
    } catch {
      // Ignore storage write errors
    }
  };

  useEffect(() => {
    // Re-infer default city from newly authenticated user if no saved override exists
    try {
      if (!localStorage.getItem(STORAGE_KEY) && user?.name) {
        setLocation(getInitialLocation(user));
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const detectLiveLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setDetecting(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordsStr = formatCoords(latitude, longitude);
        const nearestHub = findNearestHub(latitude, longitude);
        let resolvedCity = nearestHub ? nearestHub.city : 'Live GPS Location';

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              signal: controller.signal,
              headers: { Accept: 'application/json' }
            }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const addr = data?.address || {};
            const area =
              addr.suburb ||
              addr.neighbourhood ||
              addr.city ||
              addr.town ||
              addr.village ||
              addr.state_district;
            const cityOrState = addr.city || addr.town || addr.state;

            if (area && cityOrState && area !== cityOrState) {
              resolvedCity = `${area}, ${cityOrState}`;
            } else if (cityOrState || area) {
              resolvedCity = cityOrState || area;
            }
          }
        } catch {
          // Graceful fallback to nearest hub or "Live GPS Location"
        }

        saveLocation({
          city: resolvedCity,
          coords: coordsStr,
          source: 'Live GPS'
        });
        setDetecting(false);
      },
      (geoError) => {
        setDetecting(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError('Location access denied. Select a hub below or allow GPS in browser settings.');
        } else if (geoError.code === geoError.TIMEOUT) {
          setError('GPS signal timed out. Try again or pick a hub below.');
        } else {
          setError('Unable to fetch GPS location. Select a hub below.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    // Automatically refresh GPS on mount only if permission was already granted and user has not manually pinned a hub
    let active = true;
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (!active || status.state !== 'granted') return;
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && JSON.parse(saved)?.source === 'Kitchen Hub') return;
          } catch {
            // Ignore
          }
          detectLiveLocation();
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, []);

  const handleSelectHub = (hub) => {
    setError('');
    saveLocation({
      city: hub.city,
      coords: hub.coords,
      source: 'Kitchen Hub'
    });
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#DED8C8] hover:border-[#47777B]/60 text-xs font-semibold text-[#12231B] shadow-sm transition-all"
        title={`Current location: ${location.city} (${location.coords})`}
        aria-expanded={open}
      >
        <MapPin className="w-3.5 h-3.5 text-[#47777B] flex-shrink-0" />
        <span className="max-w-[105px] sm:max-w-[155px] truncate">{location.city}</span>
        {location.source === 'Live GPS' && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#47777B] flex-shrink-0"
            title="Live GPS active"
          />
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#635C4E] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#FFFDF9] border border-[#C7BFA9] shadow-xl p-4 z-50 space-y-3.5">
          {/* Active Location Telemetry */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#ECE6D6]">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#635C4E]">
                  Active Location
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    location.source === 'Live GPS'
                      ? 'bg-[#47777B]/[0.12] text-[#355D61] border-[#47777B]/35'
                      : 'bg-[#FDF4F1] text-[#B93D1D] border-[#F2CFC4]'
                  }`}
                >
                  {location.source}
                </span>
              </div>
              <div className="font-display text-base font-semibold text-[#12231B] truncate">
                {location.city}
              </div>
              <div className="font-mono text-[11px] text-[#635C4E]">{location.coords}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#47777B]/[0.12] border border-[#47777B]/30 text-[#47777B] flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
          </div>

          {/* Live GPS Action */}
          <button
            type="button"
            onClick={detectLiveLocation}
            disabled={detecting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#47777B] hover:bg-[#355D61] text-[#FFFDF9] px-3.5 py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            {detecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Detecting GPS Coordinates...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Detect Live GPS Location</span>
              </>
            )}
          </button>

          {error && (
            <div className="text-[11px] text-[#B93D1D] bg-[#FDF4F1] border border-[#F2CFC4] rounded-xl px-3 py-2 leading-snug">
              {error}
            </div>
          )}

          {/* Indian Hub Quick Select */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#635C4E]">
              Switch Commercial Hub (India)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_SELECT_HUBS.map((hub) => {
                const isSelected = location.city === hub.city;
                return (
                  <button
                    key={hub.city}
                    type="button"
                    onClick={() => handleSelectHub(hub)}
                    className={`flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-all ${
                      isSelected
                        ? 'bg-[#47777B]/[0.12] border-[#47777B]/40 text-[#355D61] font-semibold'
                        : 'bg-[#F5F1E8]/60 border-[#DED8C8] text-[#3D4E45] hover:bg-[#ECE6D6] hover:text-[#12231B]'
                    }`}
                  >
                    <span className="truncate">{hub.city}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#47777B] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
