import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Sparkles,
  TrendingUp,
  PackageCheck,
  HandHeart,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Droplets,
  Store,
  Utensils,
  Truck,
  Clock,
  CheckCircle2,
  Layers,
  Bell,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LocationBadge from '../components/LocationBadge';

const WEATHER_SCENARIOS = {
  monsoon: {
    id: 'monsoon',
    label: 'Monsoon',
    temp: '24 °C',
    humidity: '86% RH',
    condition: 'Heavy Rain & High Humidity',
    icon: CloudRain,
    badgeClass: 'bg-[#47777B]/[0.14] text-[#355D61] border-[#47777B]/35',
    keepLongTerm: [
      { item: 'Sona Masoori Rice Bags', qty: '75 kg', shelf: '180+ days (Airtight Bins)' },
      { item: 'Toor & Chana Dal Dry Lots', qty: '40 kg', shelf: '150+ days (Low-Moisture)' }
    ],
    buyMoreNow: [
      { item: 'Fresh Ginger, Garlic & Turmeric', qty: '+12 kg', reason: 'Monsoon immunity & hot-broth surge' },
      { item: 'Assam CTC Tea & Cardamom', qty: '+6 kg', reason: '+32% evening chai & soup covers' }
    ]
  },
  heatwave: {
    id: 'heatwave',
    label: 'Heatwave',
    temp: '36 °C',
    humidity: '34% RH',
    condition: 'Peak Summer Heat',
    icon: Sun,
    badgeClass: 'bg-[#FEF8EE] text-[#9A540E] border-[#F5D0A1]',
    keepLongTerm: [
      { item: 'Cold-Pressed Groundnut Oil', qty: '35 L', shelf: '120+ days (Ambient Cool Store)' },
      { item: 'Whole Spices & Dry Lentils', qty: '28 kg', shelf: '180+ days (UV-Shielded)' }
    ],
    buyMoreNow: [
      { item: 'Tender Coconut & Mint Leaves', qty: '+18 kg', reason: 'Chilled beverage velocity up 44%' },
      { item: 'A2 Curd & Buttermilk Base', qty: '+25 L', reason: 'High daytime cooling demand' }
    ]
  },
  pleasant: {
    id: 'pleasant',
    label: 'Pleasant',
    temp: '22 °C',
    humidity: '55% RH',
    condition: 'Clear Breezy Evening',
    icon: Wind,
    badgeClass: 'bg-[#19874B]/[0.12] text-[#146C3C] border-[#19874B]/30',
    keepLongTerm: [
      { item: 'Basmati Aged Reserve Sacks', qty: '60 kg', shelf: '210+ days (Dry Pantry)' },
      { item: 'Ghee Tins & Dry Cashews', qty: '15 kg', shelf: '140+ days (Sealed Drum)' }
    ],
    buyMoreNow: [
      { item: 'Heirloom Tomatoes & Herbs', qty: '+15 kg', reason: 'Outdoor dining bookings +28%' },
      { item: 'Tandoor Poultry & Paneer Cuts', qty: '+20 kg', reason: 'Evening grill & banquet rush' }
    ]
  }
};

