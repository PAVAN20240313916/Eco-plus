import React from 'react';

const COLOR_STYLES = {
  emerald: {
    topBar: 'bg-[#47777B]',
    iconBg: 'bg-[#47777B]/[0.12] border-[#47777B]/30 text-[#47777B]',
    badge: 'bg-[#47777B]/[0.12] text-[#355D61] border-[#47777B]/30',
    glow: 'hover:border-[#47777B]/50'
  },
  amber: {
    topBar: 'bg-[#D9822B]',
    iconBg: 'bg-[#FEF8EE] border-[#F5D0A1] text-[#9A540E]',
    badge: 'bg-[#FDF1DF] text-[#9A540E] border-[#F5D0A1]',
    glow: 'hover:border-[#D9822B]/45'
  },
  rose: {
    topBar: 'bg-[#D9532F]',
    iconBg: 'bg-[#FDF4F1] border-[#F2CFC4] text-[#B93D1D]',
    badge: 'bg-[#FAEAE4] text-[#B93D1D] border-[#F2CFC4]',
    glow: 'hover:border-[#D9532F]/45'
  },
  sky: {
    topBar: 'bg-[#1D637A]',
    iconBg: 'bg-[#F1F8FA] border-[#B4D8E4] text-[#144D61]',
    badge: 'bg-[#E5F2F6] text-[#144D61] border-[#B4D8E4]',
    glow: 'hover:border-[#1D637A]/45'
  }
};

export default function MetricCard({
  title,
  value,
  unit = '',
  subtitle,
  badge,
  icon: Icon,
  color = 'emerald'
}) {
  const styles = COLOR_STYLES[color] || COLOR_STYLES.emerald;

  return (
    <div
      className={`relative overflow-hidden glass-card rounded-2xl p-5 pt-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${styles.glow}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${styles.topBar}`} />

      {Icon && (
        <Icon className="pointer-events-none absolute -right-3 -bottom-3 w-20 h-20 text-[#12231B] opacity-[0.04]" />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#635C4E]">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-[#12231B] tracking-tight">
              {value}
            </span>
            {unit && <span className="text-sm font-semibold text-[#635C4E]">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border shadow-sm ${styles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="relative mt-4 pt-3 border-t border-[#ECE6D6] flex items-center justify-between gap-2">
          {subtitle && <span className="text-xs font-medium text-[#635C4E] truncate">{subtitle}</span>}
          {badge && (
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${styles.badge}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
