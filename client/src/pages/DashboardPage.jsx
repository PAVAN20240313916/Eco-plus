import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  DollarSign,
  Leaf,
  CloudOff,
  AlertTriangle,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
  Loader2,
  Bell,
  Layers,
  TrendingUp,
  Download,
  Wallet,
  HandHeart,
  ChevronDown,
  Utensils,
  ShoppingBag,
  Truck,
  MapPin
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import WasteChart from '../components/WasteChart';
import PropertyPhotoWidget, { getPropertyPhoto } from '../components/PropertyPhotoWidget';

const PERIOD_OPTIONS = ['This Week', 'Today', 'This Month'];

const DASHBOARD_WHOLESALE_DIRECTORY = {
  bengaluru: {
    city: 'Bengaluru, KA',
    meat: [
      {
        name: 'Russell Market Halal Meat & Poultry Wholesale',
        area: 'Shivajinagar / Russell Market',
        distance: '2.8 km',
        rate: '₹215–₹690/kg',
        items: 'Broiler Chicken, Curry-Cut Goat, Boneless Breast'
      },
      {
        name: 'Yeshwanthpur Fresh Hatcheries & Seafood Mart',
        area: 'Yeshwanthpur Wholesale Yard',
        distance: '5.4 km',
        rate: '₹205–₹540/kg',
        items: 'Farm Poultry, Freshwater Rohu, Tiger Prawns'
      }
    ],
    groceries: [
      {
        name: 'Yeshwanthpur APMC Grain & Pulse Traders',
        area: 'APMC Yard, Yeshwanthpur',
        distance: '5.8 km',
        rate: '₹58–₹135/kg',
        items: 'Basmati Rice, Toor Dal, Besan, Mustard Oil'
      },
      {
        name: 'KR Market Onion, Potato & Spice Syndicate',
        area: 'KR Market B2B Lane',
        distance: '3.2 km',
        rate: '₹26–₹210/kg',
        items: 'Red Onions, Potatoes, Guntur Chillies, Ginger'
      }
    ]
  },
  mumbai: {
    city: 'Mumbai, MH',
    meat: [
      {
        name: 'Crawford Market Prime Poultry & Mutton Guild',
        area: 'Crawford Market, Fort',
        distance: '2.5 km',
        rate: '₹225–₹740/kg',
        items: 'Chef-Cut Chicken, Tender Goat Cuts, Kheema'
      },
      {
        name: 'Sassoon Dock B2B Seafood & Fish Cold Chain',
        area: 'Colaba / Sassoon Dock',
        distance: '4.8 km',
        rate: '₹340–₹890/kg',
        items: 'Surmai, Pomfret, Cleaned White Prawns'
      }
    ],
    groceries: [
      {
        name: 'Vashi APMC Grain, Dal & Oil Wholesale Hub',
        area: 'APMC Market, Vashi',
        distance: '8.5 km',
        rate: '₹56–₹155/kg',
        items: 'Kolam Rice, Toor Dal, Besan, Groundnut Oil'
      },
      {
        name: 'Masjid Bunder Spice & Dry-Fruit Bazaar',
        area: 'Masjid Bunder',
        distance: '3.1 km',
        rate: '₹210–₹920/kg',
        items: 'Whole Garam Masala, Cashews, Cardamom, Tea'
      }
    ]
  },
  delhi: {
    city: 'Delhi NCR',
    meat: [
      {
        name: 'Ghazipur Poultry & Fresh Meat Mandi',
        area: 'Ghazipur Wholesale Market',
        distance: '6.4 km',
        rate: '₹195–₹290/kg',
        items: 'Broiler Whole Birds, Tangdi, Boneless Tikka Cut'
      },
      {
        name: 'INA Market Chef-Cut Meats & Seafood',
        area: 'INA Commercial Arcade',
        distance: '3.4 km',
        rate: '₹390–₹780/kg',
        items: 'Mutton Raan, Sole Fillet, Jumbo Prawns'
      }
    ],
    groceries: [
      {
        name: 'Khari Baoli Whole Spice & Dry Pantry Exchange',
        area: 'Khari Baoli, Old Delhi',
        distance: '4.1 km',
        rate: '₹180–₹850/kg',
        items: 'Cumin, Black Cardamom, Whole Chillies, Ghee'
      },
      {
        name: 'Azadpur APMC Produce & Root Mandi',
        area: 'Azadpur Subzi Mandi',
        distance: '7.5 km',
        rate: '₹24–₹110/kg',
        items: 'Potatoes, Onions, Tomatoes, Fresh Ginger'
      }
    ]
  },
  hyderabad: {
    city: 'Hyderabad, TS',
    meat: [
      {
        name: 'Jiyaguda Certified Mutton & Poultry Mandi',
        area: 'Jiyaguda Wholesale Yard',
        distance: '4.3 km',
        rate: '₹205–₹720/kg',
        items: 'Biryani-Cut Goat, Tender Broiler, Lollipop'
      },
      {
        name: 'Ramnagar Fresh Fish & Prawns Cold Depot',
        area: 'Ramnagar Fish Market',
        distance: '3.7 km',
        rate: '₹230–₹590/kg',
        items: 'Korameenu, Rohu, Coastal Prawns'
      }
    ],
    groceries: [
      {
        name: 'Bowenpally APMC Vegetable & Spice Yard',
        area: 'Bowenpally Market Yard',
        distance: '5.9 km',
        rate: '₹25–₹105/kg',
        items: 'Onions, Tomatoes, Green Chillies, Mint & Ginger'
      },
      {
        name: 'Malakpet Sona Masoori & Grain Wholesale',
        area: 'Malakpet Gunj',
        distance: '4.8 km',
        rate: '₹52–₹128/kg',
        items: 'Aged Basmati, Sona Masoori Rice, Toor Dal'
      }
    ]
  },
  chennai: {
    city: 'Chennai, TN',
    meat: [
      {
        name: 'Chintadripet Meat & Poultry Wholesale Market',
        area: 'Chintadripet',
        distance: '2.9 km',
        rate: '₹210–₹730/kg',
        items: 'Curry-Cut Chicken, Tender Goat, Keema'
      },
      {
        name: 'Kasimedu Fishing Harbour B2B Seafood Supply',
        area: 'Royapuram / Kasimedu',
        distance: '5.6 km',
        rate: '₹310–₹860/kg',
        items: 'Seer Fish (Vanjaram), Crab, Tiger Prawns'
      }
    ],
    groceries: [
      {
        name: 'Koyambedu Wholesale Produce & Vegetable Market',
        area: 'Koyambedu Market Complex',
        distance: '6.2 km',
        rate: '₹28–₹115/kg',
        items: 'Small Shallots, Tomatoes, Ginger, Curry Leaves'
      },
      {
        name: 'Kothawal Chavadi Bulk Spice & Dal Traders',
        area: 'George Town',
        distance: '3.3 km',
        rate: '₹48–₹142/kg',
        items: 'Idli Rice, Urad Dal, Toor Dal, Tamarind'
      }
    ]
  },
  pune: {
    city: 'Pune, MH',
    meat: [
      {
        name: 'Camp Shivaji Market Poultry & Mutton B2B',
        area: 'MG Road / Camp',
        distance: '2.7 km',
        rate: '₹215–₹720/kg',
        items: 'Boneless Chicken, Curry-Cut Mutton, Keema'
      },
      {
        name: 'Ganesh Peth Wholesale Fish & Cold-Cut Hub',
        area: 'Ganesh Peth',
        distance: '3.4 km',
        rate: '₹260–₹790/kg',
        items: 'Surmai, Rohu, Prawns, Marinated Cuts'
      }
    ],
    groceries: [
      {
        name: 'Gultekdi Market Yard APMC Grain & Onion Hub',
        area: 'Market Yard, Gultekdi',
        distance: '4.5 km',
        rate: '₹24–₹125/kg',
        items: 'Onions, Potatoes, Indrayani Rice, Tur Dal'
      },
      {
        name: 'Bhavani Peth Dry Goods & Oil Merchants',
        area: 'Bhavani Peth',
        distance: '3.2 km',
        rate: '₹44–₹165/kg',
        items: 'Besan, Groundnut Oil, Poha, Sugar'
      }
    ]
  },
  kolkata: {
    city: 'Kolkata, WB',
    meat: [
      {
        name: 'New Market Hogg Meat & Poultry Arcade',
        area: 'Esplanade / New Market',
        distance: '2.4 km',
        rate: '₹210–₹740/kg',
        items: 'Biryani Mutton, Country & Broiler Chicken Cuts'
      },
      {
        name: 'Howrah Paikari Fish & Prawn Wholesale Mandi',
        area: 'Howrah Fish Market',
        distance: '4.9 km',
        rate: '₹230–₹760/kg',
        items: 'Bhetki Fillet, Rohu, Katla, Bagda Chingri'
      }
    ],
    groceries: [
      {
        name: 'Posta Bazar Mustard Oil, Dal & Rice Exchange',
        area: 'Posta Bazar',
        distance: '4.1 km',
        rate: '₹62–₹168/kg or L',
        items: 'Kachi Ghani Mustard Oil, Gobindobhog Rice'
      },
      {
        name: 'Koley Market Fresh Produce & Potato Yard',
        area: 'Sealdah / Koley Market',
        distance: '2.9 km',
        rate: '₹22–₹95/kg',
        items: 'Chandramukhi Potatoes, Onions, Ginger & Chillies'
      }
    ]
  },
  kochi: {
    city: 'Kochi, KL',
    meat: [
      {
        name: 'Ernakulam Broadway Poultry & Meat Cuts',
        area: 'Broadway Market, Ernakulam',
        distance: '2.6 km',
        rate: '₹205–₹680/kg',
        items: 'Broiler Curry Cuts, Tender Goat, Beef Fry Cuts'
      },
      {
        name: 'Thoppumpady Harbour Fish & Seafood Co-op',
        area: 'Thoppumpady Fishing Harbour',
        distance: '5.3 km',
        rate: '₹290–₹840/kg',
        items: 'Karimeen, Seer Fish, Malabar Prawns, Squid'
      }
    ],
    groceries: [
      {
        name: 'Ernakulam Market Vegetable & Produce Hub',
        area: 'Market Road, Ernakulam',
        distance: '2.3 km',
        rate: '₹30–₹120/kg',
        items: 'Shallots, Curry Leaves, Ginger, Banana Leaves'
      },
      {
        name: 'Mattancherry Pepper, Spice & Coconut Oil Hub',
        area: 'Mattancherry Spice Street',
        distance: '4.8 km',
        rate: '₹195–₹680/kg or L',
        items: 'Tellicherry Black Pepper, Cold-Pressed Coconut Oil'
      }
    ]
  }
};

