import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  Skull,
  Percent,
  Bed,
  Flame,
  Info,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { EpidemiologicalMetrics, GeoBarangaySummary } from '../types/surveillance';

interface ExecutiveKPIsProps {
  metrics: EpidemiologicalMetrics;
  barangays: GeoBarangaySummary[];
}

export const ExecutiveKPIs: React.FC<ExecutiveKPIsProps> = ({ metrics, barangays }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const activeHotspotCount = barangays.filter(b => b.isHotspot).length;

  const cards = [
    {
      id: 'total-cases',
      title: 'Total Cases',
      badge: 'Cumulative',
      value: metrics.totalCases.toLocaleString(),
      subtitle: `MW ${metrics.latestMorbidityWeek}: ${metrics.newCasesLatestMW} new (${metrics.velocityPctChange >= 0 ? '+' : ''}${metrics.velocityPctChange}% WoW)`,
      icon: Users,
      trend: metrics.velocityPctChange > 0 ? 'up' : metrics.velocityPctChange < 0 ? 'down' : 'neutral',
      borderColor: 'border-cyan-500/30',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
      formula: 'Sum of all verified surveillance cases in current surveillance cycle.',
    },
    {
      id: 'confirmed-cases',
      title: 'Confirmed Cases',
      badge: 'Lab Confirmed',
      value: metrics.confirmedCases.toLocaleString(),
      subtitle: `${metrics.totalCases > 0 ? Math.round((metrics.confirmedCases / metrics.totalCases) * 100) : 0}% Laboratory / Criteria Confirmed`,
      icon: CheckCircle,
      trend: 'neutral',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      formula: 'Cases verified by standard diagnostic criteria (PCR, NS1, IgM).',
    },
    {
      id: 'deaths',
      title: 'Reported Deaths',
      badge: 'Fatalities',
      value: metrics.deaths.toLocaleString(),
      subtitle: `${metrics.recoveries} Recovered (${metrics.totalCases > 0 ? Math.round((metrics.recoveries / metrics.totalCases) * 100) : 0}%)`,
      icon: Skull,
      trend: metrics.deaths > 0 ? 'up' : 'neutral',
      borderColor: metrics.deaths > 0 ? 'border-rose-500/30' : 'border-slate-700',
      bgColor: metrics.deaths > 0 ? 'bg-rose-500/10' : 'bg-slate-800/40',
      textColor: metrics.deaths > 0 ? 'text-rose-400' : 'text-slate-400',
      formula: 'Count of reported disease mortalities.',
    },
    {
      id: 'cfr',
      title: 'Case Fatality Rate',
      badge: 'CFR %',
      value: `${metrics.cfr.toFixed(2)}%`,
      subtitle: metrics.cfr > 1.0 ? 'Exceeds National Benchmark (>0.5%)' : 'Within Expected Baseline (≤0.5%)',
      icon: Percent,
      trend: metrics.cfr > 1.0 ? 'up' : 'neutral',
      borderColor: metrics.cfr > 1.0 ? 'border-rose-500/40' : 'border-emerald-500/40',
      bgColor: metrics.cfr > 1.0 ? 'bg-rose-500/15' : 'bg-emerald-500/15',
      textColor: metrics.cfr > 1.0 ? 'text-rose-400' : 'text-emerald-400',
      formula: 'CFR (%) = (Total Reported Deaths / Total Cumulative Cases) × 100',
    },
    {
      id: 'hospitalization-rate',
      title: 'Hospitalization Rate',
      badge: 'Admissions',
      value: `${metrics.hospitalizationRate.toFixed(1)}%`,
      subtitle: `${metrics.hospitalizedCount} Admitted Inpatients`,
      icon: Bed,
      trend: metrics.hospitalizationRate > 60 ? 'up' : 'neutral',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
      formula: 'Hospitalization Rate (%) = (Admitted Cases / Total Cases) × 100',
    },
    {
      id: 'active-hotspots',
      title: 'Active Hotspots',
      badge: 'Clusters',
      value: activeHotspotCount.toString(),
      subtitle: `${barangays.length} Monitored Barangays`,
      icon: Flame,
      trend: activeHotspotCount > 0 ? 'up' : 'neutral',
      borderColor: activeHotspotCount > 0 ? 'border-amber-500/30' : 'border-emerald-500/30',
      bgColor: activeHotspotCount > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
      textColor: activeHotspotCount > 0 ? 'text-amber-400' : 'text-emerald-400',
      formula: 'Barangays with ≥5 cumulative cases and ongoing active transmissions.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map(card => {
        const Icon = card.icon;
        const isTooltipOpen = activeTooltip === card.id;

        return (
          <div
            key={card.id}
            className={`relative p-4 rounded-xl bg-slate-900/90 border ${card.borderColor} shadow-lg transition-all duration-200 hover:border-slate-600 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 truncate">
                    {card.title}
                  </span>
                  {card.badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {card.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setActiveTooltip(isTooltipOpen ? null : card.id)}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded cursor-pointer"
                    title="View metric formula"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.textColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-white font-mono">
                  {card.value}
                </span>
                {card.trend === 'up' && (
                  <span className="inline-flex items-center text-[10px] font-bold text-rose-400">
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                )}
                {card.trend === 'down' && (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-400">
                    <ArrowDownRight className="w-3 h-3" />
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{card.subtitle}</p>
            </div>

            {isTooltipOpen && (
              <div className="mt-2.5 p-2 rounded-lg bg-slate-950 border border-slate-700 text-[10px] font-mono text-cyan-300">
                {card.formula}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
