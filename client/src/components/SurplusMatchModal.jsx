import React, { useState, useEffect } from 'react';
import { X, HandHeart, Sparkles, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { aiAPI, surplusAPI } from '../services/api';

const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Poultry',
  'Bakery',
  'Prepared Foods',
  'Dry Goods'
];

const LOCAL_PARTNERS = [
  { name: 'Robin Hood Army - Local City Chapter', type: 'Food Bank' },
  { name: 'Akshaya Patra Community Kitchen', type: 'Soup Kitchen' },
  { name: 'Feeding India Shelter Pantry', type: 'Shelter Pantry' },
  { name: 'Hasiru Dala Bio-Compost & Biogas Hub', type: 'Composting Partner' }
];

export default function SurplusMatchModal({ isOpen, onClose, initialItem = null, onSuccess }) {
  const [form, setForm] = useState({
    itemName: '',
    category: 'Produce',
    quantity: '',
    unit: 'kg',
    expirationDate: new Date().toISOString().split('T')[0],
    matchedPartner: LOCAL_PARTNERS[0].name,
    partnerType: LOCAL_PARTNERS[0].type,
    pickupWindow: 'Today 17:00 - 20:00 IST'
  });

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [matchingAI, setMatchingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialItem) {
      setForm({
        itemName: initialItem.item_name || '',
        category: initialItem.category || 'Produce',
        quantity: initialItem.quantity || '',
        unit: initialItem.unit || 'kg',
        expirationDate: initialItem.expiration_date
          ? String(initialItem.expiration_date).split('T')[0]
          : new Date().toISOString().split('T')[0],
        matchedPartner: LOCAL_PARTNERS[0].name,
        partnerType: LOCAL_PARTNERS[0].type,
        pickupWindow: 'Today 17:00 - 20:00 IST'
      });
    } else {
      setForm({
        itemName: '',
        category: 'Produce',
        quantity: '',
        unit: 'kg',
        expirationDate: new Date().toISOString().split('T')[0],
        matchedPartner: LOCAL_PARTNERS[0].name,
        partnerType: LOCAL_PARTNERS[0].type,
        pickupWindow: 'Today 17:00 - 20:00 IST'
      });
    }
    setAiSuggestion(null);
    setError('');
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleRunAIMatch = async () => {
    if (!form.itemName) {
      setError('Enter an item name first to get AI partner matching.');
      return;
    }
    setMatchingAI(true);
    setError('');
    try {
      const res = await aiAPI.matchSurplus([
        {
          item_name: form.itemName,
          category: form.category,
          quantity: Number(form.quantity || 5),
          unit: form.unit,
          expiration_date: form.expirationDate
        }
      ]);
      if (res.data?.success && res.data.data?.matches?.length > 0) {
        const bestMatch = res.data.data.matches[0];
        setAiSuggestion({
          match: bestMatch,
          refrigerationGuidance: res.data.data.refrigerationGuidance,
          taxDeductionEstimate: res.data.data.taxDeductionEstimate
        });
        setForm((prev) => ({
          ...prev,
          matchedPartner: bestMatch.partnerName,
          partnerType: bestMatch.partnerType
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not retrieve AI surplus match.');
    } finally {
      setMatchingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        status: form.matchedPartner ? 'MATCHED' : 'AVAILABLE'
      };
      const res = await surplusAPI.create(payload);
      if (res.data?.success) {
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish surplus listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <HandHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Surplus Food Matchmaker</h2>
              <p className="text-xs text-slate-400">Connect surplus batches to verified urban partners</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Surplus Item Name
              </label>
              <input
                type="text"
                required
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                placeholder="e.g., Fresh Malai Paneer / Tandoori Roti Batch"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Best-Before / Expiration Date
              </label>
              <input
                type="date"
                required
                value={form.expirationDate}
                onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Quantity</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Unit (SI)</label>
              <input
                type="text"
                required
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="kg / g / L / mL / units"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* AI Match Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleRunAIMatch}
              disabled={matchingAI}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
            >
              {matchingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Finding Optimal Local Partner via Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Match Optimal Partner with EcoPulse AI</span>
                </>
              )}
            </button>
          </div>

          {/* AI Match Result Preview */}
          {aiSuggestion && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  AI Recommended: {aiSuggestion.match.partnerName}
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5" />
                  {aiSuggestion.match.distance}
                </span>
              </div>
              <p className="text-slate-300">{aiSuggestion.match.logisticsNote}</p>
              <div className="text-emerald-400 font-medium">
                Offset: {aiSuggestion.match.estimatedCarbonOffset} • {aiSuggestion.taxDeductionEstimate}
              </div>
            </div>
          )}

          {/* Partner Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Receiving Partner
              </label>
              <select
                value={form.matchedPartner}
                onChange={(e) => {
                  const p = LOCAL_PARTNERS.find((lp) => lp.name === e.target.value);
                  setForm({
                    ...form,
                    matchedPartner: e.target.value,
                    partnerType: p ? p.type : 'Food Bank'
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {LOCAL_PARTNERS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Pickup Window
              </label>
              <input
                type="text"
                value={form.pickupWindow}
                onChange={(e) => setForm({ ...form, pickupWindow: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="eco-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="eco-btn-primary">
              {submitting ? 'Publishing...' : 'Publish & Dispatch Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
