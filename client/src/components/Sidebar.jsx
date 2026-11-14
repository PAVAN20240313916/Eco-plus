import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Trash2,
  Sparkles,
  HandHeart,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Globe,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Waste Audit Log', path: '/waste-log', icon: Trash2 },
  { label: 'AI Advisor', path: '/ai-advisor', icon: Sparkles },
  { label: 'Surplus Network', path: '/surplus-network', icon: HandHeart }
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#12231B]/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#12231B] text-[#F5F1E8] border-r border-[#1E352B] shadow-xl transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1E352B]">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-[#47777B] to-[#355D61] shadow-md shadow-[#47777B]/30">
              <Leaf className="w-5 h-5 text-[#FFFDF9]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-display font-bold text-base text-[#F5F1E8] tracking-tight leading-none">
                  EcoPulse AI
                </span>
                <span className="text-[10px] font-semibold text-[#8FB5B8] mt-1 uppercase tracking-[0.12em]">
                  Sustainability Ops
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#A3B8AC] hover:text-[#FFFDF9] hover:bg-[#1B3327] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#A3B8AC] hover:text-[#FFFDF9] hover:bg-[#1B3327] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#47777B] text-[#FFFDF9] border border-[#689A9E]/45 shadow-md shadow-[#47777B]/25'
                    : 'text-[#C5D5CC] hover:text-[#FFFDF9] hover:bg-[#1B3327] border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#FFFDF9]' : 'text-[#8FA89B]'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Mission Card */}
        <div className="p-3 border-t border-[#1E352B] space-y-2">
          {!collapsed && (
            <div className="p-3.5 rounded-xl bg-[#182E23] border border-[#47777B]/35">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F1E8]">
                  <Sparkles className="w-3.5 h-3.5 text-[#8FB5B8]" />
                  <span>Gemini 2.5 Flash</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#47777B]" />
              </div>
              <p className="text-[11px] text-[#A3B8AC] leading-relaxed">
                Real-time demand forecasting & zero-waste surplus routing enabled.
              </p>
              <div className="mt-2 pt-2 border-t border-[#244234] text-[10px] font-mono text-[#7FA692]">
                Supabase Cloud • SI / INR
              </div>
            </div>
          )}

          <Link
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#A3B8AC] hover:text-[#FFFDF9] hover:bg-[#1B3327] transition-colors"
            title="Public Overview"
          >
            <Globe className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Platform Overview</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
