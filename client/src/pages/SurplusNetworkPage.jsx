import React, { useState, useEffect } from 'react';
import {
  HandHeart,
  Plus,
  Sparkles,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  Leaf,
  Loader2,
  Building
} from 'lucide-react';
import { surplusAPI, aiAPI } from '../services/api';
import SurplusMatchModal from '../components/SurplusMatchModal';

const STATUS_BADGES = {
  AVAILABLE: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  MATCHED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DISPATCHED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
};

const PARTNER_DIRECTORY = [
  {
    name: 'Robin Hood Army - Local City Chapter',
    type: 'Food Bank',
    distance: '2.4 km',
    accepts: 'Produce, Bakery, Dry Goods, Prepared Foods'
  },
  {
    name: 'Feeding India (Zomato NGO Partner)',
    type: 'Shelter Pantry',
    distance: '3.1 km',
    accepts: 'Prepared Foods, Dairy, Bakery'
  },
  {
    name: 'Hasiru Dala Bio-Compost & Biogas Hub',
    type: 'Composting Partner',
    distance: '4.5 km',
    accepts: 'Organic Trimmings, Coffee Grounds, Produce'
  },
  {
    name: 'Akshaya Patra Community Meals Kitchen',
    type: 'Soup Kitchen',
    distance: '5.2 km',
    accepts: 'Meat & Poultry, Dairy, Produce'
  }
];

export default function SurplusNetworkPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [aiMatches, setAiMatches] = useState(null);
  const [runningAI, setRunningAI] = useState(false);
  const [error, setError] = useState('');

  const fetchListings = async () => {
    try {
      const res = await surplusAPI.getAll();
      if (res.data?.success) {
        setListings(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load surplus listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleStatusUpdate = async (id, nextStatus) => {
    try {
      const res = await surplusAPI.updateStatus(id, nextStatus);
      if (res.data?.success) {
        setListings((prev) => prev.map((l) => (l.id === id ? res.data.data : l)));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleAutoMatchInventory = async () => {
    setRunningAI(true);
    setError('');
    try {
      const res = await aiAPI.matchSurplus([]);
      if (res.data?.success) {
        setAiMatches(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run AI surplus matchmaker.');
    } finally {
      setRunningAI(false);
    }
  };

  const totalCarbonSaved = listings.reduce((sum, l) => sum + Number(l.carbon_saved || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <HandHeart className="w-6 h-6 text-emerald-400" />
            <span>Surplus Food Redistribution Network</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Connect commercial surplus directly to local food banks & composters • Diverted impact:{' '}
            <span className="text-emerald-400 font-semibold">{totalCarbonSaved.toFixed(1)} kg CO2e</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAutoMatchInventory}
            disabled={runningAI}
            className="eco-btn-secondary"
          >
            {runningAI ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-400" />
            )}
            <span>AI Match Expiring Stock</span>
          </button>

          <button onClick={() => setModalOpen(true)} className="eco-btn-primary">
            <Plus className="w-4 h-4" />
            <span>List Surplus Batch</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* AI Matchmaking Preview Panel */}
      {aiMatches && (
        <div className="glass-card rounded-2xl p-6 border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI-Generated Redistribution Plan (Expiring Inventory)</span>
            </div>
            <button
              onClick={() => setAiMatches(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(aiMatches.matches || []).map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">{m.item}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                    {m.urgency} Urgency
                  </span>
                </div>
                <div className="text-xs text-emerald-400 font-medium">
                  → {m.partnerName} ({m.distance})
                </div>
                <p className="text-xs text-slate-400">{m.logisticsNote}</p>
                <div className="text-[11px] font-mono text-sky-400 pt-1">
                  Offset: {m.estimatedCarbonOffset}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>{aiMatches.refrigerationGuidance}</span>
            <span className="text-emerald-400 font-semibold whitespace-nowrap">
              {aiMatches.taxDeductionEstimate}
            </span>
          </div>
        </div>
      )}

      {/* Active Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-semibold text-slate-100">Active Surplus Listings & Dispatches</h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : listings.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center text-slate-400 text-sm">
              No surplus food batches listed yet. Click "List Surplus Batch" to donate expiring stock.
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((item) => (
                <div key={item.id} className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base font-semibold text-slate-100">{item.item_name}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            STATUS_BADGES[item.status] || STATUS_BADGES.AVAILABLE
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {Number(item.quantity).toFixed(1)} {item.unit} • {item.category} • Expires{' '}
                        {String(item.expiration_date).split('T')[0]}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start">
                      <Leaf className="w-3.5 h-3.5" />
                      <span>{Number(item.carbon_saved || 0).toFixed(1)} kg CO2e saved</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Partner: <strong className="text-slate-100">{item.matched_partner || 'Pending Assignment'}</strong>
                          {item.partner_type ? ` (${item.partner_type})` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Window: {item.pickup_window}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'AVAILABLE' && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'MATCHED')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium hover:bg-amber-500/25"
                        >
                          Confirm Match
                        </button>
                      )}
                      {item.status === 'MATCHED' && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'DISPATCHED')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium hover:bg-purple-500/25"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Mark Dispatched
                        </button>
                      )}
                      {item.status === 'DISPATCHED' && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'COMPLETED')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium hover:bg-emerald-500/25"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete Handover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Partner Directory Sidebar */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-100">Verified Local Partners</h3>
          <div className="space-y-3">
            {PARTNER_DIRECTORY.map((p, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{p.name}</div>
                    <span className="text-[11px] font-medium text-emerald-400">{p.type}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
                    <MapPin className="w-3 h-3" />
                    {p.distance}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Accepts: {p.accepts}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Surplus Modal */}
      <SurplusMatchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchListings()}
      />
    </div>
  );
}
