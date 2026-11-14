import React, { useState, useEffect } from 'react';
import { History, Sparkles, Clock } from 'lucide-react';
import { aiAPI } from '../services/api';
import AIAdvisorPanel from '../components/AIAdvisorPanel';

export default function AIAdvisorPage() {
  const [history, setHistory] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState(null);

  const loadHistory = async () => {
    try {
      const res = await aiAPI.getHistory();
      if (res.data?.success && res.data.data?.length > 0) {
        setHistory(res.data.data);
        const latestForecast = res.data.data.find((h) => h.insight_type === 'DEMAND_FORECAST');
        if (latestForecast) {
          setSelectedInsight(
            typeof latestForecast.recommendations === 'string'
              ? JSON.parse(latestForecast.recommendations)
              : latestForecast.recommendations
          );
        }
      }
    } catch (err) {
      console.error('Failed to load AI insight history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="space-y-8">
      <AIAdvisorPanel
        initialInsight={selectedInsight}
        onForecastComplete={() => loadHistory()}
      />

      {/* Past AI Audits History */}
      {history.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100">AI Sustainability Audit History</h3>
          </div>

          <div className="space-y-2.5">
            {history.map((entry) => {
              const rec =
                typeof entry.recommendations === 'string'
                  ? JSON.parse(entry.recommendations)
                  : entry.recommendations;
              return (
                <div
                  key={entry.id}
                  onClick={() => {
                    if (entry.insight_type === 'DEMAND_FORECAST') {
                      setSelectedInsight(rec);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 cursor-pointer transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">
                        {entry.insight_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {rec?.summary || rec?.refrigerationGuidance || 'AI Matchmaking Audit'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
