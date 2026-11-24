import React from 'react';
import { EpidemiologicalMetrics } from '../types/surveillance';

interface TopTelemetryRowProps {
  metrics: EpidemiologicalMetrics;
  lastYearSamePeriodCases?: number;
}

const DENGUE_CASE_DEFINITIONS = [
  {
    title: 'Suspected Dengue',
    criteria:
      'Acute febrile illness (2–7 days) with at least two symptoms: headache, retro-orbital pain, myalgia, arthralgia, rash, hemorrhagic signs, or leukopenia.',
  },
  {
    title: 'Without Warning',
    criteria:
      'Probable or confirmed dengue with acute fever and systemic manifestations without abdominal pain, persistent vomiting, bleeding, or plasma leakage.',
  },
  {
    title: 'With Warning',
    criteria:
      'Abdominal tenderness, persistent vomiting, fluid accumulation, mucosal bleeding, lethargy, hepatomegaly >2 cm, or rising hematocrit.',
  },
  {
    title: 'Severe Dengue',
    criteria:
      'Severe plasma leakage leading to shock or respiratory distress, severe hemorrhage, or severe organ impairment.',
  },
];

export const TopTelemetryRow: React.FC<TopTelemetryRowProps> = ({
  metrics,
  lastYearSamePeriodCases = 48,
}) => {
  const totalCases = metrics.totalCases;
  const aliveCount = Math.max(0, totalCases - metrics.deaths);
  const alivePct = totalCases > 0 ? (aliveCount / totalCases) * 100 : 100;
  const deathSharePct = totalCases > 0 ? (metrics.deaths / totalCases) * 100 : 0;
  const yoyDiff = totalCases - lastYearSamePeriodCases;
  const yoyPct =
    lastYearSamePeriodCases > 0
      ? Math.round((yoyDiff / lastYearSamePeriodCases) * 1000) / 10
      : 0;
  const cfr = metrics.cfr;
  const nationalThreshold = 1.0;
  const isCfrExceeded = cfr >= nationalThreshold;

  const meanConsultDelay = metrics.onsetToConsultationDaysMean;
  const medianConsultDelay = metrics.onsetToConsultationDaysMedian;
  const earlyConsultPct = metrics.earlyConsultationRatePct ?? 0;
  const delayedConsultPct = metrics.delayedConsultationRatePct ?? 0;
  const delayEvaluatedCount = metrics.consultDelayEvaluatedCount ?? 0;
  const isDelayOptimal = meanConsultDelay <= 2.0;
  const isDelayElevated = meanConsultDelay > 3.0;

  const hospitalizationRate = metrics.hospitalizationRate;
  const hospitalizedCount = metrics.hospitalizedCount;
  const outpatientCount =
    metrics.outpatientCount ?? Math.max(0, totalCases - hospitalizedCount);
  const meanAdmitDelay = metrics.onsetToAdmissionDaysMean;

  return (
    <section className="space-y-5">
      {/* Six Equal-Column Executive KPI Cards (3x2 Balanced Composition) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">Total Cases</div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums text-white">
              {totalCases.toLocaleString()}
            </span>
            <span
              className={`text-xs font-mono font-semibold tabular-nums ${
                yoyDiff > 0
                  ? 'text-amber-400'
                  : yoyDiff < 0
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              {yoyDiff > 0 ? `+${yoyPct}%` : `${yoyPct}%`}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
            vs. {lastYearSamePeriodCases.toLocaleString()} last year · AR{' '}
            {((totalCases / (metrics.totalPopulation || 79064)) * 1000).toFixed(2)}/1,000
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">Total Alive</div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums text-emerald-400">
              {aliveCount.toLocaleString()}
            </span>
            <span className="text-xs font-mono font-semibold tabular-nums text-emerald-300">
              {alivePct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
            {alivePct.toFixed(1)}% of total cases
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">Total Deaths</div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span
              className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums ${
                metrics.deaths > 0 ? 'text-red-400' : 'text-slate-100'
              }`}
            >
              {metrics.deaths.toLocaleString()}
            </span>
            <span
              className={`text-xs font-mono font-semibold tabular-nums ${
                metrics.deaths > 0 ? 'text-red-300' : 'text-slate-400'
              }`}
            >
              {deathSharePct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
            {deathSharePct.toFixed(1)}% share
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">
            Case Fatality Rate
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span
              className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums ${
                isCfrExceeded ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {cfr.toFixed(2)}%
            </span>
            <span
              className={`text-xs font-medium ${
                isCfrExceeded ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              {isCfrExceeded ? 'Above Benchmark' : 'Within Benchmark'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
            vs. &lt;{nationalThreshold.toFixed(0)}% National Standard
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">
            Health-Seeking Delay
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span
              className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums ${
                isDelayElevated
                  ? 'text-red-400'
                  : isDelayOptimal
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {meanConsultDelay.toFixed(1)}d
            </span>
            <span
              className={`text-xs font-mono font-medium tabular-nums ${
                isDelayElevated
                  ? 'text-red-300'
                  : isDelayOptimal
                  ? 'text-emerald-300'
                  : 'text-amber-300'
              }`}
            >
              {earlyConsultPct.toFixed(1)}% within ≤2d
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
            Median {medianConsultDelay.toFixed(1)}d · {delayedConsultPct.toFixed(1)}% delayed &gt;3d · n={delayEvaluatedCount.toLocaleString()}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400">
            Hospitalization Rate
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span
              className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums ${
                hospitalizationRate >= 60 ? 'text-amber-400' : 'text-blue-400'
              }`}
            >
              {hospitalizationRate.toFixed(1)}%
            </span>
            <span className="text-xs font-mono font-medium tabular-nums text-blue-300">
              {hospitalizedCount.toLocaleString()} admitted
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
            {outpatientCount.toLocaleString()} outpatient · Mean {meanAdmitDelay.toFixed(1)}d to admit
          </div>
        </div>
      </div>

      {/* Dengue Standard Case Definitions — 4 Unboxed Columns with Rules */}
      <div className="border-y border-white/[0.08] py-4 print-break-inside">
        <h2 className="text-xs font-semibold tracking-wide text-slate-200 mb-3">
          Dengue Standard Case Definitions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
          {DENGUE_CASE_DEFINITIONS.map((def, idx) => (
            <div
              key={def.title}
              className={`py-2 md:py-0 ${
                idx === 0
                  ? 'md:pr-5'
                  : idx === DENGUE_CASE_DEFINITIONS.length - 1
                  ? 'md:pl-5'
                  : 'md:px-5'
              } space-y-1`}
            >
              <div className="text-xs font-semibold text-white">
                {def.title}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {def.criteria}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
