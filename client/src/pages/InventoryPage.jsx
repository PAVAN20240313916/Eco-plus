import React, { useState, useEffect } from 'react';
import { Package, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { inventoryAPI } from '../services/api';
import InventoryTable from '../components/InventoryTable';
import SurplusMatchModal from '../components/SurplusMatchModal';

const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Poultry',
  'Bakery',
  'Prepared Foods',
  'Dry Goods'
];

const UNITS = ['kg', 'g', 'L', 'mL', 'units', 'portions'];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [surplusItem, setSurplusItem] = useState(null);

  const [form, setForm] = useState({
    itemName: '',
    category: 'Produce',
    quantity: '',
    unit: 'kg',
    costPerUnit: '',
    expirationDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  });

  const fetchInventory = async () => {
    try {
      const res = await inventoryAPI.getAll();
      if (res.data?.success) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        costPerUnit: Number(form.costPerUnit)
      };
      const res = await inventoryAPI.create(payload);
      if (res.data?.success) {
        setItems((prev) => [res.data.data, ...prev]);
        setSuccessMsg(`Added "${res.data.data.item_name}" to active stock.`);
        setForm({
          itemName: '',
          category: 'Produce',
          quantity: '',
          unit: 'kg',
          costPerUnit: '',
          expirationDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
        });
        setShowForm(false);
      }
    } catch (err) {
      const details = err.response?.data?.details;
      setError(details ? details.map((d) => d.message).join(' • ') : err.response?.data?.error || 'Failed to add item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await inventoryAPI.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete inventory item.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalValuation = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.cost_per_unit),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>Inventory & Expiration Tracking</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Active batches: <span className="text-slate-200 font-medium">{items.length}</span> • Total valuation:{' '}
            <span className="text-emerald-400 font-semibold">
              ₹{totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="eco-btn-primary">
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Add New Stock Batch'}</span>
        </button>
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

      {/* Add Inventory Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4 border-emerald-500/30">
          <h3 className="text-base font-semibold text-slate-100">Add Commercial Stock Batch</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Item Name</label>
              <input
                type="text"
                required
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                placeholder="e.g., Fresh Malai Paneer / Basmati Rice"
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Quantity</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="15"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Unit (SI)</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Cost per Unit (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.costPerUnit}
                onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })}
                placeholder="180.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Expiration Date</label>
              <input
                type="date"
                required
                value={form.expirationDate}
                onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="eco-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="eco-btn-primary">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Stock Batch</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Inventory Data Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      ) : (
        <InventoryTable
          items={items}
          onDelete={handleDelete}
          deletingId={deletingId}
          onSendToSurplus={(item) => setSurplusItem(item)}
        />
      )}

      {/* Surplus Donation Modal shortcut */}
      <SurplusMatchModal
        isOpen={Boolean(surplusItem)}
        initialItem={surplusItem}
        onClose={() => setSurplusItem(null)}
        onSuccess={() => setSuccessMsg('Surplus item successfully matched and queued for donation!')}
      />
    </div>
  );
}
