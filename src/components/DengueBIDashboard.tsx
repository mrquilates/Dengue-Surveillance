import React, { useMemo } from 'react';
import { EpidemiologicalMetrics, SurveillanceRecord } from '../types/surveillance';
import { TopTelemetryRow } from './TopTelemetryRow';
import { CDCEpiCurve } from './CDCEpiCurve';
import { BarangayRiskTable } from './BarangayRiskTable';
import { AgeSexPyramid } from './AgeSexPyramid';
import { SeverityRiskCard } from './SeverityRiskCard';

interface DengueBIDashboardProps {
  records: SurveillanceRecord[];
  metrics: EpidemiologicalMetrics;
  onOpenDataCollection: () => void;
}

export const DengueBIDashboard: React.FC<DengueBIDashboardProps> = ({
  records,
  metrics,
  onOpenDataCollection,
}) => {
  const activeRecords = useMemo(
    () => records.filter(r => !r.isDuplicate),
    [records]
  );

  // Dynamic live current date formatting for subtitle
  const formattedAsOfDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const coverageRangeLabel = useMemo(() => {
    const validDates = activeRecords
      .map(r => r.dateOnset)
      .filter(Boolean)
      .sort();
    if (validDates.length === 0) return 'Jan 1 – Nov 21, 2026';

    const start = new Date(`${validDates[0]}T00:00:00`);
    const end = new Date(`${validDates[validDates.length - 1]}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Jan 1 – Nov 21, 2026';
    }
    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startStr} – ${endStr}`;
  }, [activeRecords]);

  const maxEpiWeek = Math.max(46, metrics.latestMorbidityWeek || 46);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header: Title & Dynamic As-Of Date Subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
            Dengue Surveillance Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Municipality of Argao, Cebu as of {formattedAsOfDate}
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenDataCollection}
            className="no-print text-sm sm:text-base font-semibold text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Data Collection
          </button>
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            {coverageRangeLabel}
          </div>
        </div>
      </div>

      {/* Top Section: 6 Equal KPI Columns + 4 Unboxed Case Definition Columns */}
      <TopTelemetryRow metrics={metrics} lastYearSamePeriodCases={48} />

      {/* Mid Visualization Bento Grid (2 x 2 Balanced Composition) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        {/* Top-Left: Epidemic Curve (MW 1 – MW 46) */}
        <CDCEpiCurve records={activeRecords} maxWeek={maxEpiWeek} />

        {/* Top-Right: Barangay Heatmap & Pareto Table */}
        <BarangayRiskTable records={activeRecords} />

        {/* Bottom-Left: Case Pyramid (Ages 0 at bottom to 70+ at top) */}
        <AgeSexPyramid records={activeRecords} />

        {/* Bottom-Right: Severity Risk & Hospitalization Gauge */}
        <SeverityRiskCard records={activeRecords} />
      </div>
    </div>
  );
};
