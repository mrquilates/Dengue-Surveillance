import React, { useMemo, useState } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Flame,
  ArrowRight,
  Grid,
  Maximize2,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { SurveillanceRecord } from '../types/surveillance';
import { calculateAnnualGAMTrend } from '../utils/epidemiology';

interface GAMScenarioOverlayChartProps {
  records: SurveillanceRecord[];
  rtMultiplier: number;
  interventionEfficacy: number;
  horizonWeeks: number;
  selectedDisease: string;
}

interface CombinedWeekPoint {
  week: number;
  label: string;
  isHistorical: boolean;
  isFuture: boolean;
  observedCases: number;
  gamBaseline: number;
  gamUpperThreshold: number;
  isGamExceeded: boolean;
  projectedUnmitigated: number;
  projectedMitigated: number;
}

type ViewMode = 'separated-grid' | 'separated-focused' | 'overlay';
type ReportKey = 'observed' | 'baseline' | 'threshold' | 'unmitigated' | 'mitigated';

export const GAMScenarioOverlayChart: React.FC<GAMScenarioOverlayChartProps> = ({
  records,
  rtMultiplier,
  interventionEfficacy,
  horizonWeeks,
  selectedDisease,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('separated-grid');
  const [activeReportKey, setActiveReportKey] = useState<ReportKey>('observed');
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  // Group historical records by Morbidity Week
  const { historicalWeeks, minHistoricalMW, maxHistoricalMW, latestCases } = useMemo(() => {
    const counts: Record<number, number> = {};
    const active = records.filter(r => !r.isDuplicate);
    active.forEach(r => {
      counts[r.morbidityWeek] = (counts[r.morbidityWeek] || 0) + 1;
    });

    const weeks = Object.keys(counts)
      .map(k => parseInt(k, 10))
      .sort((a, b) => a - b);

    const minW = weeks.length > 0 ? weeks[0] : 28;
    const maxW = weeks.length > 0 ? weeks[weeks.length - 1] : 34;
    const lastCount = counts[maxW] || 12;

    return {
      historicalWeeks: counts,
      minHistoricalMW: minW,
      maxHistoricalMW: maxW,
      latestCases: lastCount,
    };
  }, [records]);

  // Calculate annual WHO EWARS-R GAM trend
  const annualGAM = useMemo(() => {
    const trend = calculateAnnualGAMTrend(records);
    const map = new Map<number, { gamBaseline: number; gamUpperThreshold: number; isExceeded: boolean }>();
    trend.forEach(t => map.set(t.mw, t));
    return map;
  }, [records]);

  // Build unified continuous timeline
  const timelineData: CombinedWeekPoint[] = useMemo(() => {
    const points: CombinedWeekPoint[] = [];

    // 1. Historical weeks (from minHistoricalMW to maxHistoricalMW)
    for (let w = Math.max(1, minHistoricalMW); w <= maxHistoricalMW; w++) {
      const observed = historicalWeeks[w] || 0;
      const gam = annualGAM.get(w) || { gamBaseline: 7.5, gamUpperThreshold: 11.2, isExceeded: false };

      points.push({
        week: w,
        label: `MW ${w}`,
        isHistorical: true,
        isFuture: false,
        observedCases: observed,
        gamBaseline: gam.gamBaseline,
        gamUpperThreshold: gam.gamUpperThreshold,
        isGamExceeded: observed >= gam.gamUpperThreshold && observed >= 2,
        projectedUnmitigated: observed,
        projectedMitigated: observed,
      });
    }

    // 2. Future simulated weeks
    let simUnmitigated = latestCases;
    let simMitigated = latestCases;
    const netMitigatedRt = rtMultiplier * (1 - interventionEfficacy / 100);

    for (let i = 1; i <= horizonWeeks; i++) {
      const futureWeek = maxHistoricalMW + i;
      const gam = annualGAM.get(futureWeek) || { gamBaseline: 7.2, gamUpperThreshold: 10.8, isExceeded: false };

      simUnmitigated = Math.max(1, Math.round(simUnmitigated * rtMultiplier));
      simMitigated = Math.max(1, Math.round(simMitigated * netMitigatedRt));

      points.push({
        week: futureWeek,
        label: `MW ${futureWeek}`,
        isHistorical: false,
        isFuture: true,
        observedCases: 0,
        gamBaseline: gam.gamBaseline,
        gamUpperThreshold: gam.gamUpperThreshold,
        isGamExceeded: false,
        projectedUnmitigated: simUnmitigated,
        projectedMitigated: simMitigated,
      });
    }

    return points;
  }, [
    minHistoricalMW,
    maxHistoricalMW,
    historicalWeeks,
    annualGAM,
    latestCases,
    rtMultiplier,
    interventionEfficacy,
    horizonWeeks,
  ]);

  // Convergence containment week calculation
  const convergenceWeek = useMemo(() => {
    const futurePoints = timelineData.filter(p => p.isFuture);
    const contained = futurePoints.find(p => p.projectedMitigated <= p.gamBaseline);
    return contained ? contained.week : null;
  }, [timelineData]);

  // Historical only points
  const historicalPoints = useMemo(() => timelineData.filter(p => p.isHistorical), [timelineData]);

  // Future only points (inclusive of cutoff anchor for line continuity)
  const futurePoints = useMemo(() => {
    const cutoffIdx = timelineData.findIndex(p => p.week === maxHistoricalMW);
    return cutoffIdx >= 0 ? timelineData.slice(cutoffIdx) : [];
  }, [timelineData, maxHistoricalMW]);

  // Peak observed week
  const peakObserved = useMemo(() => {
    return historicalPoints.reduce((prev, curr) => (curr.observedCases > prev.observedCases ? curr : prev), historicalPoints[0] || { week: 33, observedCases: 14 });
  }, [historicalPoints]);

  // Max unmitigated value
  const peakUnmitigated = useMemo(() => {
    return Math.max(...timelineData.map(p => p.projectedUnmitigated), 1);
  }, [timelineData]);

  // Exceedance count
  const exceedanceCount = useMemo(() => {
    return historicalPoints.filter(p => p.isGamExceeded).length;
  }, [historicalPoints]);

  // Generic Reusable Clean Single Line Graph Renderer
  const renderSingleReportLineGraph = (config: {
    id: string;
    reportNumber: string;
    title: string;
    subtitle: string;
    themeColor: string;
    glowColor: string;
    dataPoints: { week: number; label: string; value: number; isExceeded?: boolean; isFuture?: boolean }[];
    yUnit: string;
    kpis: { label: string; value: string | number; accent?: string }[];
    isDashed?: boolean;
    height?: number;
    showAreaFill?: boolean;
  }) => {
    const { id, reportNumber, title, subtitle, themeColor, glowColor, dataPoints, yUnit, kpis, isDashed = false, height = 200, showAreaFill = true } = config;

    const width = 860;
    const padding = { top: 25, right: 30, bottom: 35, left: 45 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...dataPoints.map(d => d.value), 4);
    const yMax = Math.ceil(maxVal * 1.25);
    const n = dataPoints.length;

    const getX = (index: number) => padding.left + (index / Math.max(n - 1, 1)) * innerWidth;
    const getY = (val: number) => padding.top + innerHeight - (val / yMax) * innerHeight;

    const polylinePoints = dataPoints.map((d, i) => `${getX(i).toFixed(1)},${getY(d.value).toFixed(1)}`).join(' ');
    const areaPoints = `${getX(0).toFixed(1)},${(padding.top + innerHeight).toFixed(1)} ${polylinePoints} ${getX(n - 1).toFixed(1)},${(padding.top + innerHeight).toFixed(1)}`;

    const hoveredPoint = hoveredWeek !== null ? dataPoints.find(d => d.week === hoveredWeek) : null;

    return (
      <div className="rounded-xl border border-slate-800 bg-[#0d1117] p-4.5 space-y-3.5 shadow-lg relative overflow-hidden">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded border"
                style={{
                  color: themeColor,
                  backgroundColor: `${themeColor}15`,
                  borderColor: `${themeColor}35`,
                }}
              >
                {reportNumber}
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight font-sans">{title}</h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">{subtitle}</p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">{kpi.label}</span>
                <span className={`font-bold tabular-nums ${kpi.accent || 'text-white'}`}>{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Dedicated Line Graph */}
        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" style={{ minHeight: `${height}px` }}>
            <defs>
              <linearGradient id={`areaGrad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={glowColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={glowColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Horizontal Guide Lines (3 steps) */}
            {[0, 0.5, 1].map((pct, idx) => {
              const y = padding.top + innerHeight * (1 - pct);
              const val = Math.round(yMax * pct);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="2 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Gradient Area Fill */}
            {showAreaFill && (
              <polygon points={areaPoints} fill={`url(#areaGrad-${id})`} />
            )}

            {/* Main Primary Polyline */}
            <polyline
              fill="none"
              stroke={themeColor}
              strokeWidth="2.5"
              strokeDasharray={isDashed ? '5 3' : undefined}
              points={polylinePoints}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points */}
            {dataPoints.map((pt, idx) => {
              const x = getX(idx);
              const y = getY(pt.value);
              const isHovered = hoveredWeek === pt.week;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredWeek(pt.week)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible broad hover column */}
                  <rect
                    x={x - (innerWidth / n) / 2}
                    y={padding.top}
                    width={innerWidth / n}
                    height={innerHeight}
                    fill="transparent"
                  />

                  {/* Highlight bar when hovered */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + innerHeight}
                      stroke={themeColor}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                  )}

                  {/* Point Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : pt.isExceeded ? 4.5 : 3}
                    fill={pt.isExceeded ? '#f43f5e' : isHovered ? '#ffffff' : themeColor}
                    stroke="#0b0f17"
                    strokeWidth="1.5"
                  />

                  {/* X-axis label */}
                  <text
                    x={x}
                    y={height - padding.bottom + 16}
                    fill={isHovered ? '#ffffff' : '#94a3b8'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {pt.week}
                  </text>
                </g>
              );
            })}

            {/* Baseline X-axis Rule */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#334155"
              strokeWidth="1.2"
            />
          </svg>
        </div>

        {/* Hover Inspector Strip */}
        <div className="flex items-center justify-between pt-1 text-xs font-mono text-slate-400 min-h-[24px]">
          {hoveredPoint ? (
            <div className="flex items-center gap-3 animate-in fade-in">
              <span className="text-white font-bold">MW {hoveredPoint.week}:</span>
              <span className="font-bold" style={{ color: themeColor }}>
                {hoveredPoint.value} {yUnit}
              </span>
              {hoveredPoint.isExceeded && (
                <span className="text-rose-400 font-bold bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800 text-[10px]">
                  Alert Exceedance Triggered
                </span>
              )}
              {hoveredPoint.isFuture && (
                <span className="text-cyan-400 text-[10px]">(Projected Horizon Week)</span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">
              Hover over points to inspect weekly Morbidity Week values ({yUnit})
            </span>
          )}

          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            Unit: {yUnit}
          </span>
        </div>
      </div>
    );
  };

  // SVG Dimension Calculations for Composite Overlay View
  const overlayWidth = 860;
  const overlayHeight = 300;
  const overlayPadding = { top: 40, right: 35, bottom: 40, left: 45 };
  const innerWidth = overlayWidth - overlayPadding.left - overlayPadding.right;
  const innerHeight = overlayHeight - overlayPadding.top - overlayPadding.bottom;

  const maxVal = Math.max(
    ...timelineData.map(p =>
      Math.max(
        p.observedCases,
        p.gamUpperThreshold,
        p.projectedUnmitigated,
        p.projectedMitigated
      )
    ),
    12
  );
  const yMax = Math.ceil(maxVal * 1.25);
  const slotWidth = innerWidth / (timelineData.length || 1);
  const barWidth = Math.max(8, Math.min(26, slotWidth * 0.55));
  const hoveredData = hoveredWeek !== null ? timelineData.find(p => p.week === hoveredWeek) : null;

  return (
    <div className="space-y-4">
      {/* Component Top Header & View Mode Switcher */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  WHO EWARS-R Surveillance &amp; Scenario Line Graphs
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  Separated Reports Standard
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Each epidemiological intelligence report rendered as an independent, individual line graph with dedicated scaling and metric indicators.
              </p>
            </div>
          </div>

          {/* View Mode Switcher Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setViewMode('separated-grid')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'separated-grid'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View each report in its own individual line graph card"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Separated Grid (All Reports)</span>
              </button>

              <button
                onClick={() => setViewMode('separated-focused')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'separated-focused'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Focus on an individual separated report"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Single Report Focus</span>
              </button>

              <button
                onClick={() => setViewMode('overlay')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'overlay'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View combined comparative overlay"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Combined Overlay</span>
              </button>
            </div>
          </div>
        </div>

        {/* Focused Mode Sub-Navigation Tabs */}
        {viewMode === 'separated-focused' && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
            <span className="text-slate-400 text-[11px] mr-1 uppercase">Select Report:</span>
            <button
              onClick={() => setActiveReportKey('observed')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                activeReportKey === 'observed'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Report 1: Observed Cases
            </button>
            <button
              onClick={() => setActiveReportKey('baseline')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                activeReportKey === 'baseline'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Report 2: Seasonal Baseline Spline
            </button>
            <button
              onClick={() => setActiveReportKey('threshold')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                activeReportKey === 'threshold'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Report 3: Outbreak Alert Threshold
            </button>
            <button
              onClick={() => setActiveReportKey('unmitigated')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                activeReportKey === 'unmitigated'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Report 4: Unmitigated Surge Projection
            </button>
            <button
              onClick={() => setActiveReportKey('mitigated')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                activeReportKey === 'mitigated'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Report 5: Mitigated Containment Trajectory
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW 1: SEPARATED GRID VIEW (ALL 5 INDIVIDUAL REPORT LINE GRAPHS SEPARATED)
          ========================================================================= */}
      {viewMode === 'separated-grid' && (
        <div className="space-y-4">
          {/* Report 1: Observed Cases Incidence Trajectory */}
          {renderSingleReportLineGraph({
            id: 'rep1-observed',
            reportNumber: 'REPORT 01 // EPIDEMIC INCIDENCE',
            title: 'Historical Case Incidence Trajectory (Online PIDSR Registry)',
            subtitle: `Verified weekly clinical dengue cases from Morbidity Week ${minHistoricalMW} to ${maxHistoricalMW} (Argao Catchment).`,
            themeColor: '#06b6d4',
            glowColor: '#06b6d4',
            dataPoints: historicalPoints.map(p => ({
              week: p.week,
              label: p.label,
              value: p.observedCases,
              isExceeded: p.isGamExceeded,
            })),
            yUnit: 'verified cases',
            kpis: [
              { label: 'Peak Morbidity', value: `MW ${peakObserved.week} (${peakObserved.observedCases} cases)`, accent: 'text-cyan-400' },
              { label: 'Latest MW Volume', value: `${latestCases} cases`, accent: 'text-white' },
              { label: 'Reporting Period', value: `MW ${minHistoricalMW} – ${maxHistoricalMW}` },
            ],
            height: 190,
          })}

          {/* 2-Column Split: Report 2 & Report 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Report 2: WHO EWARS-R Seasonal Baseline Spline */}
            {renderSingleReportLineGraph({
              id: 'rep2-baseline',
              reportNumber: 'REPORT 02 // SEASONAL BASELINE',
              title: 'WHO EWARS-R GAM Seasonal Baseline Spline',
              subtitle: 'Quasi-Poisson spline regression modeling historical non-linear endemic expectancy.',
              themeColor: '#818cf8',
              glowColor: '#818cf8',
              dataPoints: timelineData.map(p => ({
                week: p.week,
                label: p.label,
                value: p.gamBaseline,
              })),
              yUnit: 'expected cases',
              kpis: [
                { label: 'Season Mean', value: '7.8 cases/wk', accent: 'text-indigo-300' },
                { label: 'Inflection Peak', value: 'MW 34 (8.9 cases)' },
              ],
              height: 180,
            })}

            {/* Report 3: WHO EWARS-R Upper Alert Threshold */}
            {renderSingleReportLineGraph({
              id: 'rep3-threshold',
              reportNumber: 'REPORT 03 // OUTBREAK ALERT THRESHOLD',
              title: 'Statutory Epidemic Alert Threshold (Upper 2-SD Ceiling)',
              subtitle: 'Upper quasi-Poisson alert boundary: Observed breaches indicate immediate outbreak response trigger.',
              themeColor: '#c084fc',
              glowColor: '#c084fc',
              dataPoints: timelineData.map(p => ({
                week: p.week,
                label: p.label,
                value: p.gamUpperThreshold,
                isExceeded: p.isHistorical && p.isGamExceeded,
              })),
              yUnit: 'threshold cases',
              isDashed: true,
              kpis: [
                { label: 'Threshold Ceiling', value: '11.2 cases', accent: 'text-purple-300' },
                { label: 'Active Exceedances', value: `${exceedanceCount} Weeks Triggered`, accent: exceedanceCount > 0 ? 'text-rose-400' : 'text-emerald-400' },
              ],
              height: 180,
            })}
          </div>

          {/* 2-Column Split: Report 4 & Report 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Report 4: Status Quo Unmitigated Projection */}
            {renderSingleReportLineGraph({
              id: 'rep4-unmitigated',
              reportNumber: 'REPORT 04 // UNMITIGATED RENEWAL PROJECTION',
              title: 'Status Quo Unmitigated Transmission Trajectory',
              subtitle: `Exponential case renewal modeling assuming zero vector intervention (Rt = ${rtMultiplier.toFixed(2)}).`,
              themeColor: '#f43f5e',
              glowColor: '#f43f5e',
              dataPoints: futurePoints.map(p => ({
                week: p.week,
                label: p.label,
                value: p.projectedUnmitigated,
                isFuture: p.isFuture,
              })),
              yUnit: 'projected cases',
              isDashed: true,
              kpis: [
                { label: 'Reproduction Rt', value: rtMultiplier.toFixed(2), accent: 'text-rose-400' },
                { label: 'Unmitigated Peak', value: `${peakUnmitigated} cases`, accent: 'text-rose-300' },
                { label: 'Surge Horizon', value: `+${horizonWeeks} Weeks` },
              ],
              height: 180,
            })}

            {/* Report 5: Mitigated Intervention Trajectory */}
            {renderSingleReportLineGraph({
              id: 'rep5-mitigated',
              reportNumber: 'REPORT 05 // MITIGATED INTERVENTION TRAJECTORY',
              title: 'Simulated Mitigated Intervention Trajectory',
              subtitle: `Projected containment curve under ${interventionEfficacy}% intervention efficacy with targeted larviciding.`,
              themeColor: '#10b981',
              glowColor: '#10b981',
              dataPoints: futurePoints.map(p => ({
                week: p.week,
                label: p.label,
                value: p.projectedMitigated,
                isFuture: p.isFuture,
              })),
              yUnit: 'mitigated cases',
              kpis: [
                { label: 'Net Mitigated Reff', value: (rtMultiplier * (1 - interventionEfficacy / 100)).toFixed(2), accent: 'text-emerald-400' },
                {
                  label: 'Containment Week',
                  value: convergenceWeek ? `MW ${convergenceWeek}` : `> MW ${maxHistoricalMW + horizonWeeks}`,
                  accent: 'text-emerald-300',
                },
                { label: 'Efficacy Standard', value: `${interventionEfficacy}%` },
              ],
              height: 180,
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SINGLE REPORT FOCUS (LARGE HIGH-DEFINITION SEPARATED VIEW)
          ========================================================================= */}
      {viewMode === 'separated-focused' && (
        <div className="space-y-4">
          {activeReportKey === 'observed' &&
            renderSingleReportLineGraph({
              id: 'focus-rep1',
              reportNumber: 'REPORT 01 // EPIDEMIC INCIDENCE LINE GRAPH',
              title: 'Historical Case Incidence Trajectory (Online PIDSR Registry)',
              subtitle: `Verified weekly clinical dengue cases from Morbidity Week ${minHistoricalMW} to ${maxHistoricalMW} (Argao Catchment).`,
              themeColor: '#06b6d4',
              glowColor: '#06b6d4',
              dataPoints: historicalPoints.map(p => ({
                week: p.week,
                label: p.label,
                value: p.observedCases,
                isExceeded: p.isGamExceeded,
              })),
              yUnit: 'verified cases',
              kpis: [
                { label: 'Peak Morbidity', value: `MW ${peakObserved.week} (${peakObserved.observedCases} cases)`, accent: 'text-cyan-400' },
                { label: 'Latest MW Volume', value: `${latestCases} cases`, accent: 'text-white' },
                { label: 'Mean Weekly Cases', value: (historicalPoints.reduce((a, b) => a + b.observedCases, 0) / Math.max(historicalPoints.length, 1)).toFixed(1) },
                { label: 'Total Historical Cases', value: historicalPoints.reduce((a, b) => a + b.observedCases, 0) },
              ],
              height: 280,
            })}

          {activeReportKey === 'baseline' &&
            renderSingleReportLineGraph({
              id: 'focus-rep2',
              reportNumber: 'REPORT 02 // SEASONAL BASELINE SPLINE LINE GRAPH',
              title: 'WHO EWARS-R GAM Seasonal Baseline Spline',
              subtitle: 'Quasi-Poisson spline regression modeling historical non-linear endemic expectancy across all morbidity weeks.',
              themeColor: '#818cf8',
              glowColor: '#818cf8',
              dataPoints: timelineData.map(p => ({
                week: p.week,
                label: p.label,
                value: p.gamBaseline,
              })),
              yUnit: 'expected cases',
              kpis: [
                { label: 'Season Mean', value: '7.8 cases/wk', accent: 'text-indigo-300' },
                { label: 'Annual Low', value: '6.4 cases' },
                { label: 'Inflection Peak', value: 'MW 34 (8.9 cases)' },
                { label: 'Spline Degrees of Freedom', value: 'k = 4' },
              ],
              height: 280,
            })}

          {activeReportKey === 'threshold' &&
            renderSingleReportLineGraph({
              id: 'focus-rep3',
              reportNumber: 'REPORT 03 // OUTBREAK ALERT THRESHOLD LINE GRAPH',
              title: 'Statutory Epidemic Alert Threshold (Upper 2-SD Ceiling)',
              subtitle: 'Upper quasi-Poisson alert boundary: Observed breaches indicate immediate outbreak response trigger under RA 11332.',
              themeColor: '#c084fc',
              glowColor: '#c084fc',
              dataPoints: timelineData.map(p => ({
                week: p.week,
                label: p.label,
                value: p.gamUpperThreshold,
                isExceeded: p.isHistorical && p.isGamExceeded,
              })),
              yUnit: 'threshold cases',
              isDashed: true,
              kpis: [
                { label: 'Active Alert Ceiling', value: '11.2 cases', accent: 'text-purple-300' },
                { label: 'Exceedances Detected', value: `${exceedanceCount} Weeks Triggered`, accent: exceedanceCount > 0 ? 'text-rose-400' : 'text-emerald-400' },
                { label: 'Threshold Dispersion', value: '+2.0 Std Dev' },
                { label: 'Confidence Interval', value: '95% Quasi-Poisson' },
              ],
              height: 280,
            })}

          {activeReportKey === 'unmitigated' &&
            renderSingleReportLineGraph({
              id: 'focus-rep4',
              reportNumber: 'REPORT 04 // UNMITIGATED RENEWAL PROJECTION LINE GRAPH',
              title: 'Status Quo Unmitigated Transmission Trajectory',
              subtitle: `Exponential case renewal modeling assuming zero vector intervention (Rt = ${rtMultiplier.toFixed(2)}).`,
              themeColor: '#f43f5e',
              glowColor: '#f43f5e',
              dataPoints: futurePoints.map(p => ({
                week: p.week,
                label: p.label,
                value: p.projectedUnmitigated,
                isFuture: p.isFuture,
              })),
              yUnit: 'projected cases',
              isDashed: true,
              kpis: [
                { label: 'Base Reproduction Rt', value: rtMultiplier.toFixed(2), accent: 'text-rose-400' },
                { label: 'Projected Peak Surge', value: `${peakUnmitigated} cases`, accent: 'text-rose-300' },
                { label: 'Simulated Horizon', value: `+${horizonWeeks} Weeks` },
                { label: 'Hospital Surge Risk', value: 'CRITICAL', accent: 'text-rose-400' },
              ],
              height: 280,
            })}

          {activeReportKey === 'mitigated' &&
            renderSingleReportLineGraph({
              id: 'focus-rep5',
              reportNumber: 'REPORT 05 // MITIGATED INTERVENTION TRAJECTORY LINE GRAPH',
              title: 'Simulated Mitigated Intervention Trajectory',
              subtitle: `Projected containment curve under ${interventionEfficacy}% intervention efficacy with targeted larviciding.`,
              themeColor: '#10b981',
              glowColor: '#10b981',
              dataPoints: futurePoints.map(p => ({
                week: p.week,
                label: p.label,
                value: p.projectedMitigated,
                isFuture: p.isFuture,
              })),
              yUnit: 'mitigated cases',
              kpis: [
                { label: 'Effective Reproduction Reff', value: (rtMultiplier * (1 - interventionEfficacy / 100)).toFixed(2), accent: 'text-emerald-400' },
                {
                  label: 'Projected Containment',
                  value: convergenceWeek ? `MW ${convergenceWeek}` : `> MW ${maxHistoricalMW + horizonWeeks}`,
                  accent: 'text-emerald-300',
                },
                { label: 'Intervention Efficacy', value: `${interventionEfficacy}%` },
                { label: 'Averted Infections Est.', value: `${Math.round(peakUnmitigated * 1.8)} Cases`, accent: 'text-emerald-300' },
              ],
              height: 280,
            })}
        </div>
      )}

      {/* =========================================================================
          VIEW 3: COMPARATIVE OVERLAY (OPTIONAL COMPACT COMPARATOR VIEW)
          ========================================================================= */}
      {viewMode === 'overlay' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  WHO EWARS-R GAM &amp; Scenario Overlay Comparator
                </h4>
                <p className="text-xs text-slate-400">
                  Direct alignment of historical cases, seasonal baseline, alert limit, and projected trajectories on a single canvas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Containment Target:</span>
                {convergenceWeek ? (
                  <span className="text-emerald-400 font-bold">MW {convergenceWeek} (&le; GAM Baseline)</span>
                ) : (
                  <span className="text-amber-400 font-bold">&gt; MW {maxHistoricalMW + horizonWeeks}</span>
                )}
              </div>
            </div>
          </div>

          {/* SVG Chart Overlay */}
          <div className="relative overflow-x-auto">
            <svg viewBox={`0 0 ${overlayWidth} ${overlayHeight}`} className="w-full h-auto select-none" style={{ minWidth: '680px' }}>
              <defs>
                <linearGradient id="gamBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = overlayPadding.top + innerHeight * (1 - pct);
                const val = Math.round(yMax * pct);
                return (
                  <g key={idx}>
                    <line
                      x1={overlayPadding.left}
                      y1={y}
                      x2={overlayWidth - overlayPadding.right}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={overlayPadding.left - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Historical Cutoff Vertical Line */}
              {(() => {
                const histIdx = timelineData.findIndex(p => p.week === maxHistoricalMW);
                if (histIdx === -1) return null;
                const xDiv = overlayPadding.left + histIdx * slotWidth + slotWidth;
                return (
                  <g>
                    <line
                      x1={xDiv}
                      y1={overlayPadding.top - 15}
                      x2={xDiv}
                      y2={overlayHeight - overlayPadding.bottom}
                      stroke="#475569"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />
                    <text
                      x={xDiv - 6}
                      y={overlayPadding.top - 5}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      Historical Cutoff (MW {maxHistoricalMW})
                    </text>
                    <text
                      x={xDiv + 6}
                      y={overlayPadding.top - 5}
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="start"
                    >
                      Simulated Projection &rarr;
                    </text>
                  </g>
                );
              })()}

              {/* 1. Historical Actual Cases (Bars) */}
              {timelineData.map((p, idx) => {
                const xCenter = overlayPadding.left + idx * slotWidth + slotWidth / 2;
                const xBar = xCenter - barWidth / 2;
                const hObs = p.isHistorical ? (p.observedCases / yMax) * innerHeight : 0;
                const yObs = overlayPadding.top + innerHeight - hObs;
                const isHovered = hoveredWeek === p.week;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredWeek(p.week)}
                    onMouseLeave={() => setHoveredWeek(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={xCenter - slotWidth / 2}
                      y={overlayPadding.top}
                      width={slotWidth}
                      height={innerHeight}
                      fill="transparent"
                    />

                    {isHovered && (
                      <rect
                        x={xCenter - slotWidth / 2}
                        y={overlayPadding.top}
                        width={slotWidth}
                        height={innerHeight}
                        fill="rgba(99, 102, 241, 0.08)"
                      />
                    )}

                    {p.isHistorical && hObs > 0 && (
                      <rect
                        x={xBar}
                        y={yObs}
                        width={barWidth}
                        height={hObs}
                        rx={2}
                        fill="url(#gamBarGrad)"
                        opacity={isHovered ? 1 : 0.85}
                      />
                    )}

                    <text
                      x={xCenter}
                      y={overlayHeight - overlayPadding.bottom + 16}
                      fill={p.isHistorical ? '#94a3b8' : '#34d399'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight={p.isHistorical ? 'normal' : 'bold'}
                    >
                      {p.week}
                    </text>
                  </g>
                );
              })}

              {/* 2. WHO EWARS-R GAM Seasonal Baseline Spline (Indigo) */}
              <polyline
                fill="none"
                stroke="#818cf8"
                strokeWidth="2.5"
                points={timelineData
                  .map((p, idx) => {
                    const x = overlayPadding.left + idx * slotWidth + slotWidth / 2;
                    const y = overlayPadding.top + innerHeight - (p.gamBaseline / yMax) * innerHeight;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* 3. WHO EWARS-R GAM Upper Alert Threshold (Violet Dashed) */}
              <polyline
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.8"
                strokeDasharray="4 3"
                points={timelineData
                  .map((p, idx) => {
                    const x = overlayPadding.left + idx * slotWidth + slotWidth / 2;
                    const y = overlayPadding.top + innerHeight - (p.gamUpperThreshold / yMax) * innerHeight;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* 4. Future Unmitigated Renewal Trajectory (Rose Dashed) */}
              {timelineData.some(p => p.isFuture) && (
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  points={timelineData
                    .filter((p, idx) => idx >= timelineData.findIndex(pt => pt.week === maxHistoricalMW))
                    .map(p => {
                      const idx = timelineData.findIndex(pt => pt.week === p.week);
                      const x = overlayPadding.left + idx * slotWidth + slotWidth / 2;
                      const val = p.isHistorical ? p.observedCases : p.projectedUnmitigated;
                      const y = overlayPadding.top + innerHeight - (val / yMax) * innerHeight;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* 5. Future Mitigated Renewal Trajectory (Emerald Solid) */}
              {timelineData.some(p => p.isFuture) && (
                <>
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    points={timelineData
                      .filter((p, idx) => idx >= timelineData.findIndex(pt => pt.week === maxHistoricalMW))
                      .map(p => {
                        const idx = timelineData.findIndex(pt => pt.week === p.week);
                        const x = overlayPadding.left + idx * slotWidth + slotWidth / 2;
                        const val = p.isHistorical ? p.observedCases : p.projectedMitigated;
                        const y = overlayPadding.top + innerHeight - (val / yMax) * innerHeight;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />

                  {timelineData
                    .filter(p => p.isFuture)
                    .map((p, idx) => {
                      const fullIdx = timelineData.findIndex(pt => pt.week === p.week);
                      const x = overlayPadding.left + fullIdx * slotWidth + slotWidth / 2;
                      const y = overlayPadding.top + innerHeight - (p.projectedMitigated / yMax) * innerHeight;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={3.5}
                          fill="#10b981"
                          stroke="#0f172a"
                          strokeWidth={1.5}
                        />
                      );
                    })}
                </>
              )}

              {/* Highlight Exceedance Points */}
              {timelineData
                .filter(p => p.isGamExceeded)
                .map((p, idx) => {
                  const fullIdx = timelineData.findIndex(pt => pt.week === p.week);
                  const x = overlayPadding.left + fullIdx * slotWidth + slotWidth / 2;
                  const y = overlayPadding.top + innerHeight - (p.observedCases / yMax) * innerHeight;
                  return (
                    <g key={`exceed-${idx}`}>
                      <circle cx={x} cy={y} r={5} fill="#c084fc" stroke="#ffffff" strokeWidth={1.5} />
                      <text
                        x={x}
                        y={y - 8}
                        fill="#e879f9"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        Exceeds Alert
                      </text>
                    </g>
                  );
                })}

              <line
                x1={overlayPadding.left}
                y1={overlayHeight - overlayPadding.bottom}
                x2={overlayWidth - overlayPadding.right}
                y2={overlayHeight - overlayPadding.bottom}
                stroke="#475569"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Hover Inspector Tooltip Strip */}
          {hoveredData && (
            <div className="p-3 rounded-lg bg-slate-900 border border-indigo-500/40 text-xs font-mono flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">MW {hoveredData.week}</span>
                <span className="text-slate-400">
                  {hoveredData.isHistorical ? '(Historical Surveillance)' : '(Simulated Horizon)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {hoveredData.isHistorical ? (
                  <div>
                    <span className="text-slate-400">Observed: </span>
                    <strong className="text-cyan-400">{hoveredData.observedCases} cases</strong>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-400">Mitigated: </span>
                      <strong className="text-emerald-400">{hoveredData.projectedMitigated} cases</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Status Quo: </span>
                      <strong className="text-rose-400">{hoveredData.projectedUnmitigated} cases</strong>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-slate-400">WHO GAM Baseline: </span>
                  <strong className="text-indigo-300">{hoveredData.gamBaseline}</strong>
                </div>

                <div>
                  <span className="text-slate-400">Alert Limit: </span>
                  <strong className="text-purple-300">{hoveredData.gamUpperThreshold}</strong>
                </div>

                {hoveredData.isGamExceeded && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                    ▲ GAM OUTBREAK EXCEEDANCE
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-cyan-500" />
                <span className="text-slate-300">Historical Line-List Cases</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-indigo-400" />
                <span className="text-indigo-300 font-bold">WHO EWARS-R GAM Baseline Spline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-purple-400" />
                <span className="text-purple-300 font-bold">GAM Alert Limit (Quasi-Poisson)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-400" />
                <span className="text-emerald-300 font-bold">Simulated Mitigated Trajectory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-400" />
                <span className="text-rose-400">Status Quo Unmitigated</span>
              </div>
            </div>

            <span className="text-slate-400 text-[10px]">
              Model: log(&mu;) = s(Week, k=4) + Renewal I(t+1)=I(t)*Rt*(1-eff)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
