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

  const clinicalClassifications = [
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

  const caseClassifications = [
    {
      label: 'Confirmed',
      count: severity.confirmed.count,
      pct: severity.confirmed.pct,
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-300',
    },
    {
      label: 'Probable',
      count: severity.probable.count,
      pct: severity.probable.pct,
      barColor: 'bg-amber-500',
      textColor: 'text-amber-300',
    },
    {
      label: 'Suspect',
      count: severity.suspect.count,
      pct: severity.suspect.pct,
      barColor: 'bg-slate-500',
      textColor: 'text-slate-300',
    },
  ];

  const radius = 44;
  const semiCircumference = Math.PI * radius;
  const clampedPct = Math.max(0, Math.min(100, severity.hospitalizationRatePct));
  const strokeDashoffset = semiCircumference * (1 - clampedPct / 100);

  return (
    <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between h-full print-break-inside">
      {/* Header */}
      <div className="pb-3.5 border-b border-white/[0.08] flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Clinical &amp; Case Classification
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Severity spectrum, hospitalization &amp; PIDSR case classification
          </p>
        </div>
        <div className="text-right font-mono tabular-nums text-xs shrink-0">
          <div className="text-slate-400">Classified</div>
          <div className="text-sm font-bold text-white">
            {severity.totalClassified.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Hospitalization Rate (%) Gauge */}
      <div className="py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-14 shrink-0 flex items-end justify-center">
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
              <span className="text-base font-bold font-mono tabular-nums text-white leading-none">
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

      {/* Clinical Classification & Case Classification Breakdowns */}
      <div className="pt-4 space-y-5 flex-1 flex flex-col justify-center">
        {/* Clinical Classification */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h4 className="text-xs font-semibold tracking-wide text-slate-200">
              Clinical Classification
            </h4>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">
              DOH Severity Spectrum
            </span>
          </div>

          <div className="w-full h-2.5 rounded-sm overflow-hidden flex bg-[#171a21]">
            {clinicalClassifications.map(item => (
              <div
                key={item.label}
                className={`${item.barColor} h-full`}
                style={{ width: `${item.pct}%` }}
              />
            ))}
          </div>

          <div className="space-y-2.5">
            {clinicalClassifications.map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-slate-200">
                    {item.label}
                  </span>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className={`text-xs font-bold ${item.textColor}`}>
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({item.pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#171a21] rounded-sm overflow-hidden">
                  <div
                    className={`${item.barColor} h-full`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Case Classification */}
        <div className="pt-4 border-t border-white/[0.08] space-y-3">
          <div className="flex items-baseline justify-between">
            <h4 className="text-xs font-semibold tracking-wide text-slate-200">
              Case Classification
            </h4>
            <span className="text-[11px] font-mono tabular-nums text-emerald-300">
              {severity.confirmed.pct.toFixed(1)}% lab confirmed
            </span>
          </div>

          <div className="w-full h-2.5 rounded-sm overflow-hidden flex bg-[#171a21]">
            {caseClassifications.map(item => (
              <div
                key={item.label}
                className={`${item.barColor} h-full`}
                style={{ width: `${item.pct}%` }}
              />
            ))}
          </div>

          <div className="space-y-2.5">
            {caseClassifications.map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-slate-200">
                    {item.label}
                  </span>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className={`text-xs font-bold ${item.textColor}`}>
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({item.pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#171a21] rounded-sm overflow-hidden">
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
    </div>
  );
};
