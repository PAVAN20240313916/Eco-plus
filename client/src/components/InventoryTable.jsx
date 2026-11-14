import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  HandHeart
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Produce',
  'Dairy',
  'Meat & Poultry',
  'Bakery',
  'Prepared Foods',
  'Dry Goods'
];

function getDaysUntilExpiration(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
}

export default function InventoryTable({ items = [], onDelete, onSendToSurplus, deletingId }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState('expiration_date');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = item.item_name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'expiration_date') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else if (sortField === 'quantity' || sortField === 'cost_per_unit') {
          valA = Number(valA);
          valB = Number(valB);
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [items, search, selectedCategory, sortField, sortAsc]);

  const renderStatusBadge = (expirationDate) => {
    const days = getDaysUntilExpiration(expirationDate);
    if (days < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Expired ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (days === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/40 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          Expires Today
        </span>
      );
    }
    if (days <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" />
          {days}d left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Fresh ({days}d)
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredients by name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{filteredItems.length}</span> of{' '}
            {items.length} stock batches
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5 font-semibold">
                <button
                  onClick={() => handleSort('item_name')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Ingredient <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3.5 px-4 font-semibold">Category</th>
              <th className="py-3.5 px-4 font-semibold">
                <button
                  onClick={() => handleSort('quantity')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Quantity <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3.5 px-4 font-semibold">
                <button
                  onClick={() => handleSort('cost_per_unit')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Unit Cost / Value <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3.5 px-4 font-semibold">
                <button
                  onClick={() => handleSort('expiration_date')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Expiration <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No inventory batches match your filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const totalValue = Number(item.quantity) * Number(item.cost_per_unit);
                const daysLeft = getDaysUntilExpiration(item.expiration_date);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-medium text-slate-100">{item.item_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {Number(item.quantity).toFixed(1)} <span className="text-slate-400 text-xs">{item.unit}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">
                        ₹{Number(totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ₹{Number(item.cost_per_unit).toFixed(2)} / {item.unit}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                      {String(item.expiration_date).split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4">{renderStatusBadge(item.expiration_date)}</td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {onSendToSurplus && daysLeft >= 0 && daysLeft <= 3 && (
                          <button
                            onClick={() => onSendToSurplus(item)}
                            className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                            title="Donate expiring surplus"
                          >
                            <HandHeart className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