const ROLE_WORKFLOWS = {
  restaurant: {
    id: 'restaurant',
    title: 'Restaurant & Cloud Kitchen Mode',
    badge: 'Wholesale Enabled',
    icon: Utensils,
    headline: 'Live Prep Telemetry + Nearby APMC & Cold-Chain Meat Wholesalers',
    description:
      'Designed for executive chefs and commercial kitchens. Reclaim prep trimmings with Gemini zero-waste recipes, track high-turn batches in kg and L, and source fresh bulk restocks from vetted city wholesale hubs.',
    features: [
      'Prep-trim & plate-waste logging mapped to exact ₹ INR loss and kg CO2e',
      'Weather-calibrated daily prep quantity guidance in SI units (kg, g, L, mL)',
      'Exclusive Restaurant-Only access to nearby wholesale meat & APMC grocery sellers'
    ],
    wholesaleTitle: 'Nearby Wholesale Suppliers (Restaurant Exclusive)',
    wholesaleSub: 'Verified cold-chain poultry/meat & APMC mandi hubs sorted by distance (km)',
    suppliers: [
      {
        name: 'KR Market & Yeshwanthpur APMC Hub',
        type: 'Groceries & Produce Wholesale',
        distance: '3.4 km',
        savings: '22% bulk margin',
        tag: 'Daily 05:30 IST Dispatch'
      },
      {
        name: 'Deccan Cold-Chain Meat & Poultry',
        type: 'FSSAI Chilled Meat Wholesaler',
        distance: '4.8 km',
        savings: '18% chef contract',
        tag: '0–4 °C Reefer Certified'
      }
    ]
  },
  supermarket: {
    id: 'supermarket',
    title: 'Supermarket & Hypermarket Mode',
    badge: 'Retail Shelf Focus',
    icon: Store,
    headline: 'FEFO Batch Intelligence, Dynamic Markdowns & FSSAI Surplus Divert',
    description:
      'Built for modern grocery retail and hypermarket chains. Prevent aisle shrink across chilled, dairy, and bakery bays with automated markdown triggers and direct 1-click pickup scheduling with local NGOs.',
    features: [
      'Aisle-level expiration countdowns (Critical < 48 hr, Warning < 5 days)',
      'Weather-driven shelf velocity alerts for dry pantry vs chilled beverages',
      'Direct FSSAI Save Food Share Food & Section 80G NGO batch dispatch'
    ],
    wholesaleTitle: 'Retail Inventory Safeguard Active',
    wholesaleSub: 'Restaurant meat & APMC wholesale prompts are automatically excluded for Supermarket Owners',
    suppliers: []
  }
};

const HERO_CURVE_PATH = 'M 10 82 C 45 78, 65 44, 105 52 C 145 60, 175 24, 220 30 C 255 35, 275 14, 304 16';
const HERO_CURVE_AREA = `${HERO_CURVE_PATH} L 304 96 L 10 96 Z`;

