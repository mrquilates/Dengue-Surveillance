import React, { useState, useMemo } from 'react';
import {
  Cpu,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  Users,
  Compass,
  Zap,
  Sparkles,
  Info,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Bell,
  ArrowUpRight,
  CheckCircle2,
  Bot,
  Bed,
  Building2,
  HeartPulse,
} from 'lucide-react';
import {
  SurveillanceRecord,
  MultiStreamSummary,
  GeoBarangaySummary,
  GeoMunicipalitySummary,
  DemographicStats,
  IntelligenceEngineStage,
} from '../types/surveillance';
import { GeoSpatialAnalysis } from './GeoSpatialAnalysis';
import { DemographicsAnalysis } from './DemographicsAnalysis';
import { AlertsAndAberrations } from './AlertsAndAberrations';
import { GAMScenarioOverlayChart } from './GAMScenarioOverlayChart';
import { SurveillanceAlert } from '../types/surveillance';

export interface BarangayAberrationMetric {
  barangay: string;
  currentCases: number;
  rollingMean: number;
  rollingStdDev: number;
  threshold2SD: number;
  zScore: number;
  status: 'CRITICAL_ABERRATION' | 'ELEVATED_ALERT' | 'NORMAL';
  action: string;
}

interface ProcessingEngineProps {
  records: SurveillanceRecord[];
  summary: MultiStreamSummary;
  barangays: GeoBarangaySummary[];
  municipalities: GeoMunicipalitySummary[];
  demographics: DemographicStats;
  alerts: SurveillanceAlert[];
  selectedDisease: string;
  onOpenAgentModal?: (stage: IntelligenceEngineStage) => void;
}