function readActiveCity() {
  try {
    const saved = localStorage.getItem('ecopulse_user_location');
    if (saved) {
      return JSON.parse(saved)?.city || 'Bengaluru, KA';
    }
  } catch {
    // Ignore storage errors
  }
  return 'Bengaluru, KA';
}

function getDashboardWholesaleSuppliers(cityName = 'Bengaluru, KA') {
  const lower = String(cityName || '').toLowerCase();
  const key = Object.keys(DASHBOARD_WHOLESALE_DIRECTORY).find((k) => lower.includes(k));
  return DASHBOARD_WHOLESALE_DIRECTORY[key || 'bengaluru'];
}

function isUserRestaurantEligible(businessType = '') {
  const val = String(businessType || '').trim();
  if (!val) return true;
  if (/supermarket|hypermarket|kirana|grocery|mart|retail/i.test(val)) return false;
  return /restaurant|kitchen|bistro|darshini|hotel|banquet|catering|cafe|cafeteria|dining/i.test(
    val
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('This Week');
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [showDesignProcess, setShowDesignProcess] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [propertyPhoto, setPropertyPhoto] = useState(() => getPropertyPhoto(user));

  useEffect(() => {
    setPropertyPhoto(getPropertyPhoto(user));
    const syncPhoto = () => setPropertyPhoto(getPropertyPhoto(user));
    window.addEventListener('ecopulse-property-photo-updated', syncPhoto);
    window.addEventListener('storage', syncPhoto);
    return () => {
      window.removeEventListener('ecopulse-property-photo-updated', syncPhoto);
      window.removeEventListener('storage', syncPhoto);
    };
  }, [user]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await dashboardAPI.getStats();
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load analytics dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm">Loading real-time sustainability telemetry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
        {error}
      </div>
    );
  }

  const summary = stats?.summary || {};
  const expiringSoon = stats?.expiringSoon || [];
  const weeklyTrend = stats?.weeklyTrend || [];
  const latestAI = stats?.latestAIInsight;

  const shortOrgName = (user?.name || 'Sustainability Hub').split(',')[0].trim();
  const latestDay = weeklyTrend.length > 0 ? weeklyTrend[weeklyTrend.length - 1] : null;
  const displayWasteKg =
    period === 'Today' && latestDay
      ? Number(latestDay.wasteKg || 0)
      : Number(summary.totalWasteKg || 0);

  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
    const el = document.getElementById('expiration-watchlist');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting & Notification Top Bar ("Header") */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-medium text-[#635C4E]">{getGreeting()}</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#12231B] tracking-tight">
            {shortOrgName}!
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDesignProcess((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all shadow-sm ${
              showDesignProcess
                ? 'bg-[#12231B] text-[#84CC16] border-[#12231B]'
                : 'bg-[#FFFDF9] text-[#3D4E45] border-[#DED8C8] hover:border-[#47777B]'
            }`}
            title="Toggle reference wireframe vs live UI split comparison"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showDesignProcess ? 'Hide Design Process' : 'Design Process View'}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={handleBellClick}
              className="relative w-10 h-10 rounded-full bg-[#FFFDF9] border border-[#DED8C8] hover:border-[#47777B] shadow-sm flex items-center justify-center text-[#12231B] transition-all"
              title="Expiring Stock Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {expiringSoon.length > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#19874B] ring-2 ring-[#FFFDF9]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#FFFDF9] border border-[#C7BFA9] shadow-xl p-3.5 z-40 space-y-2">
                <div className="flex items-center justify-between border-b border-[#ECE6D6] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#12231B]">
                    Stock Alerts ({expiringSoon.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-semibold text-[#47777B] hover:underline"
                  >
                    Close
                  </button>
                </div>
                {expiringSoon.length === 0 ? (
                  <p className="text-xs text-[#635C4E] py-2">
                    All batches are fresh with no urgent expiration alerts.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {expiringSoon.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#F5F1E8]"
                      >
                        <span className="font-semibold text-[#12231B] truncate max-w-[150px]">
                          {item.item_name}
                        </span>
                        <span className="text-[11px] font-semibold text-[#B93D1D]">
                          {item.daysDiff === 0 ? 'Today' : `${item.daysDiff}d left`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link to="/ai-advisor" className="eco-btn-primary">
            <Sparkles className="w-4 h-4" />
            <span>AI Forecast</span>
          </Link>
        </div>
      </div>

      {/* Optional Design Process Wireframe-to-Live Blueprint Comparison */}
      {showDesignProcess && (
        <div
          className="rounded-3xl bg-[#070B08] border border-[#1E3524] p-6 sm:p-7 text-white shadow-xl relative overflow-hidden"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(132,204,22,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(132,204,22,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none">
                  DESIGN
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#6CE656] leading-none">
                  PROCESS
                </div>
                <div className="w-10 h-1 bg-[#6CE656] rounded-full mt-2" />
              </div>

              <p className="text-xs text-[#A3B8AC] leading-relaxed max-w-sm">
                Structural blueprint mapping your organization header, crossed property photo placeholder, green hero savings curve, and action overview grid directly into the live EcoPulse dashboard.
              </p>

              <div className="space-y-2 text-xs font-mono text-[#A3E635]">
                <div className="flex items-center gap-2">
                  <span>Header</span>
                  <span>───▶</span>
                  <span className="text-white/80">Greeting + Bell + Hero Card + Property Frame</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Stats</span>
                  <span>───▶</span>
                  <span className="text-white/80">Overview Grid + Action Squircles</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Wireframe Phone/Panel Sketch */}
              <div className="rounded-2xl border border-[#2C3F31] bg-[#0B110D]/90 p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#84A98C] font-mono">
                  <span>≡ WIREFRAME</span>
                  <span>HEADER SHELL</span>
                </div>
                {/* Crossed Box Placeholder like Reference Image */}
                <div className="relative h-24 rounded-xl border border-[#445C4B] bg-[#0F1712] overflow-hidden">
                  <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="w-full h-full">
                    <line x1="0" y1="0" x2="200" y2="100" stroke="#445C4B" strokeWidth="1.2" />
                    <line x1="200" y1="0" x2="0" y2="100" stroke="#445C4B" strokeWidth="1.2" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-3/4 rounded-full bg-[#24362A]" />
                  <div className="h-2 w-1/2 rounded-full bg-[#1C2A21]" />
                </div>
                <div className="pt-2 border-t border-[#1D2D22]">
                  <div className="text-[11px] font-semibold text-white/75 mb-2">Overview</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-9 rounded-lg border border-[#314738] bg-[#121D16]" />
                    <div className="h-9 rounded-lg border border-[#314738] bg-[#121D16]" />
                    <div className="h-9 rounded-lg border border-[#314738] bg-[#121D16]" />
                  </div>
                </div>
              </div>

              {/* Wireframe Live Stats Curve Preview */}
              <div className="rounded-2xl border border-[#2C3F31] bg-[#0B110D]/90 p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#6CE656] font-mono">
                  <span>● LIVE RENDER</span>
                  <span>HERO + METRICS</span>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[#19874B] to-[#47777B] p-3.5 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-white/80">Total Value Preserved</div>
                      <div className="font-display text-lg font-bold">
                        ₹{Number(summary.costSavedAvoided || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white text-[#19874B] flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <svg viewBox="0 0 220 42" className="w-full h-9">
                    <path
                      d="M 4,34 C 36,38 56,34 80,22 C 104,10 130,18 156,22 C 180,26 196,8 214,10"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="214" cy="10" r="3.5" fill="#FFFFFF" />
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Net', 'Stock', 'Audit'].map((tag) => (
                    <div
                      key={tag}
                      className="rounded-lg bg-[#142219] border border-[#253B2C] p-2 text-center text-[10px] text-[#A3E635] font-mono"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Green / Verdigris Hero Card & Establishment Photo Showcase */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Hero Card */}
        <div className="xl:col-span-7 rounded-3xl bg-gradient-to-br from-[#19874B] via-[#237857] to-[#47777B] text-white p-6 sm:p-7 shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Subtle decorative radial highlight */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm font-medium text-white/85">Total Value Preserved</p>
              <div className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
                ₹
                {Number(summary.costSavedAvoided || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[11px] font-semibold text-white">
                  <Leaf className="w-3 h-3" />
                  Carbon Offset: {Number(summary.carbonSavedKg || 0).toFixed(1)} kg CO2e
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[11px] font-semibold text-white">
                  Active Stock: ₹{Number(summary.totalInventoryValue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white text-[#19874B] shadow-md flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Smooth White SVG Bezier Trend Curve */}
          <div className="relative mt-4 pt-2">
            <svg
              viewBox="0 0 400 95"
              preserveAspectRatio="none"
              className="w-full h-24 overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="heroCurveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 8,78 C 52,88 82,82 118,56 C 154,30 185,34 222,48 C 258,62 302,16 376,20 L 376,95 L 8,95 Z"
                fill="url(#heroCurveFill)"
              />
              <path
                d="M 8,78 C 52,88 82,82 118,56 C 154,30 185,34 222,48 C 258,62 302,16 376,20"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="376" cy="20" r="10" fill="#FFFFFF" fillOpacity="0.25" />
              <circle cx="376" cy="20" r="5.5" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        {/* Establishment & Property Photo Showcase Card */}
        <div className="xl:col-span-5 glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#47777B]/[0.12] text-[#355D61] border border-[#47777B]/30">
                Property Profile
              </span>
              <h3 className="font-display text-lg font-bold text-[#12231B] truncate">
                {user?.name || 'Commercial Kitchen'}
              </h3>
              <p className="text-xs text-[#635C4E] truncate">
                {user?.businessType || 'Commercial Food Operations'}
              </p>
            </div>
            <PropertyPhotoWidget user={user} variant="banner" />
          </div>

          {/* Wide Property Visual or Wireframe Box */}
          <div className="relative h-32 rounded-2xl overflow-hidden border border-[#DED8C8] bg-[#F5F1E8]">
            {propertyPhoto ? (
              <img
                src={propertyPhoto}
                alt={user?.name || 'Property visual'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative flex flex-col items-center justify-center text-center px-4">
                <svg
                  viewBox="0 0 320 120"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full opacity-45 pointer-events-none"
                >
                  <line x1="0" y1="0" x2="320" y2="120" stroke="#C7BFA9" strokeWidth="1" />
                  <line x1="320" y1="0" x2="0" y2="120" stroke="#C7BFA9" strokeWidth="1" />
                </svg>
                <span className="relative text-xs font-semibold text-[#3D4E45] bg-[#FFFDF9]/90 px-3 py-1 rounded-full border border-[#DED8C8]">
                  Click “Add Photo” above to display your kitchen or storefront
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link to="/inventory" className="eco-btn-secondary flex-1 text-xs py-2">
              <Plus className="w-3.5 h-3.5 text-[#47777B]" />
              <span>Add Stock</span>
            </Link>
            <Link to="/waste-log" className="eco-btn-secondary flex-1 text-xs py-2">
              <Trash2 className="w-3.5 h-3.5 text-[#D9532F]" />
              <span>Log Waste</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Reference "Overview" Header with "This Week v" Selector + Soft-Green Squircle Action Tiles */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-xl font-bold text-[#12231B]">Overview</h3>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#DED8C8] hover:border-[#47777B] text-xs font-semibold text-[#3D4E45] shadow-sm transition-all"
            >
              <span>{period}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#635C4E] transition-transform ${
                  periodMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {periodMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-[#FFFDF9] border border-[#C7BFA9] shadow-lg p-1 z-30">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setPeriod(opt);
                      setPeriodMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      period === opt
                        ? 'bg-[#E8F6EE] text-[#19874B] font-semibold'
                        : 'text-[#3D4E45] hover:bg-[#ECE6D6]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Net Savings',
              value: `₹${Number(summary.costSavedAvoided || 0).toLocaleString('en-IN')}`,
              action: 'AI Forecast',
              to: '/ai-advisor',
              icon: TrendingUp
            },
            {
              title: 'Stock Intake',
              value: `₹${Number(summary.totalInventoryValue || 0).toLocaleString('en-IN')}`,
              action: 'Add Stock',
              to: '/inventory',
              icon: Download
            },
            {
              title: 'Waste Audit',
              value: `${displayWasteKg.toFixed(1)} kg`,
              action: 'Log Waste',
              to: '/waste-log',
              icon: Wallet
            },
            {
              title: 'Surplus Match',
              value: `${summary.expiringCount || 0} batches`,
              action: 'Route Surplus',
              to: '/surplus-network',
              icon: HandHeart
            }
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.title}
                to={tile.to}
                className="group bg-[#FFFDF9] border border-[#DED8C8] hover:border-[#19874B]/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-xl bg-[#E8F6EE] text-[#19874B] flex items-center justify-center group-hover:bg-[#19874B] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#827A69] group-hover:text-[#19874B] group-hover:translate-x-0.5 transition-all" />
                </div>

                <div>
                  <p className="text-xs font-medium text-[#635C4E]">{tile.title}</p>
                  <p className="font-display text-lg sm:text-xl font-bold text-[#12231B] mt-0.5">
                    {tile.value}
                  </p>
                  <p className="text-[11px] font-semibold text-[#47777B] mt-1">{tile.action}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Detailed KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Financial Value Preserved"
          value={`₹${Number(summary.costSavedAvoided || 0).toLocaleString('en-IN')}`}
          subtitle={`Waste loss logged: ₹${Number(summary.totalFinancialLoss || 0).toLocaleString('en-IN')}`}
          badge="ROI Active"
          icon={DollarSign}
          color="emerald"
        />

        <MetricCard
          title="CO2e Emissions Saved"
          value={Number(summary.carbonSavedKg || 0).toFixed(1)}
          unit="kg CO2e"
          subtitle="Offset via surplus redistribution"
          badge="Net Impact"
          icon={Leaf}
          color="sky"
        />

        <MetricCard
          title="Total Organic Waste"
          value={Number(summary.totalWasteKg || 0).toFixed(1)}
          unit="kg"
          subtitle={`Carbon impact: ${Number(summary.totalCarbonImpact || 0).toFixed(1)} kg CO2e`}
          badge="7-Day Audit"
          icon={CloudOff}
          color="amber"
        />

        <MetricCard
          title="Expiring Stock Alerts"
          value={summary.expiringCount || 0}
          unit="batches"
          subtitle={`Total stock value: ₹${Number(summary.totalInventoryValue || 0).toLocaleString('en-IN')}`}
          badge={summary.expiringCount > 0 ? 'Action Needed' : 'All Fresh'}
          icon={AlertTriangle}
          color={summary.expiringCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Recharts Visualizations */}
      <WasteChart
        weeklyTrend={weeklyTrend}
        wasteByCategory={stats?.wasteByCategory || []}
        wasteByReason={stats?.wasteByReason || []}
      />

      {/* Expiring Inventory & Latest AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Expiring Items */}
        <div
          id="expiration-watchlist"
          className="glass-card rounded-2xl p-5 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  Priority Expiration Watchlist (≤ 3 Days)
                </h3>
              </div>
              <Link
                to="/inventory"
                className="text-xs font-medium text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {expiringSoon.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No inventory items expiring within the next 3 days.
              </div>
            ) : (
              <div className="space-y-2.5">
                {expiringSoon.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-100">{item.item_name}</div>
                      <div className="text-xs text-slate-400">
                        {item.quantity} {item.unit} • {item.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.daysDiff === 0
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.daysDiff === 0 ? 'Expires Today' : `${item.daysDiff}d left`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
            <Link
              to="/surplus-network"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
            >
              Route Expiring Batches to Food Banks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Latest AI Sustainability Advisory */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  Latest EcoPulse AI Advisory
                </h3>
              </div>
              <Link
                to="/ai-advisor"
                className="text-xs font-medium text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                Open Advisor <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {latestAI ? (
              <div className="space-y-3">
                {latestAI.weatherContext && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#47777B]/[0.12] border border-[#47777B]/30 text-[11px] font-semibold text-[#355D61]">
                    <span>
                      {latestAI.weatherContext.city} • {latestAI.weatherContext.condition} ({latestAI.weatherContext.temperatureC} °C / {latestAI.weatherContext.humidityPercent}% RH)
                    </span>
                  </div>
                )}

                <p className="text-sm text-slate-300 leading-relaxed">
                  {latestAI.assistantAnswer || latestAI.summary}
                </p>

                {(latestAI.longShelfLifeItems?.length > 0 ||
                  latestAI.recommendedBuyMoreProducts?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {latestAI.longShelfLifeItems?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#EEF5F1] border border-[#AFCFBD] space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E5E42]">
                          Keep Long-Term
                        </div>
                        {latestAI.longShelfLifeItems.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-xs text-[#12231B] font-medium truncate">
                            • {item.item}{' '}
                            <span className="text-[11px] text-[#19874B]">({item.safeStorageDuration})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {latestAI.recommendedBuyMoreProducts?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#47777B]/[0.10] border border-[#47777B]/30 space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#355D61]">
                          Buy More For Weather
                        </div>
                        {latestAI.recommendedBuyMoreProducts.slice(0, 2).map((prod, idx) => (
                          <div key={idx} className="text-xs text-[#12231B] font-medium truncate">
                            • {prod.product}{' '}
                            <span className="text-[11px] font-bold text-[#47777B]">
                              ({prod.suggestedOrderQty})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {latestAI.predictedDemandWarnings?.[0] && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1">
                    <div className="text-xs font-semibold text-amber-400">
                      Top Alert: {latestAI.predictedDemandWarnings[0].item}
                    </div>
                    <div className="text-xs text-slate-300">
                      {latestAI.predictedDemandWarnings[0].recommendedAction}
                    </div>
                  </div>
                )}
                {latestAI.carbonReductionTip && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    {latestAI.carbonReductionTip}
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <Link
                    to="/ai-advisor"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#47777B] hover:bg-[#355D61] text-[#FFFDF9] text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Weather AI Assistant</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-slate-400">
                  Run your first Gemini Weather AI forecast to see which items keep long-term and which products to buy more of.
                </p>
                <Link to="/ai-advisor" className="eco-btn-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>Ask Weather AI Assistant</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant-Owner Exclusive Nearby Meat & Grocery Wholesale Sellers (Hidden for Supermarket Owners) */}
      {isUserRestaurantEligible(user?.businessType) && (() => {
        const activeCity = readActiveCity();
        const citySuppliers = getDashboardWholesaleSuppliers(activeCity);
        const aiMeat =
          latestAI?.nearbyWholesaleSuppliers?.eligible &&
          latestAI?.nearbyWholesaleSuppliers?.meatWholesalers?.length > 0
            ? latestAI.nearbyWholesaleSuppliers.meatWholesalers
            : null;
        const aiGrocery =
          latestAI?.nearbyWholesaleSuppliers?.eligible &&
          latestAI?.nearbyWholesaleSuppliers?.groceryWholesalers?.length > 0
            ? latestAI.nearbyWholesaleSuppliers.groceryWholesalers
            : null;

        return (
          <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#47777B] text-[#FFFDF9]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#12231B]">
                    Nearby Meat & Grocery Wholesale Sellers
                  </h3>
                  <p className="text-xs text-[#635C4E]">
                    B2B APMC & cold-chain suppliers near {citySuppliers.city} • Exclusive for Restaurant Owners
                  </p>
                </div>
              </div>

              <Link
                to="/ai-advisor"
                className="text-xs font-semibold text-[#47777B] hover:text-[#355D61] inline-flex items-center gap-1"
              >
                <span>Open Full AI Procurement View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Meat Wholesale Sellers */}
              <div className="rounded-2xl bg-[#F5F1E8]/80 border border-[#DED8C8] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B93D1D]">
                  <Utensils className="w-4 h-4" />
                  <span>Nearby Meat & Poultry Wholesale Sellers</span>
                </div>

                <div className="space-y-2.5">
                  {(aiMeat
                    ? aiMeat.slice(0, 2).map((s) => ({
                        name: s.name,
                        area: s.marketArea,
                        distance: s.distanceKm,
                        rate: s.wholesaleRate,
                        items: s.specialties
                      }))
                    : citySuppliers.meat
                  ).map((seller, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#DED8C8] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#12231B] truncate">
                          {seller.name}
                        </span>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FDF4F1] text-[#B93D1D] border border-[#F2CFC4] flex-shrink-0">
                          {seller.distance}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#635C4E] flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#D9532F]" />
                          {seller.area}
                        </span>
                        <span className="font-bold text-[#B93D1D] flex-shrink-0">{seller.rate}</span>
                      </div>
                      <p className="text-xs text-[#3D4E45]">{seller.items}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Groceries Wholesale Sellers */}
              <div className="rounded-2xl bg-[#F5F1E8]/80 border border-[#DED8C8] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#355D61]">
                  <ShoppingBag className="w-4 h-4 text-[#47777B]" />
                  <span>Nearby Groceries & APMC Wholesale Sellers</span>
                </div>

                <div className="space-y-2.5">
                  {(aiGrocery
                    ? aiGrocery.slice(0, 2).map((s) => ({
                        name: s.name,
                        area: s.marketArea,
                        distance: s.distanceKm,
                        rate: s.wholesaleRate,
                        items: s.specialties
                      }))
                    : citySuppliers.groceries
                  ).map((seller, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#DED8C8] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#12231B] truncate">
                          {seller.name}
                        </span>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#47777B]/[0.12] text-[#355D61] border border-[#47777B]/30 flex-shrink-0">
                          {seller.distance}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#635C4E] flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#47777B]" />
                          {seller.area}
                        </span>
                        <span className="font-bold text-[#355D61] flex-shrink-0">{seller.rate}</span>
                      </div>
                      <p className="text-xs text-[#3D4E45]">{seller.items}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
