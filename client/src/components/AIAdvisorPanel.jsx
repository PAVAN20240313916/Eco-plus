import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  ChefHat,
  Leaf,
  RefreshCw,
  CheckCircle2,
  Cpu,
  CloudRain,
  Sun,
  CloudSun,
  Droplets,
  Thermometer,
  ShoppingBag,
  Archive,
  Send,
  MapPin,
  Store,
  Utensils,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function isSupermarketBusiness(type = '') {
  return /supermarket|hypermarket|kirana|grocery|mart|retail/i.test(String(type));
}

function isRestaurantEligibleBusiness(type = '') {
  const val = String(type || '').trim();
  if (!val) return true;
  if (isSupermarketBusiness(val)) return false;
  return /restaurant|kitchen|bistro|darshini|hotel|banquet|catering|cafe|cafeteria|dining/i.test(
    val
  );
}

const WEATHER_PRESETS = [
  {
    id: 'monsoon',
    label: 'Monsoon & High Humidity',
    condition: 'Monsoon & High Humidity',
    tempC: 24,
    humidity: 84,
    icon: CloudRain
  },
  {
    id: 'summer',
    label: 'Summer Heatwave',
    condition: 'Summer Heatwave',
    tempC: 36,
    humidity: 42,
    icon: Sun
  },
  {
    id: 'coastal',
    label: 'Humid Coastal',
    condition: 'Humid Coastal',
    tempC: 31,
    humidity: 78,
    icon: Droplets
  },
  {
    id: 'pleasant',
    label: 'Pleasant & Dry',
    condition: 'Pleasant & Dry',
    tempC: 22,
    humidity: 52,
    icon: CloudSun
  }
];

const QUICK_PROMPTS = [
  'Which items can we keep for a long time in this weather?',
  'Which products should we buy more for this weather forecast?',
  'How should we adjust cold-chain (°C) and dry storage today?'
];

function readSavedLocation() {
  const fallback = { city: 'Bengaluru, KA', lat: 12.9716, lon: 77.5946 };
  try {
    const raw = localStorage.getItem('ecopulse_user_location');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const city = parsed?.city || fallback.city;
    const match = (parsed?.coords || '').match(
      /([\d.]+)°\s*([NS]),\s*([\d.]+)°\s*([EW])/i
    );
    if (!match) return { ...fallback, city };
    const lat = Number(match[1]) * (match[2].toUpperCase() === 'S' ? -1 : 1);
    const lon = Number(match[3]) * (match[4].toUpperCase() === 'W' ? -1 : 1);
    return { city, lat, lon };
  } catch {
    return fallback;
  }
}

function mapWeatherCode(code, tempC, humidity) {
  if (code >= 95) return 'Monsoon Thunderstorm & Rain';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return 'Monsoon & Rain Showers';
  }
  if (tempC >= 32) return 'Summer Heatwave';
  if (humidity >= 72) return 'Humid Coastal';
  if (code <= 1) return 'Pleasant & Clear';
  return 'Pleasant & Dry';
}