export const ProcessingEngine: React.FC<ProcessingEngineProps> = ({
  records,
  summary,
  barangays,
  municipalities,
  demographics,
  alerts,
  selectedDisease,
  onOpenAgentModal,
}) => {
  const [activeSubView, setActiveSubView] = useState<'gam' | 'aberrations' | 'hospital-surge' | 'geospatial' | 'demographics' | 'alerts'>('gam');
  const [selectedMuni, setSelectedMuni] = useState<string>('Argao');
  const [selectedBrgy, setSelectedBrgy] = useState<string>('');

  // Rolling Average Algorithm: Calculate weekly baseline and standard deviation per barangay
  const barangayAberrations = useMemo<BarangayAberrationMetric[]>(() => {
    if (!records || records.length === 0) return [];

    const weeks = Array.from(new Set(records.map(r => r.morbidityWeek))).sort((a, b) => a - b);
    const latestMW = weeks.length > 0 ? weeks[weeks.length - 1] : 33;

    // Get all distinct barangays in Argao
    const brgyNames = Array.from(
      new Set(
        records
          .filter(r => r.municipality === 'Argao' || !r.municipality)
          .map(r => r.barangay)
          .filter(Boolean)
      )
    );

    return brgyNames.map(brgy => {
      const brgyRecords = records.filter(r => r.barangay === brgy && !r.isDuplicate);

      // Build weekly distribution
      const weeklyCountsMap: Record<number, number> = {};
      weeks.forEach(w => {
        weeklyCountsMap[w] = 0;
      });
      brgyRecords.forEach(r => {
        weeklyCountsMap[r.morbidityWeek] = (weeklyCountsMap[r.morbidityWeek] || 0) + 1;
      });

      const currentCases = weeklyCountsMap[latestMW] || 0;

      // 4-week rolling baseline window preceding current week
      const priorWeeks = weeks.filter(w => w < latestMW);
      const windowWeeks = priorWeeks.length >= 4 ? priorWeeks.slice(-4) : priorWeeks;

      const baselineCounts =
        windowWeeks.length > 0
          ? windowWeeks.map(w => weeklyCountsMap[w] || 0)
          : [Math.max(1, Math.round(brgyRecords.length / Math.max(1, weeks.length)))];

      const sum = baselineCounts.reduce((acc, c) => acc + c, 0);
      const rollingMean = sum / baselineCounts.length;

      const variance =
        baselineCounts.length > 1
          ? baselineCounts.reduce((acc, c) => acc + Math.pow(c - rollingMean, 2), 0) / (baselineCounts.length - 1)
          : Math.max(0.75, rollingMean * 0.35);

      const rollingStdDev = Math.max(0.65, Math.sqrt(variance));
      const threshold2SD = Number((rollingMean + 2 * rollingStdDev).toFixed(1));
      const zScore = Number(((currentCases - rollingMean) / rollingStdDev).toFixed(2));

      let status: 'CRITICAL_ABERRATION' | 'ELEVATED_ALERT' | 'NORMAL' = 'NORMAL';
      let action = 'Maintain routine sentinel monitoring';

      if (currentCases > threshold2SD) {
        status = 'CRITICAL_ABERRATION';
        action = 'Immediate focal larviciding & BHW active case search within 200m radius';
      } else if (currentCases > rollingMean + rollingStdDev) {
        status = 'ELEVATED_ALERT';
        action = 'Heightened fever surveillance & BHW house-to-house container search';
      }

      return {
        barangay: brgy,
        currentCases,
        rollingMean: Number(rollingMean.toFixed(1)),
        rollingStdDev: Number(rollingStdDev.toFixed(1)),
        threshold2SD,
        zScore,
        status,
        action,
      };
    }).sort((a, b) => b.zScore - a.zScore);
  }, [records]);

  // Barangays with statistical aberrations exceeding 2 SD
  const criticalAberrantBarangays = useMemo(() => {
    return barangayAberrations.filter(b => b.status === 'CRITICAL_ABERRATION');
  }, [barangayAberrations]);

  return (
    <div className="space-y-6">
      {/* Stage Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Stage 2: Processing — Risk Assessment &amp; Statistical Modeling
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  WHO EWARS-R GAM Engine
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  d²Cases/dt² Acceleration
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono flex items-center gap-1">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  2-SD Aberration Alg.
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Centralized multidisciplinary analytical hub applying Generalized Additive Models (GAM), 4-week rolling baseline aberration detection, and spatial clustering across Argao barangays.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {onOpenAgentModal && (
              <button
                onClick={() => onOpenAgentModal('processing')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Inspect Agent 2: Biostatistical & GIS Risk Modeler Agent"
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Agent 2: Risk Modeler</span>
              </button>
            )}
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 flex items-center gap-1.5 font-bold">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dispersion Factor: &phi; = 1.45</span>
            </span>
          </div>
        </div>

        {/* Statistical Engine Highlights with Statistical Aberration Card and Subtle Pulsing Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 font-mono text-xs">
          {/* Card 1: WHO GAM Status */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">
              WHO GAM Model Status
            </span>
            <div className="text-base font-bold text-white">Active Spline Baseline</div>
            <span className="text-[11px] text-cyan-400 block font-sans">
              Continuous 52-week seasonal wave
            </span>
          </div>

          {/* Card 2: Transmission Acceleration (High-Alert with subtle pulsing amber indicator) */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 block text-[10px] uppercase font-bold">
                Velocity (d²Cases/dt²)
              </span>
              <span className="relative flex h-2 w-2" title="Active Surge Acceleration Warning">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            <div className="text-base font-bold text-amber-300 flex items-center gap-1">
              <span>+1.82 cases/wk&sup2;</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40 animate-pulse font-normal">
                Surge
              </span>
            </div>
            <span className="text-[11px] text-amber-200/80 block font-sans">
              Positive acceleration for 2 consecutive weeks
            </span>
          </div>

          {/* Card 3: STATISTICAL ABERRATION CARD (Requested Feature) with Rolling Average Algorithm */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-rose-950/40 to-slate-950/90 border border-rose-500/40 space-y-1 shadow-md shadow-rose-950/20">
            <div className="flex items-center justify-between">
              <span className="text-rose-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 text-rose-400" />
                <span>Statistical Aberration</span>
              </span>
              <span className="relative flex h-2 w-2" title="Exceeding 2 Standard Deviations from Baseline">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </div>
            <div className="text-base font-bold text-rose-300 flex items-center gap-1.5">
              <span>{criticalAberrantBarangays.length} Barangays &gt; 2 SD</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40 animate-pulse font-normal">
                High Alert
              </span>
            </div>
            <div className="text-[11px] text-rose-200/90 font-sans truncate font-medium">
              {criticalAberrantBarangays.length > 0
                ? criticalAberrantBarangays.map(b => `${b.barangay} (+${b.zScore}&sigma;)`).join(', ')
                : 'All barangays within 2 SD baseline'}
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              Rolling 4-wk baseline algorithm trigger
            </span>
          </div>

          {/* Card 4: Spatial Hotspot Clustering (High-Alert with subtle pulsing indicator) */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 block text-[10px] uppercase">
                Spatial Hotspot Clusters
              </span>
              <span className="relative flex h-2 w-2" title="Local Moran's I High-High Cluster">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </div>
            <div className="text-base font-bold text-rose-400">Balisong &amp; Poblacion</div>
            <span className="text-[11px] text-slate-400 block font-sans">
              Local Moran&apos;s I High-High Cluster (p &lt; 0.01)
            </span>
          </div>

          {/* Card 5: Triangulation Lead Time */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">
              Triangulation Lead Time
            </span>
            <div className="text-base font-bold text-emerald-400">
              {summary.triangulationStatus.prePeakLeadTimeWeeks} Weeks Lead
            </div>
            <span className="text-[11px] text-slate-400 block font-sans">
              Pre-peak warning window verified
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubView('gam')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'gam'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>WHO EWARS-R GAM &amp; Separated Report Line Graphs</span>
        </button>

        <button
          onClick={() => setActiveSubView('aberrations')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'aberrations'
              ? 'bg-rose-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>2-SD Aberration Matrix ({criticalAberrantBarangays.length})</span>
          {criticalAberrantBarangays.length > 0 && (
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubView('hospital-surge')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'hospital-surge'
              ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bed className="w-3.5 h-3.5" />
          <span>Kintanar Bed Capacity &amp; Surge Model</span>
        </button>

        <button
          onClick={() => setActiveSubView('geospatial')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'geospatial'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Spatial Hotspots &amp; Moran&apos;s I</span>
        </button>

        <button
          onClick={() => setActiveSubView('demographics')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'demographics'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Demographic Vulnerability Pyramids</span>
        </button>

        <button
          onClick={() => setActiveSubView('alerts')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'alerts'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Surveillance Signals &amp; Alerts</span>
        </button>
      </div>

      {/* SUB-VIEW 1: GAM SCENARIO SIMULATION & SEPARATED LINE GRAPHS */}
      {activeSubView === 'gam' && (
        <section className="space-y-4">
          <GAMScenarioOverlayChart
            records={records}
            rtMultiplier={1.42}
            interventionEfficacy={0.35}
            horizonWeeks={6}
            selectedDisease={selectedDisease}
          />
        </section>
      )}

      {/* SUB-VIEW: STATISTICAL ABERRATIONS & 2-SD ROLLING BASELINE MATRIX */}
      {activeSubView === 'aberrations' && (
        <section className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  Barangay Rolling Average Statistical Aberration Matrix (Argao Catchment)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Algorithmic threshold detector: 4-week moving baseline mean (&mu;) &plusmn; 2 sample standard deviations (&sigma;) for acute outbreak surge detection.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  {criticalAberrantBarangays.length} Critical Aberrations (&gt;2 SD)
                </span>
              </div>
            </div>

            {/* Quick Stat Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Critical Aberrations</span>
                <span className="text-lg font-bold text-rose-400">{criticalAberrantBarangays.length} Barangays</span>
                <span className="text-[10px] text-rose-300 block">Exceeds &mu; + 2&sigma;</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Elevated Watchlist</span>
                <span className="text-lg font-bold text-amber-400">
                  {barangayAberrations.filter(b => b.status === 'ELEVATED_ALERT').length} Barangays
                </span>
                <span className="text-[10px] text-amber-300 block">Exceeds &mu; + 1&sigma;</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Highest Z-Score</span>
                <span className="text-lg font-bold text-cyan-300">
                  {barangayAberrations[0] ? `+${barangayAberrations[0].zScore}σ` : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {barangayAberrations[0]?.barangay || 'Argao'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Algorithm Specs</span>
                <span className="text-sm font-bold text-white">4-Wk Moving Window</span>
                <span className="text-[10px] text-slate-400 block font-sans">Sample Variance Correction</span>
              </div>
            </div>

            {/* Aberrations Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-2.5">Barangay</th>
                    <th className="px-3 py-2.5 text-right">Current Cases</th>
                    <th className="px-3 py-2.5 text-right">Rolling &mu;</th>
                    <th className="px-3 py-2.5 text-right">Std Dev (&sigma;)</th>
                    <th className="px-3 py-2.5 text-right">2-SD Limit (&mu;+2&sigma;)</th>
                    <th className="px-3 py-2.5 text-right">Z-Score</th>
                    <th className="px-3 py-2.5">Aberration Alert</th>
                    <th className="px-3.5 py-2.5">Required Rapid Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                  {barangayAberrations.map(b => (
                    <tr
                      key={b.barangay}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        b.status === 'CRITICAL_ABERRATION'
                          ? 'bg-rose-950/20'
                          : b.status === 'ELEVATED_ALERT'
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-sans font-bold text-white flex items-center gap-1.5">
                        {b.status === 'CRITICAL_ABERRATION' && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                        <span>{b.barangay}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-white">{b.currentCases}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">{b.rollingMean}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">&plusmn;{b.rollingStdDev}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-amber-300">{b.threshold2SD}</td>
                      <td
                        className={`px-3 py-2.5 text-right font-bold ${
                          b.zScore >= 2 ? 'text-rose-400' : b.zScore >= 1 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {b.zScore >= 0 ? `+${b.zScore}` : b.zScore}&sigma;
                      </td>
                      <td className="px-3 py-2.5">
                        {b.status === 'CRITICAL_ABERRATION' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse inline-flex items-center gap-1">
                            Critical (&gt;2 SD)
                          </span>
                        ) : b.status === 'ELEVATED_ALERT' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                            Alert (&gt;1 SD)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-sans text-[11px] text-slate-300">
                        {b.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SUB-VIEW: DR. ISIDRO C. KINTANAR MEMORIAL HOSPITAL SURGE & CAPACITY DEPLETION */}
      {activeSubView === 'hospital-surge' && (
        <section className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bed className="w-4 h-4 text-indigo-400" />
                  Isidro C. Kintanar Memorial Hospital (DICKMH) — Bed Surge &amp; Capacity Depletion Model
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dynamic simulation linking 2-SD outbreak velocity, pediatric attack rates, and hospital bed depletion horizons.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>DOH Level 1 District Hospital • Argao</span>
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans">Authorized vs Operational</span>
                <div className="text-lg font-bold text-white">25 / 50 Beds</div>
                <span className="text-[10px] text-slate-500 font-sans">Expandable to 100 in new Bogo facility</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-900/40 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans">Total Inpatients Admitted</span>
                <div className="text-lg font-bold text-amber-400">38 Inpatients</div>
                <span className="text-[10px] text-amber-300 font-sans">BOR: 152% (Auth) • 76% (Op)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-900/40 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans">Dengue Isolation Ward</span>
                <div className="text-lg font-bold text-rose-400">11 / 12 Occupied</div>
                <span className="text-[10px] text-rose-300 font-sans">91.7% Occupancy (Warning Level)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-900/40 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans">Depletion Horizon</span>
                <div className="text-lg font-bold text-purple-300">4.8 Days</div>
                <span className="text-[10px] text-purple-400 font-sans">Pre-referral corridor to Carcar / VSMMC</span>
              </div>
            </div>

            {/* Clinical Directives Summary Box */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-emerald-400" />
                  Mandated Clinical Operations (DOH AO No. 2016-0043):
                </span>
                <span className="font-mono text-cyan-400 font-bold">Fast-Lane TAT: 22 min</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 font-sans text-xs">
                <li><strong>24/7 Dengue Fast Lane:</strong> Dedicated stat complete blood count (CBC) and microhematocrit turnaround guaranteed under 30 minutes.</li>
                <li><strong>Pediatric Annex Overflow:</strong> Pediatric ward operating at 112.5% capacity (9/8 beds). Deploy additional pediatric observation cots in Bogo clinical wing.</li>
                <li><strong>Secondary Referral Standby:</strong> Severe dengue with refractory shock or respiratory distress to be expedited via One Hospital Command to Carcar Provincial Hospital (18 km) or VSMMC.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* SUB-VIEW 2: GEOSPATIAL & HOTSPOTS */}
      {activeSubView === 'geospatial' && (
        <section className="space-y-4">
          <GeoSpatialAnalysis
            municipalities={municipalities}
            barangays={barangays}
            selectedMunicipality={selectedMuni}
            selectedBarangay={selectedBrgy}
            onSelectMunicipality={setSelectedMuni}
            onSelectBarangay={setSelectedBrgy}
            records={records}
          />
        </section>
      )}

      {/* SUB-VIEW 3: DEMOGRAPHICS */}
      {activeSubView === 'demographics' && (
        <section className="space-y-4">
          <DemographicsAnalysis
            stats={demographics}
            totalCases={records.filter(r => !r.isDuplicate).length}
          />
        </section>
      )}

      {/* SUB-VIEW 4: ALERTS */}
      {activeSubView === 'alerts' && (
        <section className="space-y-4">
          <AlertsAndAberrations alerts={alerts} />
        </section>
      )}
    </div>
  );
};
