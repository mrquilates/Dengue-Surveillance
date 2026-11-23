import React, { useMemo } from 'react';
import { SurveillanceRecord } from '../types/surveillance';
import { calculateClinicalSeverityBreakdown } from '../utils/epidemiology';

interface SeverityRiskCardProps {
  records: SurveillanceRecord[];
}

export const SeverityRiskCard: React.FC<SeverityRiskCardProps> = ({ records }) => {
  const severity = useMemo(() => {
    return calculateClinicalSeverityBreakdown(records);
  }, [records]);

  const classifications = [
    {
      label: 'Without Warning Signs',
      count: severity.withoutWarningSigns.count,
      pct: severity.withoutWarningSigns.pct,
      barColor: 'bg-blue-600',
      textColor: 'text-blue-300',
    },
    {
      label: 'With Warning Signs',
      count: severity.withWarningSigns.count,
      pct: severity.withWarningSigns.pct,
      barColor: 'bg-yellow-500',
      textColor: 'text-yellow-300',
    },
    {
      label: 'Severe Dengue',
      count: severity.severeDengue.count,
      pct: severity.severeDengue.pct,
      barColor: 'bg-red-600',
      textColor: 'text-red-300',
    },
  ];

  const radius = 44;
  const semiCircumference = Math.PI * radius;
  const clampedPct = Math.max(0, Math.min(100, severity.hospitalizationRatePct));
  const strokeDashoffset = semiCircumference * (1 - clampedPct / 100);

  return (
    <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between h-full print-break-inside">
      {/* Header */}
      <div className="pb-4 border-b border-white/[0.08]">
        <h3 className="text-base font-semibold text-white tracking-tight">
          Severity Risk &amp; Hospitalization
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Clinical classification &amp; hospitalization rate
        </p>
      </div>

      {/* Hospitalization Rate (%) Gauge */}
      <div className="py-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-16 shrink-0 flex items-end justify-center">
            <svg
              viewBox="0 0 110 62"
              className="w-full h-full overflow-visible"
              role="img"
              aria-label={`Hospitalization Rate ${severity.hospitalizationRatePct.toFixed(1)}%`}
            >
              <path
                d="M 11 54 A 44 44 0 0 1 99 54"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 11 54 A 44 44 0 0 1 99 54"
                fill="none"
                stroke="#2563eb"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={semiCircumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute bottom-0 text-center">
              <span className="text-lg font-bold font-mono tabular-nums text-white leading-none">
                {severity.hospitalizationRatePct.toFixed(1)}%
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-white">
              Hospitalization Rate (%)
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
              {severity.hospitalizedCount} admitted · {severity.outpatientCount} outpatient
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right font-mono tabular-nums text-xs text-slate-400">
          <div>Warning + Severe</div>
          <div className="text-base font-bold text-amber-300 mt-0.5">
            {(severity.withWarningSigns.pct + severity.severeDengue.pct).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Clinical Classification Mix */}
      <div className="pt-5 space-y-4 flex-1 flex flex-col justify-center">
        <div className="w-full h-3.5 rounded-sm overflow-hidden flex bg-[#171a21]">
          {classifications.map(item => (
            <div
              key={item.label}
              className={`${item.barColor} h-full`}
              style={{ width: `${item.pct}%` }}
            />
          ))}
        </div>

        <div className="space-y-4">
          {classifications.map(item => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-slate-100">
                  {item.label}
                </span>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <span className={`text-sm font-bold ${item.textColor}`}>
                    {item.count}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">
                    ({item.pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#171a21] rounded-sm overflow-hidden">
                <div
                  className={`${item.barColor} h-full`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