export default function AIAdvisorPanel({ initialInsight = null, onForecastComplete }) {
  const { user } = useAuth();
  const [insight, setInsight] = useState(initialInsight);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncingWeather, setSyncingWeather] = useState(false);
  const [weatherNote, setWeatherNote] = useState('');
  const [error, setError] = useState('');

  const [savedLoc, setSavedLoc] = useState(() => readSavedLocation());
  const [weather, setWeather] = useState(() => ({
    city: readSavedLocation().city,
    condition: 'Monsoon & High Humidity',
    tempC: 24,
    humidity: 84,
    isLive: false
  }));
  const [question, setQuestion] = useState('');
  const [businessType, setBusinessType] = useState(
    () => user?.businessType || 'Restaurant / Cloud Kitchen / Darshini'
  );

  const userIsSupermarket = isSupermarketBusiness(user?.businessType);
  const restaurantRoleValue =
    !userIsSupermarket && user?.businessType
      ? user.businessType
      : 'Restaurant / Cloud Kitchen / Darshini';

  useEffect(() => {
    if (user?.businessType) {
      setBusinessType(user.businessType);
    }
  }, [user?.businessType]);

  useEffect(() => {
    if (initialInsight && !insight) {
      setInsight(initialInsight);
    }
  }, [initialInsight]);

  useEffect(() => {
    const refreshLocation = () => {
      const next = readSavedLocation();
      setSavedLoc(next);
      setWeather((prev) => ({ ...prev, city: next.city }));
    };
    window.addEventListener('storage', refreshLocation);
    return () => window.removeEventListener('storage', refreshLocation);
  }, []);

  const handleGenerateForecast = async (
    customQuestion = question,
    customWeather = weather,
    customBusinessType = businessType
  ) => {
    setLoading(true);
    setError('');
    try {
      const res = await aiAPI.getForecast({
        weather: {
          city: customWeather.city,
          condition: customWeather.condition,
          tempC: customWeather.tempC,
          humidity: customWeather.humidity
        },
        question: customQuestion,
        businessType: customBusinessType
      });
      if (res.data?.success) {
        setInsight(res.data.data);
        setSource(res.data.source);
        if (onForecastComplete) {
          onForecastComplete(res.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate AI forecast. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchBusinessRole = (nextType) => {
    setBusinessType(nextType);
    if (insight) {
      handleGenerateForecast(question, weather, nextType);
    }
  };

  const handleSyncLiveWeather = async () => {
    const loc = readSavedLocation();
    setSavedLoc(loc);
    setSyncingWeather(true);
    setWeatherNote('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Weather API unavailable');
      }
      const data = await response.json();
      const current = data?.current;
      if (!current) {
        throw new Error('No current telemetry returned');
      }

      const tempC = Math.round(Number(current.temperature_2m));
      const humidity = Math.round(Number(current.relative_humidity_2m));
      const condition = mapWeatherCode(Number(current.weather_code), tempC, humidity);

      const nextWeather = {
        city: loc.city,
        condition,
        tempC,
        humidity,
        isLive: true
      };
      setWeather(nextWeather);
      setWeatherNote(`Synced live Open-Meteo telemetry for ${loc.city}.`);
      await handleGenerateForecast(question, nextWeather);
    } catch {
      setWeatherNote(
        `Could not reach live weather feed for ${loc.city}; using selected forecast preset.`
      );
    } finally {
      setSyncingWeather(false);
    }
  };

  const handleSelectPreset = (preset) => {
    const loc = readSavedLocation();
    setSavedLoc(loc);
    setWeatherNote('');
    setWeather({
      city: loc.city,
      condition: preset.condition,
      tempC: preset.tempC,
      humidity: preset.humidity,
      isLive: false
    });
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    handleGenerateForecast(question, weather);
  };

  const handleQuickPrompt = (chip) => {
    setQuestion(chip);
    handleGenerateForecast(chip, weather);
  };

  return (
    <div className="space-y-6">
      {/* Header Control & Weather Forecast Console */}
      <div className="glass-card rounded-3xl p-6 space-y-5 border border-[#DED8C8]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#47777B]/[0.12] text-[#355D61] border border-[#47777B]/30">
              <Cpu className="w-3.5 h-3.5 text-[#47777B]" />
              <span>Weather-Aware AI Assistant • Google Gemini 2.5 Flash</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#12231B]">
              AI Weather Storage & Purchasing Advisor
            </h2>
            <p className="text-sm text-[#635C4E] max-w-2xl">
              Combines live weather conditions with your inventory expiration dates to tell you which items can be stored long-term and which products to buy more of right now.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSyncLiveWeather}
              disabled={syncingWeather || loading}
              className="eco-btn-secondary whitespace-nowrap text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#47777B] ${syncingWeather ? 'animate-spin' : ''}`} />
              <span>{syncingWeather ? 'Syncing Weather...' : `Sync Live Weather (${savedLoc.city})`}</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerateForecast(question, weather)}
              disabled={loading}
              className="eco-btn-primary whitespace-nowrap"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Weather & Stock...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Live Gemini Forecast</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Business Role Selector (Restaurant Wholesale Access vs Supermarket) */}
        <div className="pt-3 border-t border-[#ECE6D6] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-[#635C4E]">
              Operation Role:
            </span>
            <span className="text-[#3D4E45] font-medium">
              {isSupermarketBusiness(businessType)
                ? 'Supermarket / Retail (Wholesale B2B disabled)'
                : 'Restaurant / Kitchen (Meat & Grocery wholesale enabled)'}
            </span>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-[#ECE6D6] border border-[#DED8C8]">
            <button
              type="button"
              onClick={() => handleSwitchBusinessRole(restaurantRoleValue)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isSupermarketBusiness(businessType)
                  ? 'bg-[#47777B] text-[#FFFDF9] shadow-sm'
                  : 'text-[#3D4E45] hover:text-[#12231B]'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Restaurant Owner{!userIsSupermarket ? ' (Active)' : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchBusinessRole('Supermarket / Kirana Hypermarket')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isSupermarketBusiness(businessType)
                  ? 'bg-[#12231B] text-[#FFFDF9] shadow-sm'
                  : 'text-[#3D4E45] hover:text-[#12231B]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Supermarket Owner{userIsSupermarket ? ' (Active)' : ''}</span>
            </button>
          </div>
        </div>

        {/* Weather Forecast Scenarios + Active Telemetry Pill */}
        <div className="pt-4 border-t border-[#ECE6D6] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#635C4E]">
              Weather Forecast Context ({weather.city})
            </span>
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-[#F5F1E8] border border-[#DED8C8] text-xs font-semibold text-[#12231B]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#47777B]" />
                {weather.city}
              </span>
              <span className="text-[#C7BFA9]">•</span>
              <span>{weather.condition}</span>
              <span className="text-[#C7BFA9]">•</span>
              <span className="inline-flex items-center gap-1 font-mono">
                <Thermometer className="w-3.5 h-3.5 text-[#D9532F]" />
                {weather.tempC} °C
              </span>
              <span className="inline-flex items-center gap-1 font-mono">
                <Droplets className="w-3.5 h-3.5 text-[#47777B]" />
                {weather.humidity}% RH
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {WEATHER_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = !weather.isLive && weather.condition === preset.condition;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#47777B] text-[#FFFDF9] border-[#355D61] shadow-sm'
                      : 'bg-[#F5F1E8]/70 text-[#12231B] border-[#DED8C8] hover:border-[#47777B]/60'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 ${
                      isSelected
                        ? 'bg-white/15 text-white'
                        : 'bg-[#FFFDF9] border border-[#DED8C8] text-[#47777B]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{preset.label}</div>
                    <div
                      className={`text-[11px] font-mono ${
                        isSelected ? 'text-white/85' : 'text-[#635C4E]'
                      }`}
                    >
                      {preset.tempC} °C • {preset.humidity}% RH
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {weatherNote && (
            <p className="text-xs font-medium text-[#355D61]">{weatherNote}</p>
          )}
        </div>

        {/* Ask AI Weather Assistant Input & Quick Chips */}
        <form onSubmit={handlePromptSubmit} className="pt-3 border-t border-[#ECE6D6] space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#635C4E]">
            Ask AI Weather Assistant
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask which items keep longest in humid rain or what produce/drinks to buy more..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#F5F1E8] border border-[#DED8C8] text-sm text-[#12231B] placeholder:text-[#827A69] focus:outline-none focus:border-[#47777B]"
            />
            <button
              type="submit"
              disabled={loading}
              className="eco-btn-primary whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>Ask Weather AI</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={loading}
                onClick={() => handleQuickPrompt(chip)}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#FFFDF9] border border-[#DED8C8] hover:border-[#47777B] text-[#3D4E45] hover:text-[#47777B] transition-colors disabled:opacity-60"
              >
                {chip}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-[#FDF4F1] border border-[#F2CFC4] text-xs text-[#B93D1D]">
            {error}
          </div>
        )}
      </div>

      {/* Empty State */}
      {!insight && !loading && (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <CloudSun className="w-10 h-10 text-[#47777B] mx-auto opacity-85" />
          <h3 className="font-display text-lg font-semibold text-[#12231B]">
            Ready to Analyze Your Weather & Inventory
          </h3>
          <p className="text-sm text-[#635C4E] max-w-md mx-auto">
            Pick a weather forecast above or click a quick question to see which stock keeps long-term and which products to buy more of.
          </p>
        </div>
      )}

      {/* Results Display */}
      {insight && (
        <div className="space-y-6">
          {/* AI Weather Impact & Assistant Briefing Banner */}
          {(insight.weatherContext || insight.assistantAnswer) && (
            <div className="rounded-3xl bg-gradient-to-br from-[#47777B] via-[#355D61] to-[#1E5E42] text-white p-6 shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/90">
                  <CloudSun className="w-4 h-4" />
                  <span>AI Weather Impact Briefing</span>
                </div>
                {insight.weatherContext && (
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/15 border border-white/20">
                    {insight.weatherContext.city} • {insight.weatherContext.condition} •{' '}
                    {insight.weatherContext.temperatureC} °C / {insight.weatherContext.humidityPercent}% RH
                  </span>
                )}
              </div>

              {insight.assistantAnswer && (
                <p className="text-sm sm:text-base font-medium leading-relaxed text-white">
                  {insight.assistantAnswer}
                </p>
              )}

              {insight.weatherContext?.weatherImpactSummary && (
                <p className="text-xs sm:text-sm text-white/85 pt-2 border-t border-white/20">
                  {insight.weatherContext.weatherImpactSummary}
                </p>
              )}
            </div>
          )}

          {/* Long-Term Storage vs Buy More Weather Demand Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Items You Can Keep for a Long Time */}
            <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#EEF5F1] text-[#1E5E42] border border-[#AFCFBD]">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#12231B]">
                    Items You Can Keep for a Long Time
                  </h3>
                  <p className="text-xs text-[#635C4E]">
                    Weather-safe shelf life & storage guidance (°C / % RH)
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(insight.longShelfLifeItems || []).map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F5F1E8]/75 border border-[#DED8C8] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-[#12231B]">{entry.item}</span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F6EE] text-[#19874B] border border-[#AFCFBD]">
                        {entry.safeStorageDuration}
                      </span>
                    </div>
                    {entry.currentStock && (
                      <div className="text-[11px] font-mono text-[#47777B]">
                        Current Stock: {entry.currentStock}
                      </div>
                    )}
                    <p className="text-xs text-[#3D4E45] leading-relaxed">{entry.storageAdvice}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Products You Should Buy More */}
            <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#47777B]/[0.12] text-[#47777B] border border-[#47777B]/30">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#12231B]">
                    Products You Should Buy More
                  </h3>
                  <p className="text-xs text-[#635C4E]">
                    High-demand restock targets driven by this weather forecast
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(insight.recommendedBuyMoreProducts || []).map((prod, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F5F1E8]/75 border border-[#DED8C8] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-[#12231B]">{prod.product}</span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#47777B] text-[#FFFDF9]">
                        Buy {prod.suggestedOrderQty}
                      </span>
                    </div>
                    <p className="text-xs text-[#3D4E45] leading-relaxed">{prod.weatherReason}</p>
                    {prod.estimatedShelfLife && (
                      <div className="text-[11px] font-mono text-[#635C4E] pt-1 border-t border-[#DED8C8]">
                        Expected Shelf Life: {prod.estimatedShelfLife}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Restaurant-Only Nearby Meat & Grocery Wholesale Sellers */}
          {isRestaurantEligibleBusiness(businessType) &&
            insight.nearbyWholesaleSuppliers?.eligible &&
            (insight.nearbyWholesaleSuppliers.meatWholesalers?.length > 0 ||
              insight.nearbyWholesaleSuppliers.groceryWholesalers?.length > 0) && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#47777B] text-[#FFFDF9]">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#12231B]">
                        Nearby Wholesale Suppliers (Exclusive to Restaurant Owners)
                      </h3>
                      <p className="text-xs text-[#635C4E]">
                        Verified meat & B2B grocery wholesale markets near{' '}
                        {insight.nearbyWholesaleSuppliers.city || weather.city}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-[#EEF5F1] text-[#1E5E42] border border-[#AFCFBD]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Restaurant Owner Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Nearby Meat & Poultry Wholesale Sellers */}
                  <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-[#FDF4F1] text-[#B93D1D] border border-[#F2CFC4]">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-display text-base font-bold text-[#12231B]">
                            Nearby Meat & Poultry Wholesale Sellers
                          </h4>
                          <p className="text-xs text-[#635C4E]">
                            Cold-chain certified bulk protein suppliers (°C)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(insight.nearbyWholesaleSuppliers.meatWholesalers || []).map((seller, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#F5F1E8]/75 border border-[#DED8C8] space-y-2"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-sm text-[#12231B]">
                                {seller.name}
                              </div>
                              <div className="text-[11px] text-[#635C4E] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-[#D9532F]" />
                                <span>{seller.marketArea}</span>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FFFDF9] border border-[#DED8C8] text-[#12231B]">
                              {seller.distanceKm}
                            </span>
                          </div>

                          <p className="text-xs text-[#3D4E45]">{seller.specialties}</p>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#DED8C8] text-[11px]">
                            <span className="font-bold text-[#B93D1D]">
                              {seller.wholesaleRate}
                            </span>
                            <span className="text-[#C7BFA9]">•</span>
                            <span className="font-medium text-[#3D4E45]">
                              MOQ: {seller.minOrderQty}
                            </span>
                            <span className="ml-auto px-2 py-0.5 rounded-full bg-[#47777B]/[0.12] text-[#355D61] font-semibold">
                              {seller.coldChainNote}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nearby Groceries & APMC Wholesale Sellers */}
                  <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-[#47777B]/[0.12] text-[#47777B] border border-[#47777B]/30">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-display text-base font-bold text-[#12231B]">
                            Nearby Groceries & APMC Wholesale Sellers
                          </h4>
                          <p className="text-xs text-[#635C4E]">
                            Bulk staples, produce & spice mandis (SI / ₹)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(insight.nearbyWholesaleSuppliers.groceryWholesalers || []).map(
                        (seller, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-[#F5F1E8]/75 border border-[#DED8C8] space-y-2"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-sm text-[#12231B]">
                                  {seller.name}
                                </div>
                                <div className="text-[11px] text-[#635C4E] flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-[#47777B]" />
                                  <span>{seller.marketArea}</span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FFFDF9] border border-[#DED8C8] text-[#12231B]">
                                {seller.distanceKm}
                              </span>
                            </div>

                            <p className="text-xs text-[#3D4E45]">{seller.specialties}</p>

                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#DED8C8] text-[11px]">
                              <span className="font-bold text-[#355D61]">
                                {seller.wholesaleRate}
                              </span>
                              <span className="text-[#C7BFA9]">•</span>
                              <span className="font-medium text-[#3D4E45]">
                                MOQ: {seller.minOrderQty}
                              </span>
                              <span className="ml-auto px-2 py-0.5 rounded-full bg-[#E8F6EE] text-[#19874B] font-semibold">
                                {seller.deliveryWindow}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Executive Summary */}
          <div className="glass-card rounded-2xl p-5 border-l-4 border-l-[#47777B]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#47777B]">
                Executive Optimization Summary
              </span>
              {source && (
                <span className="text-[11px] font-mono text-[#635C4E] px-2 py-0.5 rounded bg-[#ECE6D6]">
                  Engine: {source}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-[#12231B] leading-relaxed">{insight.summary}</p>
          </div>

          {/* Demand Warnings & Repurposing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predicted Demand Warnings */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#FEF8EE] text-[#9A540E] border border-[#F5D0A1]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#12231B]">
                    Predicted Demand & Over-Stock Warnings
                  </h3>
                  <p className="text-xs text-[#635C4E]">Concrete purchasing & prep adjustments</p>
                </div>
              </div>

              <div className="space-y-3">
                {(insight.predictedDemandWarnings || []).map((warn, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F5F1E8]/75 border border-[#DED8C8] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#9A540E]">{warn.item}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#FDF1DF] text-[#9A540E]">
                        Action Required
                      </span>
                    </div>
                    <p className="text-xs text-[#635C4E]">{warn.reason}</p>
                    <div className="flex items-start gap-2 pt-1.5 border-t border-[#DED8C8] text-xs text-[#1E5E42] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{warn.recommendedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Surplus Repurposing Ideas */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#47777B]/[0.12] text-[#47777B] border border-[#47777B]/30">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#12231B]">
                    Zero-Waste Culinary Repurposing Ideas
                  </h3>
                  <p className="text-xs text-[#635C4E]">High-margin menu extensions for nearing stock</p>
                </div>
              </div>

              <div className="space-y-3">
                {(insight.surplusRepurposingIdeas || []).map((idea, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F5F1E8]/75 border border-[#DED8C8] space-y-1.5"
                  >
                    <div className="font-semibold text-sm text-[#47777B]">{idea.ingredient}</div>
                    <p className="text-xs text-[#3D4E45] leading-relaxed">{idea.recipeIdea}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carbon Reduction Tip */}
          {insight.carbonReductionTip && (
            <div className="glass-card rounded-2xl p-5 bg-[#EEF5F1] border border-[#AFCFBD] flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-[#1E5E42] text-white flex-shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E5E42] mb-1">
                  Carbon Footprint Impact Highlight
                </h4>
                <p className="text-sm text-[#12231B]">{insight.carbonReductionTip}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
