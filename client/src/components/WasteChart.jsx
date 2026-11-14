import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const PIE_COLORS = ['#47777B', '#D9532F', '#D9822B', '#1E5E42', '#7C46A0'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#FFFDF9] border border-[#C7BFA9] rounded-xl p-3 shadow-lg text-xs">
      {label && <div className="font-semibold text-[#12231B] mb-1.5">{label}</div>}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-[#635C4E]">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}:
          </span>
          <span className="font-mono font-semibold text-[#12231B]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function WasteChart({
  weeklyTrend = [],
  wasteByCategory = [],
  wasteByReason = []
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 7-Day Waste & Carbon Trend */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#12231B]">
              7-Day Waste & Carbon Trajectory
            </h3>
            <p className="text-xs text-[#635C4E]">
              Daily organic waste (kg) vs carbon footprint impact (kg CO2e)
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ECE6D6] text-[#3D4E45]">
            SI Metric
          </span>
        </div>

        <div className="h-72 w-full">
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#47777B" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#47777B" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D9532F" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#D9532F" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6DFCE" />
                <XAxis dataKey="date" stroke="#544D40" tick={{ fill: '#544D40' }} fontSize={11} />
                <YAxis stroke="#544D40" tick={{ fill: '#544D40' }} fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#3D4E45' }} />
                <Area
                  type="monotone"
                  dataKey="wasteKg"
                  name="Waste (kg)"
                  stroke="#47777B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#wasteGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="carbonImpact"
                  name="Carbon (kg CO2e)"
                  stroke="#D9532F"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#carbonGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#635C4E]">
              No weekly trend data available yet.
            </div>
          )}
        </div>
      </div>

      {/* Category & Reason Breakdown */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#12231B]">
              Waste Distribution by Disposal Reason
            </h3>
            <p className="text-xs text-[#635C4E]">
              Root-cause analysis across logged kitchen disposal events
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ECE6D6] text-[#3D4E45]">
            Audit
          </span>
        </div>

        <div className="h-72 w-full">
          {wasteByReason.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteByReason}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  innerRadius={56}
                  outerRadius={90}
                  paddingAngle={4}
                  stroke="#FFFDF9"
                  strokeWidth={2}
                >
                  {wasteByReason.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#3D4E45' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : wasteByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteByCategory} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6DFCE" />
                <XAxis dataKey="category" stroke="#544D40" tick={{ fill: '#544D40' }} fontSize={11} />
                <YAxis stroke="#544D40" tick={{ fill: '#544D40' }} fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="wasteKg" name="Waste (kg)" fill="#47777B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#635C4E]">
              No waste breakdown records yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
