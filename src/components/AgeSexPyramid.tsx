import React, { useMemo, useState } from 'react';
import { SurveillanceRecord } from '../types/surveillance';
import {
  ARGAO_AGE_SEX_POPULATION_2026,
  ARGAO_FEMALE_POPULATION_2026,
  ARGAO_MALE_POPULATION_2026,
  ARGAO_TOTAL_POPULATION_2026,
  getDetailedAgeBracket,
} from '../utils/epidemiology';

interface AgeSexPyramidProps {
  records: SurveillanceRecord[];
}

export const AgeSexPyramid: React.FC<AgeSexPyramidProps> = ({ records }) => {
  const [viewMode, setViewMode] = useState<'cases' | 'rate'>('cases');

  const pyramidRows = useMemo(() => {
    const valid = records.filter(r => !r.isDuplicate);
    const countsByBracket: Record<string, { male: number; female: number }> = {};

    valid.forEach(r => {
      const bracket = getDetailedAgeBracket(r.age, r.ageGroup);
      if (!countsByBracket[bracket]) {
        countsByBracket[bracket] = { male: 0, female: 0 };
      }
      if (r.sex === 'M' || r.sex === 'Male') {
        countsByBracket[bracket].male += 1;
      } else if (r.sex === 'F' || r.sex === 'Female') {
        countsByBracket[bracket].female += 1;
      }
    });

    const topToBottom = [...ARGAO_AGE_SEX_POPULATION_2026].reverse();

    return topToBottom.map(demo => {
      const male = countsByBracket[demo.cohort]?.male || 0;
      const female = countsByBracket[demo.cohort]?.female || 0;
      const maleRate = demo.male > 0 ? (male / demo.male) * 1000 : 0;
      const femaleRate = demo.female > 0 ? (female / demo.female) * 1000 : 0;
      const totalRate = demo.total > 0 ? ((male + female) / demo.total) * 1000 : 0;
      return {
        cohort: demo.cohort,
        label: demo.label,
        male,
        female,
        total: male + female,
        malePop: demo.male,
        femalePop: demo.female,
        totalPop: demo.total,
        popPct: demo.pct,
        maleRate,
        femaleRate,
        totalRate,
      };
    });
  }, [records]);

  const maxSideVal = useMemo(() => {
    if (viewMode === 'rate') {
      return Math.max(...pyramidRows.map(r => Math.max(r.maleRate, r.femaleRate)), 0.1);
    }
    return Math.max(...pyramidRows.map(r => Math.max(r.male, r.female)), 1);
  }, [pyramidRows, viewMode]);

  const totalMale = useMemo(() => pyramidRows.reduce((acc, r) => acc + r.male, 0), [pyramidRows]);
  const totalFemale = useMemo(() => pyramidRows.reduce((acc, r) => acc + r.female, 0), [pyramidRows]);
  const grandTotal = totalMale + totalFemale || 1;
  const overallMaleRate = (totalMale / ARGAO_MALE_POPULATION_2026) * 1000;
  const overallFemaleRate = (totalFemale / ARGAO_FEMALE_POPULATION_2026) * 1000;

  return (
    <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between h-full print-break-inside">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Case Pyramid
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
            {viewMode === 'cases'
              ? `By 5-year age group & sex · 2026 Pop. ${ARGAO_TOTAL_POPULATION_2026.toLocaleString()}`
              : `Attack Rate / 1,000 Pop. · Base ${ARGAO_TOTAL_POPULATION_2026.toLocaleString()}`}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="no-print inline-flex rounded-lg bg-[#171a21] p-0.5 border border-white/[0.08] text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode('cases')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'cases'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cases
            </button>
            <button
              type="button"
              onClick={() => setViewMode('rate')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'rate'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rate / 1,000
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs font-mono tabular-nums text-slate-300">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 bg-blue-600 inline-block" />
          <span>
            Male {totalMale} ({Math.round((totalMale / grandTotal) * 100)}%) · Pop{' '}
            {ARGAO_MALE_POPULATION_2026.toLocaleString()} · AR {overallMaleRate.toFixed(2)}
          </span>
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 bg-red-600 inline-block" />
          <span>
            Female {totalFemale} ({Math.round((totalFemale / grandTotal) * 100)}%) · Pop{' '}
            {ARGAO_FEMALE_POPULATION_2026.toLocaleString()} · AR {overallFemaleRate.toFixed(2)}
          </span>
        </span>
      </div>

      {/* Column Axis Headers */}
      <div className="flex items-center text-[11px] font-mono text-slate-400 pt-2.5 pb-1">
        <div className="flex-1 text-right pr-2">
          {viewMode === 'rate' ? 'Male AR / 1k' : 'Male'}
        </div>
        <div className="w-14 text-center font-semibold text-slate-300">Age</div>
        <div className="flex-1 text-left pl-2">
          {viewMode === 'rate' ? 'Female AR / 1k' : 'Female'}
        </div>
      </div>

      {/* Bilateral Pyramid Stack (16 Standard Demographic Brackets) */}
      <div className="flex-1 flex flex-col justify-center">
        {pyramidRows.map(row => {
          const maleMetric = viewMode === 'rate' ? row.maleRate : row.male;
          const femaleMetric = viewMode === 'rate' ? row.femaleRate : row.female;
          const malePct = (maleMetric / maxSideVal) * 82;
          const femalePct = (femaleMetric / maxSideVal) * 82;

          return (
            <div
              key={row.cohort}
              className="flex items-center h-[21px]"
              title={`${row.label} (Pop ${row.totalPop.toLocaleString()} / ${row.popPct.toFixed(2)}%): Male ${row.male} of ${row.malePop.toLocaleString()} (${row.maleRate.toFixed(2)}/1k) · Female ${row.female} of ${row.femalePop.toLocaleString()} (${row.femaleRate.toFixed(2)}/1k)`}
            >
              <div className="flex-1 flex justify-end items-center h-full">
                {maleMetric > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-blue-300 pr-1.5 font-semibold">
                    {viewMode === 'rate' ? row.maleRate.toFixed(1) : row.male}
                  </span>
                )}
                <div
                  style={{ width: `${malePct}%` }}
                  className="h-full bg-blue-600 border-b border-[#0b0c0e]/70"
                />
              </div>

              <div className="w-14 text-center text-[10px] font-mono font-semibold text-slate-200 shrink-0 select-none">
                {row.cohort}
              </div>

              <div className="flex-1 flex justify-start items-center h-full">
                <div
                  style={{ width: `${femalePct}%` }}
                  className="h-full bg-red-600 border-b border-[#0b0c0e]/70"
                />
                {femaleMetric > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-red-300 pl-1.5 font-semibold">
                    {viewMode === 'rate' ? row.femaleRate.toFixed(1) : row.female}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
