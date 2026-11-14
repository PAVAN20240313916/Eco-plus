import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, DollarSign, CloudOff, Scale, Loader2, CheckCircle2 } from 'lucide-react';
import { wasteAPI } from '../services/api';
import MetricCard from '../components/MetricCard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const WASTE_REASONS = [
  'Spoilage/Expiration',
  'Over-preparation',
  'Trimmings/Prep Waste',
  'Customer Leftovers',
  'Quality Failure'
];

const CATEGORY_FACTORS = {
  'Meat & Poultry': 12.5,
  'Dairy': 5.8,
  'Prepared Foods': 3.5,
  'Bakery': 1.8,
  'Produce': 1.2,
  'Dry Goods': 1.5
};

export default function WasteLogPage() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ totalWeightKg: 0, totalFinancialLoss: 0, totalCarbonImpact: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [categoryHint, setCategoryHint] = useState('Produce');
  const [form, setForm] = useState({
    itemName: '',
    quantityWasted: '',
    unit: 'kg',
    reason: WASTE_REASONS[0],
    financialLoss: '',
    carbonImpact: '',
    logDate: new Date().toISOString().split('T')[0]
  });

  const fetchWasteLogs = async () => {
    try {
      const res = await wasteAPI.getAll();
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setMetrics(res.data.metrics || { totalWeightKg: 0, totalFinancialLoss: 0, totalCarbonImpact: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load waste logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWasteLogs();
  }, []);

  // Auto-calculate estimated financial loss and CO2e impact when quantity or category changes
  const handleQuantityOrCategoryChange = (newQty, newCat) => {
    const qty = Number(newQty) || 0;
    const factor = CATEGORY_FACTORS[newCat] || 2.0;
    const estCarbon = (qty * factor).toFixed(2);
    const estLoss = (qty * 165).toFixed(2);
    setForm((prev) => ({
      ...prev,
      quantityWasted: newQty,
      carbonImpact: qty > 0 ? estCarbon : '',
      financialLoss: prev.financialLoss === '' || prev.autoLoss ? estLoss : prev.financialLoss
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        itemName: form.itemName,
        quantityWasted: Number(form.quantityWasted),
        unit: form.unit,
        reason: form.reason,
        financialLoss: Number(form.financialLoss || 0),
        carbonImpact: Number(form.carbonImpact || 0),
        logDate: form.logDate
      };
      const res = await wasteAPI.create(payload);
      if (res.data?.success) {
        setSuccessMsg(`Logged waste audit for "${payload.itemName}" (${payload.carbonImpact} kg CO2e).`);
        setForm({
          itemName: '',
          quantityWasted: '',
          unit: 'kg',
          reason: WASTE_REASONS[0],
          financialLoss: '',
          carbonImpact: '',
          logDate: new Date().toISOString().split('T')[0]
        });
        await fetchWasteLogs();
      }
    } catch (err) {
      const details = err.response?.data?.details;
      setError(details ? details.map((d) => d.message).join(' • ') : err.response?.data?.error || 'Failed to log waste.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await wasteAPI.remove(id);
      await fetchWasteLogs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete log.');
    }
  };

  const reasonChartData = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      map[l.reason] = (map[l.reason] || 0) + Number(l.quantity_wasted || 0);
    });
    return Object.entries(map).map(([reason, kg]) => ({
      reason: reason.split('/')[0],
      kg: Number(kg.toFixed(1))
    }));
  }, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Trash2 className="w-6 h-6 text-amber-400" />
          <span>Daily Waste Audit Tracker</span>
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Log discarded organic stock by weight and disposal reason to quantify financial and carbon footprint losses
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Logged Waste"
          value={metrics.totalWeightKg}
          unit="kg"
          subtitle={`${logs.length} audit events recorded`}
          icon={Scale}
          color="amber"
        />
        <MetricCard
          title="Total Financial Loss"
          value={`₹${Number(metrics.totalFinancialLoss).toLocaleString('en-IN')}`}
          subtitle="Direct ingredient cost disposal"
          icon={DollarSign}
          color="rose"
        />
        <MetricCard
          title="Carbon Footprint Impact"
          value={metrics.totalCarbonImpact}
          unit="kg CO2e"
          subtitle="Lifecycle greenhouse emissions"
          icon={CloudOff}
          color="sky"
        />
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Form + Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-3 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">Record New Waste Event</h3>
            <span className="text-[11px] text-emerald-400 font-medium">Auto CO2e Calculator Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Ingredient / Dish Name</label>
              <input
                type="text"
                required
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                placeholder="e.g., Steamed Basmati Rice / Palak Greens"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Food Category (for CO2e factor)</label>
              <select
                value={categoryHint}
                onChange={(e) => {
                  setCategoryHint(e.target.value);
                  handleQuantityOrCategoryChange(form.quantityWasted, e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {Object.keys(CATEGORY_FACTORS).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CATEGORY_FACTORS[c]} kg CO2e/kg)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Quantity Wasted</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={form.quantityWasted}
                onChange={(e) => handleQuantityOrCategoryChange(e.target.value, categoryHint)}
                placeholder="2.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Disposal Reason</label>
              <select
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {WASTE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Audit Date</label>
              <input
                type="date"
                required
                value={form.logDate}
                onChange={(e) => setForm({ ...form, logDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Financial Loss (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.financialLoss}
                onChange={(e) => setForm({ ...form, financialLoss: e.target.value })}
                placeholder="450.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Carbon Impact (kg CO2e)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.carbonImpact}
                onChange={(e) => setForm({ ...form, carbonImpact: e.target.value })}
                placeholder="8.75"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={submitting} className="eco-btn-primary">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Record Waste Audit</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Reason Breakdown Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-100">Waste Weight by Cause</h3>
            <p className="text-xs text-slate-400">Identifies operational root causes (kg)</p>
          </div>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis type="category" dataKey="reason" stroke="#94a3b8" fontSize={11} width={105} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="kg" name="Waste (kg)" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Logs Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Historical Waste Audit Logs</h3>
          <span className="text-xs text-slate-400">{logs.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold">Item</th>
                <th className="py-3.5 px-4 font-semibold">Quantity</th>
                <th className="py-3.5 px-4 font-semibold">Reason</th>
                <th className="py-3.5 px-4 font-semibold">Financial Loss</th>
                <th className="py-3.5 px-4 font-semibold">Carbon Impact</th>
                <th className="py-3.5 px-5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No waste logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                      {String(log.log_date || log.created_at).split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-100">{log.item_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {Number(log.quantity_wasted).toFixed(1)} <span className="text-xs text-slate-400">{log.unit}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {log.reason}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-400">
                      -₹{Number(log.financial_loss).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sky-400">
                      {Number(log.carbon_impact).toFixed(1)} kg CO2e
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete waste entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
