import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Sparkles, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LocationBadge from './LocationBadge';
import PropertyPhotoWidget from './PropertyPhotoWidget';

const ROUTE_TITLES = {
  '/dashboard': 'Sustainability Analytics Dashboard',
  '/inventory': 'Inventory & Expiration Tracking',
  '/waste-log': 'Daily Waste Audit Tracker',
  '/ai-advisor': 'EcoPulse AI Demand & Waste Advisor',
  '/surplus-network': 'Surplus Food Redistribution Network'
};

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = ROUTE_TITLES[location.pathname] || 'EcoPulse AI Platform';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-[#F5F1E8]/90 backdrop-blur-md border-b border-[#DED8C8]">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#3D4E45] hover:text-[#12231B] hover:bg-[#ECE6D6] transition-colors lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <div className="p-1.5 rounded-lg bg-[#47777B] text-[#FFFDF9] border border-[#355D61]">
            <Leaf className="w-4 h-4 text-[#FFFDF9]" />
          </div>
          <span className="font-display font-bold text-[#12231B]">EcoPulse AI</span>
        </Link>

        <div className="hidden lg:flex items-center gap-3">
          <h1 className="font-display text-lg font-semibold text-[#12231B] tracking-tight">
            {currentTitle}
          </h1>
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#47777B]/[0.12] border border-[#47777B]/35 text-[11px] font-semibold text-[#355D61]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#47777B] animate-pulse" />
            Supabase Cloud
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <LocationBadge user={user} />

        <Link
          to="/ai-advisor"
          className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
            location.pathname === '/ai-advisor'
              ? 'bg-[#D9532F] text-[#FFFDF9] shadow-[#D9532F]/25'
              : 'bg-[#47777B] text-[#FFFDF9] hover:bg-[#355D61]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Run AI Audit</span>
        </Link>

        {user && <PropertyPhotoWidget user={user} variant="navbar" />}

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#3D4E45] bg-[#FFFDF9] border border-[#DED8C8] hover:bg-[#FDF4F1] hover:text-[#B93D1D] hover:border-[#F2CFC4] transition-all shadow-sm"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
