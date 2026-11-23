import React, { useMemo, useState, useEffect } from 'react';
import { SurveillanceRecord } from '../types/surveillance';
import { calculateBarangayHeatmapPareto } from '../utils/epidemiology';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BarangayRiskTableProps {
  records: SurveillanceRecord[];
}

const POP_2026_STORAGE_KEY = 'argao_barangay_population_2026';

export const BarangayRiskTable: React.FC<BarangayRiskTableProps> = ({ records }) => {
  const [showAll45, setShowAll45] = useState(false);
  const [population2026Map, setPopulation2026Map] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(POP_2026_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(POP_2026_STORAGE_KEY, JSON.stringify(population2026Map));
    } catch {
      // Ignore storage quota errors
    }
  }, [population2026Map]);

  const { rows, windowWeeks } = useMemo(() => {
    return calculateBarangayHeatmapPareto(records);
  }, [records]);

  const displayedRows = useMemo(() => {
    return showAll45 ? rows : rows.slice(0, 12);
  }, [rows, showAll45]);

  const handlePopulationChange = (barangayName: string, rawVal: string) => {
    const digitsOnly = rawVal.replace(/[^\d]/g, '');
    setPopulation2026Map(prev => ({
      ...prev,
      [barangayName]: digitsOnly,
    }));
  };

  const getHeatCellClass = (count: number) => {
    if (count === 0) return 'bg-[#161922] text-slate-600';
    if (count === 1) return 'bg-blue-900/80 text-blue-100';
    if (count === 2) return 'bg-amber-600/80 text-amber-50';
    return 'bg-red-600 text-white font-bold';
  };

  const getHotspotTextClass = (tier: string) => {
    if (tier === 'Persistent') return 'text-red-400';
    if (tier === 'Emerging') return 'text-amber-400';
    if (tier === 'Controlled') return 'text-blue-400';
    if (tier === 'Sporadic') return 'text-slate-300';
    return 'text-slate-500';
  };

  return (
    <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between h-full print-break-inside">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Barangay Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            7-week trend, total cases, attack rate &amp; Pareto share
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#161922] border border-white/10 inline-block" /> 0
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-900/80 inline-block" /> 1
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-amber-600/80 inline-block" /> 2
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-600 inline-block" /> 3+
            </span>
          </div>

          <button
            onClick={() => setShowAll45(!showAll45)}
            className="no-print px-3.5 py-1.5 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <span>{showAll45 ? 'Top 12' : `All ${rows.length}`}</span>
            {showAll45 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* High-Density Heatmap & Pareto Table */}
      <div className="mt-2 flex-1 overflow-x-auto print-expand max-h-[340px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#111318] sticky top-0 z-10 border-b border-white/[0.1] text-[11px] font-mono text-slate-400">
            <tr>
              <th className="py-2 pr-2 font-medium w-8">#</th>
              <th className="py-2 pr-3 font-medium whitespace-nowrap">Barangay</th>
              <th className="py-2 px-2 font-medium text-center whitespace-nowrap">
                MW {windowWeeks[0]}–{windowWeeks[windowWeeks.length - 1]}
              </th>
              <th className="py-2 px-2 font-medium text-right whitespace-nowrap">Total Cases</th>
              <th className="py-2 px-2 font-medium text-right whitespace-nowrap">Population 2026</th>
              <th className="py-2 px-2 font-medium text-right whitespace-nowrap">Attack Rate / 1,000</th>
              <th className="py-2 px-2 font-medium whitespace-nowrap">Hotspot</th>
              <th className="py-2 pl-2 font-medium text-right whitespace-nowrap">Pareto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
            {displayedRows.map(row => {
              const rawPop = population2026Map[row.name] || '';
              const popNum = rawPop ? parseInt(rawPop, 10) : 0;
              const attackRate = popNum > 0 ? (row.ytdCases / popNum) * 1000 : null;

              return (
                <tr
                  key={row.name}
                  className="hover:bg-white/[0.03] transition-colors h-9"
                >
                  <td className="py-1.5 pr-2 text-slate-500 text-[11px]">
                    {row.rank}
                  </td>
                  <td className="py-1.5 pr-3 font-sans font-medium text-slate-100 whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="grid grid-cols-7 gap-0.5 w-36 mx-auto">
                      {row.sevenWeekCounts.map((count, idx) => (
                        <div
                          key={idx}
                          title={`${row.name} · MW ${row.sevenWeekLabels[idx]}: ${count}`}
                          className={`h-5 flex items-center justify-center text-[10px] rounded-[2px] ${getHeatCellClass(count)}`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold text-white">
                    {row.ytdCases}
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Population 2026 for ${row.name}`}
                      value={rawPop}
                      onChange={e => handlePopulationChange(row.name, e.target.value)}
                      placeholder="—"
                      className="w-20 text-right bg-transparent hover:bg-white/[0.04] focus:bg-[#0b0c0e] border border-transparent focus:border-blue-500/60 rounded px-1.5 py-0.5 text-xs font-mono tabular-nums text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-300 whitespace-nowrap">
                    {attackRate !== null ? attackRate.toFixed(2) : '—'}
                  </td>
                  <td className={`py-1.5 px-2 font-sans text-[11px] font-medium whitespace-nowrap ${getHotspotTextClass(row.hotspotTier)}`}>
                    {row.hotspotTier}
                  </td>
                  <td className="py-1.5 pl-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full ${row.isVitalFew80 ? 'bg-blue-500' : 'bg-slate-600'}`}
                          style={{ width: `${Math.min(100, row.cumulativeParetoPct)}%` }}
                        />
                      </div>
                      <span className={row.isVitalFew80 ? 'text-blue-300 font-semibold' : 'text-slate-400'}>
                        {row.cumulativeParetoPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