export default function LandingPage() {
  const { user, isAuthenticated, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [weatherKey, setWeatherKey] = useState('monsoon');
  const [activeRole, setActiveRole] = useState('restaurant');
  const [showBlueprint, setShowBlueprint] = useState(false);

  const weather = WEATHER_SCENARIOS[weatherKey];
  const WeatherIcon = weather.icon;
  const roleData = ROLE_WORKFLOWS[activeRole];
  const RoleIcon = roleData.icon;

  const handleDemoLaunch = async () => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch (err) {
      console.error('Demo launch failed:', err);
      navigate('/login');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-[#12231B] flex flex-col selection:bg-[#47777B]/20 selection:text-[#12231B]">
      {/* Floating Glass Pill Header */}
      <header className="sticky top-0 z-30 pt-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto rounded-2xl border border-[#DED8C8]/90 bg-[#FFFDF9]/85 backdrop-blur-md shadow-[0_6px_24px_rgba(18,35,27,0.06)] px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#47777B] to-[#1E5E42] text-[#FFFDF9] shadow-sm">
              <Leaf className="w-5 h-5 text-[#FFFDF9]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-[#12231B] leading-none">
                EcoPulse AI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#47777B] mt-0.5">
                Verdigris Supply OS
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#3D4E45]">
            <a href="#platform" className="hover:text-[#47777B] transition-colors">
              Platform
            </a>
            <a href="#weather-ai" className="hover:text-[#47777B] transition-colors">
              Weather AI
            </a>
            <a href="#workflows" className="hover:text-[#47777B] transition-colors">
              Chef vs Retail
            </a>
            <a href="#impact" className="hover:text-[#47777B] transition-colors">
              NGO Impact
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <LocationBadge user={user} />
            {isAuthenticated ? (
              <Link to="/dashboard" className="eco-btn-primary">
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="eco-btn-secondary">
                  Sign In
                </Link>
                <Link to="/register" className="eco-btn-primary hidden sm:inline-flex">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Asymmetric Split Hero Section */}
        <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-24 px-4 sm:px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(71,119,123,0.16),_rgba(25,135,75,0.06)_42%,_transparent_75%)] pointer-events-none" />
          <div className="absolute -top-24 right-0 w-[420px] h-[420px] rounded-full bg-[#47777B]/[0.08] blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Hero Left Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#47777B]/[0.12] border border-[#47777B]/35 text-[#355D61] text-xs font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#19874B] animate-pulse" />
                <span>Supabase Cloud • Weather AI • SI Units & ₹ INR</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl xl:text-[56px] font-bold tracking-tight leading-[1.08] text-[#12231B]">
                Turn Kitchen & Shelf Surplus Into{' '}
                <span className="eco-gradient-text italic font-semibold">
                  Predictable Value
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#3D4E45] max-w-xl leading-relaxed">
                EcoPulse AI unifies SI-tracked inventory (kg, L), Gemini 2.5 weather-aware stocking guidance, hyperlocal wholesale sourcing for restaurants, and 1-click FSSAI NGO diversion across India.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <button
                  onClick={handleDemoLaunch}
                  disabled={demoLoading}
                  className="eco-btn-primary px-6 py-3.5 text-sm sm:text-base justify-center"
                >
                  {demoLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Launching Live Workspace...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Explore Live Demo Dashboard</span>
                    </>
                  )}
                </button>

                <Link
                  to="/register"
                  className="eco-btn-secondary px-6 py-3.5 text-sm sm:text-base justify-center"
                >
                  <span>Register Organization</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust KPI Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                {[
                  { label: 'Waste Reduced', value: '38%', sub: 'Within 60 days', bar: 'bg-[#47777B]', text: 'text-[#355D61]' },
                  { label: 'Carbon Offset', value: '4.2 t', sub: 'CO2e / site / yr', bar: 'bg-[#D9822B]', text: 'text-[#9A540E]' },
                  { label: 'Forecast Accuracy', value: '94.6%', sub: 'Weather Gemini AI', bar: 'bg-[#D9532F]', text: 'text-[#B93D1D]' },
                  { label: 'NGO Dispatch', value: '< 2 hr', sub: 'Matched by km', bar: 'bg-[#19874B]', text: 'text-[#146C3C]' }
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden glass-card rounded-2xl p-3.5 pt-4 hover:-translate-y-0.5 transition-all"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${stat.bar}`} />
                    <div className={`font-display text-xl sm:text-2xl font-bold ${stat.text}`}>
                      {stat.value}
                    </div>
                    <div className="text-[11px] font-bold text-[#12231B] mt-0.5">{stat.label}</div>
                    <div className="text-[10px] text-[#635C4E]">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Right Column: Interactive Live Command Center Preview */}
            <div className="lg:col-span-6">
              <div className="relative rounded-[28px] border border-[#DED8C8] bg-[#FFFDF9] p-4 sm:p-5 shadow-[0_24px_60px_rgba(18,35,27,0.12)]">
                {/* Preview Shell Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-[#EFEAE0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#47777B]/[0.12] border border-[#47777B]/25 flex items-center justify-center text-[#355D61]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#635C4E]">
                        Command Center Preview
                      </p>
                      <p className="text-xs font-bold text-[#12231B]">
                        Saffron Leaf Bistro • Indiranagar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBlueprint((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        showBlueprint
                          ? 'bg-[#12231B] text-[#FFFDF9] border-[#12231B]'
                          : 'bg-[#F5F1E8] text-[#3D4E45] border-[#DED8C8] hover:border-[#47777B]/50'
                      }`}
                    >
                      {showBlueprint ? 'Live UI View' : 'Design Process'}
                    </button>
                    <div className="w-8 h-8 rounded-xl border border-[#DED8C8] bg-[#F5F1E8]/70 flex items-center justify-center relative">
                      <Bell className="w-4 h-4 text-[#3D4E45]" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#19874B]" />
                    </div>
                  </div>
                </div>

                {/* Toggleable Blueprint Mode vs Live Interactive UI */}
                {showBlueprint ? (
                  <div className="rounded-2xl bg-[#0B1410] text-[#E6F4EC] p-5 space-y-4 border border-[#1E5E42]/50 font-mono">
                    <div className="flex items-center justify-between text-[11px] text-[#7BD69E]">
                      <span>DESIGN_PROCESS // WIREFRAME SPEC</span>
                      <span>GRID: 12-COL SI</span>
                    </div>
                    <div className="h-32 rounded-xl border border-dashed border-[#47777B] bg-[#47777B]/10 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#9BC4C7]">HERO_VALUE_CARD [INR]</span>
                        <span className="w-7 h-7 rounded-lg border border-dashed border-[#7BD69E]" />
                      </div>
                      <svg viewBox="0 0 320 60" className="w-full h-12">
                        <path
                          d="M 10 48 C 60 44, 90 22, 150 32 C 210 42, 240 12, 310 10"
                          fill="none"
                          stroke="#7BD69E"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                        <circle cx="310" cy="10" r="4" fill="#7BD69E" />
                      </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="rounded-xl border border-dashed border-[#47777B]/60 p-3">
                        <p className="text-[#9BC4C7]">KEEP_LONG_TERM</p>
                        <p className="text-[#E6F4EC]/75 mt-1">Dry grains • 180d shelf</p>
                      </div>
                      <div className="rounded-xl border border-dashed border-[#D9822B]/60 p-3">
                        <p className="text-[#F5D0A1]">WEATHER_BUY_MORE</p>
                        <p className="text-[#E6F4EC]/75 mt-1">Forecast velocity • +kg</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {['Log Batch', 'Weather AI', 'NGO Match'].map((slot) => (
                        <div
                          key={slot}
                          className="rounded-xl border border-dashed border-[#7BD69E]/40 py-2 text-center text-[10px] text-[#7BD69E]"
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Signature Green + Verdigris Hero Value Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#19874B] via-[#1E7A56] to-[#47777B] text-[#FFFDF9] p-5 shadow-[0_14px_30px_rgba(25,135,75,0.22)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-[#E4F7EC]/90">
                            Total Value Preserved
                          </p>
                          <div className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">
                            ₹1,42,850.00
                          </div>
                          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-medium">
                            <span>+18.4% vs last 30 days</span>
                            <span>•</span>
                            <span>1,240 kg diverted</span>
                          </div>
                        </div>

                        <div className="w-11 h-11 rounded-2xl bg-[#FFFDF9] text-[#19874B] flex items-center justify-center shadow-md shrink-0">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Smooth SVG Bezier Curve */}
                      <div className="mt-3 -mx-2">
                        <svg viewBox="0 0 320 96" className="w-full h-20 overflow-visible">
                          <defs>
                            <linearGradient id="landingHeroCurveFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
                              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path d={HERO_CURVE_AREA} fill="url(#landingHeroCurveFill)" />
                          <path
                            d={HERO_CURVE_PATH}
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <circle cx="304" cy="16" r="5" fill="#FFFFFF" />
                          <circle cx="304" cy="16" r="10" fill="#FFFFFF" fillOpacity="0.28" />
                        </svg>
                      </div>
                    </div>

                    {/* Interactive Weather Forecast Preview Strip */}
                    <div id="weather-ai" className="rounded-2xl border border-[#DED8C8] bg-[#F5F1E8]/75 p-3.5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${weather.badgeClass}`}>
                            <WeatherIcon className="w-3.5 h-3.5" />
                            <span>{weather.temp} • {weather.humidity}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-[#12231B] hidden sm:inline">
                            {weather.condition}
                          </span>
                        </div>

                        <div className="inline-flex rounded-xl bg-[#ECE6D6] p-0.5 border border-[#DED8C8]">
                          {Object.values(WEATHER_SCENARIOS).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setWeatherKey(item.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                weatherKey === item.id
                                  ? 'bg-[#47777B] text-[#FFFDF9] shadow-sm'
                                  : 'text-[#3D4E45] hover:text-[#12231B]'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Keep Long-Term Card */}
                        <div className="rounded-xl bg-[#FFFDF9] border border-[#DED8C8] p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#355D61]">
                            <span>KEEP LONG-TERM</span>
                            <Clock className="w-3.5 h-3.5 text-[#47777B]" />
                          </div>
                          {weather.keepLongTerm.map((row, idx) => (
                            <div key={idx} className="text-[11px] leading-tight">
                              <span className="font-semibold text-[#12231B]">{row.item}</span>{' '}
                              <span className="text-[#47777B] font-mono">({row.qty})</span>
                              <div className="text-[10px] text-[#635C4E]">{row.shelf}</div>
                            </div>
                          ))}
                        </div>

                        {/* Buy More Now Card */}
                        <div className="rounded-xl bg-[#FFFDF9] border border-[#DED8C8] p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#146C3C]">
                            <span>BUY MORE NOW</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#19874B]" />
                          </div>
                          {weather.buyMoreNow.map((row, idx) => (
                            <div key={idx} className="text-[11px] leading-tight">
                              <span className="font-semibold text-[#12231B]">{row.item}</span>{' '}
                              <span className="text-[#19874B] font-mono font-semibold">{row.qty}</span>
                              <div className="text-[10px] text-[#635C4E]">{row.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Overview Soft-Green Action Squircles */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-xs font-bold text-[#12231B]">Overview Quick Actions</span>
                      <span className="text-[11px] text-[#635C4E]">This Week</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: 'Log Batch', sub: 'SI units (kg/L)', icon: PackageCheck, to: '/inventory' },
                        { label: 'Weather AI', sub: 'Gemini 2.5', icon: Sparkles, action: handleDemoLaunch },
                        { label: 'NGO Match', sub: 'FSSAI 80G', icon: HandHeart, to: '/donations' }
                      ].map((tile, idx) => {
                        const TileIcon = tile.icon;
                        const content = (
                          <div className="rounded-2xl border border-[#DED8C8] bg-[#F5F1E8]/55 hover:bg-[#EAF6EE] hover:border-[#19874B]/35 p-2.5 text-center transition-all cursor-pointer">
                            <div className="w-9 h-9 mx-auto rounded-xl bg-[#EAF6EE] text-[#19874B] flex items-center justify-center mb-1.5">
                              <TileIcon className="w-4 h-4" />
                            </div>
                            <div className="text-[11px] font-bold text-[#12231B]">{tile.label}</div>
                            <div className="text-[10px] text-[#635C4E]">{tile.sub}</div>
                          </div>
                        );

                        return tile.to ? (
                          <Link key={idx} to={tile.to}>
                            {content}
                          </Link>
                        ) : (
                          <button key={idx} type="button" onClick={tile.action} className="text-left">
                            {content}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Role-Tailored Workflow Section */}
        <section id="workflows" className="py-16 px-4 sm:px-6 border-t border-[#DED8C8] bg-[#ECE6D6]/50">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#47777B]/[0.12] border border-[#47777B]/30 text-[#355D61] text-xs font-semibold">
                  <Store className="w-3.5 h-3.5" />
                  <span>Role-Aware Intelligence</span>
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#12231B]">
                  Tailored for Both Kitchens & Supermarkets
                </h2>
                <p className="text-sm text-[#3D4E45]">
                  Switch roles below to see how EcoPulse AI adapts sourcing workflows — suggesting nearby meat and grocery wholesale hubs exclusively for restaurant owners.
                </p>
              </div>

              <div className="inline-flex rounded-2xl bg-[#FFFDF9] p-1 border border-[#DED8C8] shadow-sm self-start">
                <button
                  type="button"
                  onClick={() => setActiveRole('restaurant')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeRole === 'restaurant'
                      ? 'bg-[#47777B] text-[#FFFDF9] shadow-sm'
                      : 'text-[#3D4E45] hover:text-[#12231B]'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Restaurant Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRole('supermarket')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeRole === 'supermarket'
                      ? 'bg-[#19874B] text-[#FFFDF9] shadow-sm'
                      : 'text-[#3D4E45] hover:text-[#12231B]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Supermarket Owner</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Role Capabilities Panel */}
              <div className="lg:col-span-6 glass-card rounded-3xl p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      activeRole === 'restaurant'
                        ? 'bg-[#47777B]/[0.14] text-[#355D61]'
                        : 'bg-[#19874B]/[0.12] text-[#146C3C]'
                    }`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#12231B]">{roleData.title}</h3>
                      <span className="text-[11px] font-semibold text-[#47777B]">{roleData.badge}</span>
                    </div>
                  </div>
                </div>

                <h4 className="font-display text-xl font-semibold text-[#12231B] leading-snug">
                  {roleData.headline}
                </h4>
                <p className="text-sm text-[#3D4E45] leading-relaxed">
                  {roleData.description}
                </p>

                <ul className="space-y-2.5 pt-1">
                  {roleData.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#12231B]">
                      <CheckCircle2 className="w-4 h-4 text-[#19874B] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dynamic Wholesale Sourcing Preview */}
              <div className="lg:col-span-6 rounded-3xl border border-[#DED8C8] bg-[#FFFDF9] p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#47777B]">
                      {roleData.wholesaleTitle}
                    </span>
                    <Truck className="w-4 h-4 text-[#47777B]" />
                  </div>
                  <p className="text-xs text-[#635C4E]">{roleData.wholesaleSub}</p>
                </div>

                {activeRole === 'restaurant' ? (
                  <div className="space-y-3">
                    {roleData.suppliers.map((sup, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#DED8C8] bg-[#F5F1E8]/65 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="font-display font-bold text-sm text-[#12231B]">{sup.name}</div>
                          <div className="text-xs text-[#47777B] font-medium">{sup.type}</div>
                          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#635C4E]">
                            <MapPin className="w-3 h-3 text-[#D9532F]" />
                            <span>{sup.distance} away</span>
                            <span>•</span>
                            <span>{sup.tag}</span>
                          </div>
                        </div>
                        <span className="self-start sm:self-center px-3 py-1 rounded-full bg-[#19874B]/[0.12] text-[#146C3C] text-xs font-bold whitespace-nowrap">
                          {sup.savings}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#19874B]/35 bg-[#EAF6EE]/55 p-6 text-center space-y-2.5 my-auto">
                    <div className="w-11 h-11 mx-auto rounded-2xl bg-[#FFFDF9] border border-[#19874B]/25 text-[#19874B] flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-base font-bold text-[#12231B]">
                      Wholesale Meat & APMC Prompts Disabled
                    </h4>
                    <p className="text-xs text-[#3D4E45] max-w-md mx-auto leading-relaxed">
                      Because Supermarket Owners manage retail aisles directly, EcoPulse AI automatically omits restaurant wholesale seller cards so your dashboard focuses strictly on shelf-life FEFO batches, weather demand, and FSSAI NGO surplus pickups.
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-[#EFEAE0] flex items-center justify-between text-xs">
                  <span className="text-[#635C4E]">
                    Powered by property profile role detection
                  </span>
                  <button
                    type="button"
                    onClick={handleDemoLaunch}
                    className="font-semibold text-[#47777B] hover:text-[#1E5E42] inline-flex items-center gap-1"
                  >
                    <span>Test in Live App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Asymmetric Bento Platform Grid */}
        <section id="platform" className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#12231B]">
                Complete Urban Food Sustainability Operating System
              </h2>
              <p className="text-sm text-[#635C4E]">
                Engineered with Supabase PostgreSQL Row Level Security, strict SI telemetry, and Gemini 2.5 intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: PackageCheck,
                  title: 'SI Expiration Intelligence',
                  desc: 'Track batches strictly in kg, g, L, and mL with cost per unit in ₹ INR and automated urgency countdowns.',
                  badgeBg: 'bg-[#47777B]/[0.12] border-[#47777B]/30 text-[#355D61]',
                  hover: 'hover:border-[#47777B]/50'
                },
                {
                  icon: Thermometer,
                  title: 'Weather-Driven AI Buying',
                  desc: 'Compare 7-day temperature (°C) and humidity (%) against live stock to highlight long-storage items vs urgent restocks.',
                  badgeBg: 'bg-[#FEF8EE] border-[#F5D0A1] text-[#9A540E]',
                  hover: 'hover:border-[#D9822B]/50'
                },
                {
                  icon: BarChart3,
                  title: 'Waste & Carbon Audit',
                  desc: 'Log daily prep trimmings, plate waste, and spoilage to quantify exact ₹ financial drain and kg CO2e impact.',
                  badgeBg: 'bg-[#FDF4F1] border-[#F2CFC4] text-[#B93D1D]',
                  hover: 'hover:border-[#D9532F]/50'
                },
                {
                  icon: HandHeart,
                  title: 'FSSAI & 80G NGO Routing',
                  desc: 'Match surplus trays with Robin Hood Army, Feeding India, Akshaya Patra, and local composters within km reach.',
                  badgeBg: 'bg-[#19874B]/[0.12] border-[#19874B]/30 text-[#146C3C]',
                  hover: 'hover:border-[#19874B]/50'
                }
              ].map((card, idx) => {
                const CardIcon = card.icon;
                return (
                  <div
                    key={idx}
                    className={`glass-card rounded-2xl p-6 space-y-3 hover:-translate-y-0.5 hover:shadow-md transition-all ${card.hover}`}
                  >
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${card.badgeBg}`}>
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#12231B]">{card.title}</h3>
                    <p className="text-xs text-[#635C4E] leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom Deep Botanical CTA Banner */}
        <section id="impact" className="pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-[#12231B] via-[#1C3B2E] to-[#355D61] text-[#FFFDF9] p-8 sm:p-12 shadow-[0_24px_50px_rgba(18,35,27,0.18)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#D6F5E3]">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Ready in under 60 seconds • Zero hardware needed</span>
                </div>
                <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight">
                  Start Saving Inventory Value & Cutting Food Waste Today
                </h2>
                <p className="text-sm sm:text-base text-[#D8E5DF] max-w-2xl">
                  Launch the pre-populated Indian demo kitchen immediately or register your own restaurant or supermarket property with custom location & weather forecasting.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <button
                  type="button"
                  onClick={handleDemoLaunch}
                  disabled={demoLoading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FFFDF9] text-[#12231B] font-bold text-sm hover:bg-[#EAF6EE] transition-all shadow-md"
                >
                  {demoLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Demo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#19874B]" />
                      <span>Launch Interactive Demo</span>
                    </>
                  )}
                </button>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 border border-white/25 text-[#FFFDF9] font-semibold text-sm hover:bg-white/15 transition-all"
                >
                  <span>Create Free Organization</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DED8C8] bg-[#FFFDF9]/90 py-6 px-4 text-center text-xs text-[#635C4E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#47777B]" />
            <span className="font-medium text-[#12231B]">
              EcoPulse AI • Botanical Harvest & Verdigris Edition
            </span>
          </div>
          <span className="font-mono text-[11px] px-3 py-1 rounded-lg bg-[#ECE6D6] text-[#3D4E45]">
            Demo Account: demo@ecopulse.io / password123
          </span>
        </div>
      </footer>
    </div>
  );
}
