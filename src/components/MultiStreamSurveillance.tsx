import React, { useState, useMemo } from 'react';
import {
  Activity,
  CloudRain,
  Bug,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Thermometer,
  Droplets,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  FileText,
  Compass,
  AlertOctagon,
  ShieldCheck,
  Zap,
  Webhook,
} from 'lucide-react';
import { SurveillanceRecord } from '../types/surveillance';
import {
  calculateMultiStreamSurveillance,
  getMultiStreamTimeline,
} from '../utils/epidemiology';

interface MultiStreamSurveillanceProps {
  records: SurveillanceRecord[];
  selectedDisease: string;
}

type TriangulationTab = 'triangulation' | 'surveillance' | 'environment' | 'entomological';

export const MultiStreamSurveillance: React.FC<MultiStreamSurveillanceProps> = ({
  records,
  selectedDisease,
}) => {
  const [activeTab, setActiveTab] = useState<TriangulationTab>('triangulation');
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  const summary = useMemo(() => {
    return calculateMultiStreamSurveillance(records);
  }, [records]);

  const timeline = useMemo(() => {
    return getMultiStreamTimeline(records);
  }, [records]);

  const { surveillance, environment, entomological, triangulationStatus } = summary;

  return (
    <div className="space-y-6">
      {/* Top Banner: Multi-Modal Stream Surveillance Components for Triangulation */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Multi-Modal Stream Surveillance Triangulation Engine
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Argao, Cebu EWARS
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Morbidity Week {summary.latestMorbidityWeek}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Triangulates 3 official intelligence streams: <strong className="text-slate-200">1. Online PIDSR Surveillance</strong>, <strong className="text-slate-200">2. Environmental Hazard Assessment (HIRA)</strong>, and <strong className="text-slate-200">3. Larval Entomological Confirmation</strong>.
              </p>
            </div>
          </div>

          {/* Triangulation Confidence Status */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 px-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-slate-400">Triangulation Confidence:</span>
              <strong className="text-white font-bold">{triangulationStatus.triangulationConfidenceScore}%</strong>
              <span className="text-[10px] text-cyan-400 font-sans">
                ({[triangulationStatus.surveillanceTriggered, triangulationStatus.environmentHazardTriggered, triangulationStatus.larvalConfirmationTriggered].filter(Boolean).length}/3 Streams Positive)
              </span>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                triangulationStatus.overallAlertTier === 'Red'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-950/30'
                  : triangulationStatus.overallAlertTier === 'Yellow'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {triangulationStatus.overallAlertTier === 'Red' ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>RED TIER: EPIDEMIC ACTION</span>
                </>
              ) : triangulationStatus.overallAlertTier === 'Yellow' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>YELLOW TIER: EARLY WARNING</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>GREEN TIER: ROUTINE BASELINE</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* 3 Core Triangulation Components Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs font-mono">
          {/* 1. Surveillance: PIDSR */}
          <div
            onClick={() => setActiveTab('surveillance')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'surveillance'
                ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-bold text-cyan-400 font-sans">
                <Activity className="w-4 h-4" /> 1. Surveillance: Online PIDSR
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  triangulationStatus.surveillanceTriggered
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {triangulationStatus.surveillanceTriggered ? 'Triggered' : 'Normal'}
              </span>
            </div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Reported Cases:</span>
                <span className="text-white font-bold">{surveillance.totalCases} verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">NS1 Days 1–5 Compliance:</span>
                <span className="text-emerald-400 font-bold">{surveillance.ns1TestedWithin5DaysPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Notification Lag:</span>
                <span className="text-cyan-300 font-bold">&lt; {surveillance.reportingDelayDays} days</span>
              </div>
            </div>
          </div>

          {/* 2. Environment: HIRA */}
          <div
            onClick={() => setActiveTab('environment')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'environment'
                ? 'bg-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-bold text-blue-400 font-sans">
                <CloudRain className="w-4 h-4" /> 2. Environment: HIRA Report
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  triangulationStatus.environmentHazardTriggered
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {triangulationStatus.environmentHazardTriggered ? 'High Hazard' : 'Low Hazard'}
              </span>
            </div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Weekly Rainfall:</span>
                <span className="text-white font-bold">{environment.currentRainfallMm} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">2-Wk Lagged Precip:</span>
                <span className="text-amber-300 font-bold">{environment.twoWeekLagRainfallMm} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Flooding Vulnerability:</span>
                <span className="text-blue-300 font-bold">{environment.floodingVulnerabilityScore}/100</span>
              </div>
            </div>
          </div>

          {/* 3. Entomological Confirmation: Larval Report */}
          <div
            onClick={() => setActiveTab('entomological')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'entomological'
                ? 'bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-bold text-amber-400 font-sans">
                <Bug className="w-4 h-4" /> 3. Entomological: Larval Report
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  triangulationStatus.larvalConfirmationTriggered
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {triangulationStatus.larvalConfirmationTriggered ? 'Triggered (BI≥20%)' : 'Controlled'}
              </span>
            </div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Breteau Index (BI):</span>
                <span
                  className={`font-bold ${
                    entomological.biAlertThresholdExceeded ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {entomological.averageBreteauIndex}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">House Index (HI):</span>
                <span
                  className={`font-bold ${
                    entomological.hiAlertThresholdExceeded ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {entomological.averageHouseIndex}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">7-Day Recheck Compliance:</span>
                <span className="text-emerald-400 font-bold">{entomological.overallReinspectionRate}% (Target ≥85%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Triangulation Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('triangulation')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'triangulation'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Triangulation Synthesis Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('surveillance')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'surveillance'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>1. Surveillance (Online PIDSR Report)</span>
        </button>

        <button
          onClick={() => setActiveTab('environment')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'environment'
              ? 'bg-blue-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>2. Environment (HIRA Report)</span>
        </button>

        <button
          onClick={() => setActiveTab('entomological')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'entomological'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          <span>3. Entomological Confirmation (Larval Report)</span>
        </button>
      </div>

      {/* TAB 1: TRIANGULATION SYNTHESIS MATRIX */}
      {activeTab === 'triangulation' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Tri-Pillar Cross-Stream Convergence Analysis
                </h3>
                <p className="text-xs text-slate-400">
                  Triangulates epidemiological volume, environmental flooding hazards, and larval indices to validate transmission risk with a 3–5 week predictive lead time.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Rain (mm)
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Breteau Index (BI %)
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> PIDSR Cases
                </span>
              </div>
            </div>

            {/* Synchronized Weekly Timeline Visualizer */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {timeline.map(point => {
                const isHovered = hoveredWeek === point.morbidityWeek;
                return (
                  <div
                    key={point.morbidityWeek}
                    onMouseEnter={() => setHoveredWeek(point.morbidityWeek)}
                    onMouseLeave={() => setHoveredWeek(null)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-800 border-cyan-500 shadow-lg scale-105'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold font-mono text-white">MW {point.morbidityWeek}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          point.multiStreamRiskLevel === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : point.multiStreamRiskLevel === 'High'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {point.multiStreamRiskLevel}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Env Rain:</span>
                          <span className="text-blue-300 font-bold">{point.rainfallMm} mm</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (point.rainfallMm / 180) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Larval BI:</span>
                          <span
                            className={`font-bold ${
                              point.breteauIndex >= 20 ? 'text-rose-400' : 'text-amber-300'
                            }`}
                          >
                            {point.breteauIndex}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className={`h-full rounded-full ${
                              point.breteauIndex >= 20 ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, (point.breteauIndex / 30) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>PIDSR:</span>
                          <span className="text-cyan-300 font-bold">{point.clinicalCases} cases</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, (point.clinicalCases / 15) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Triangulation Diagnostic Convergence Box */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">
                  Cross-Stream Predictive Lead Time
                </span>
                <div className="text-lg font-bold text-white font-mono flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{triangulationStatus.prePeakLeadTimeWeeks} Weeks Prior to Epidemic Peak</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Atmospheric rainfall surge (MW 29) + confirmed Breteau Index &ge; 20% (MW 30) accurately signaled case acceleration in MW 33–34.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">
                  Triangulation Decision Directive
                </span>
                <div className="text-lg font-bold text-amber-400 font-mono flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>{triangulationStatus.actionPriority}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Pre-positioning of NS1 RDT kits, oral rehydration salts, and IV fluids at RHU I, RHU II, and BHW stations across high-risk barangays.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">
                  Empirical Vector Constraint
                </span>
                <div className="text-lg font-bold text-rose-400 font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Pyrethroid kdr Resistance</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Mutations V1016I &amp; F1534C render routine thermal fogging ineffective. Operations must enforce manual larval source reduction and targeted larviciding.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 1. SURVEILLANCE: EPIDEMIOLOGICAL ANALYSIS REPORT FROM ONLINE PIDSR SYSTEM */}
      {activeTab === 'surveillance' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Component 1: Surveillance — Epidemiological Analysis Report (Online PIDSR System)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Philippine Integrated Disease Surveillance and Response (PIDSR) verified case line-lists and clinical diagnostics triage.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold flex items-center gap-1">
                    <Webhook className="w-3 h-3 text-cyan-400" />
                    <span>Webhook: https://pidsr.doh.gov.ph/pidsr/data_extraction</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold">
                    Data Management: RA 10173 Zero-PII • ACID Dedup
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-bold">
                    Data Analytics: 3-Sigma Outliers • DOH AO 2016-0043
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Notification Lag: <strong className="text-emerald-400">&lt; {surveillance.reportingDelayDays} days</strong>
                </span>
                <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  DOH AO 2016-0043 (Days 1–5): <strong className="text-cyan-400">{surveillance.ns1TestedWithin5DaysPct}%</strong>
                </span>
              </div>
            </div>

            {/* Official PIDSR Classification Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Case Volume</span>
                <span className="text-xl font-bold text-white">{surveillance.totalCases}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Logged in Argao Catchment</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Suspected Cases</span>
                <span className="text-xl font-bold text-slate-300">{surveillance.suspectedCases}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Acute fever &ge; 2 days + warning signs</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Probable (NS1 RDT +)</span>
                <span className="text-xl font-bold text-amber-400">{surveillance.probableCases}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Rapid Diagnostic Test Confirmed</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Confirmed Cases</span>
                <span className="text-xl font-bold text-cyan-400">{surveillance.confirmedCases}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">PCR / IgM Serology Positive</span>
              </div>
            </div>

            {/* Reporting Facilities Network */}
            <div className="rounded-xl border border-slate-800 overflow-hidden mb-4">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5 font-sans">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Primary Reporting Facilities in Argao MESU Network
                </span>
                <span className="text-[11px] text-slate-400 font-mono">PIDSR Electronic Synchronization</span>
              </div>
              <div className="divide-y divide-slate-800/80 bg-slate-950/60 font-mono text-xs">
                {surveillance.reportingFacilities.map(fac => (
                  <div key={fac.name} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white">{fac.name}</div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        {fac.type === 'Hospital'
                          ? 'Secondary Referral Hospital (Surge bed preparation & severe triage)'
                          : 'Rural Health Unit (Primary triage, NS1 RDT administration strictly within days 1–5)'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Cases</span>
                        <span className="text-cyan-300 font-bold">{fac.casesReported}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Timeliness</span>
                        <span className="text-emerald-400 font-bold">{fac.timelyReportingPct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">DOH Administrative Order No. 2016-0043 Standard:</strong> Dengue NS1 RDT must be administered strictly within days 1–5 of fever onset. Early diagnostic confirmation at RHU I &amp; RHU II prevents progression to severe plasma leakage and minimizes delayed referrals to Isidro C. Kintanar Memorial Hospital.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 2. ENVIRONMENT: HAZARD IDENTIFICATION AND RISK ASSESSMENT (HIRA) REPORT */}
      {activeTab === 'environment' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  Component 2: Environment — Hazard Identification &amp; Risk Assessment (HIRA) Report
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Micro-environmental hazard profiling, flood-stagnation vulnerabilities, and automated weather station telemetry.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Drainage Risk: <strong className="text-rose-400">{environment.drainageBlockageRisk}</strong>
                </span>
                <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Climate Suitability: <strong className="text-blue-400">{environment.climateRiskTier}</strong>
                </span>
              </div>
            </div>

            {/* Environmental Weather Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span className="font-sans">Current Weekly Rain</span>
                </div>
                <div className="text-xl font-bold text-white">{environment.currentRainfallMm} mm</div>
                <div className="text-[10px] text-slate-500">Cumulative precip</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-sans">2-Week Lagged Rain</span>
                </div>
                <div className="text-xl font-bold text-amber-300">{environment.twoWeekLagRainfallMm} mm</div>
                <div className="text-[10px] text-slate-500">Key larval hatching trigger</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Droplets className="w-3.5 h-3.5" />
                  <span className="font-sans">Relative Humidity</span>
                </div>
                <div className="text-xl font-bold text-cyan-300">{environment.meanRelativeHumidityPct}%</div>
                <div className="text-[10px] text-slate-500">Aedes survival threshold &gt;75%</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span className="font-sans">Ambient Temperature</span>
                </div>
                <div className="text-xl font-bold text-rose-300">{environment.meanTemperatureCelsius}&deg;C</div>
                <div className="text-[10px] text-slate-500">Extrinsic incubation window</div>
              </div>
            </div>

            {/* Localized Hazard Identification Registry */}
            <div className="rounded-xl border border-slate-800 overflow-hidden mb-4">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  High-Risk Environmental Hazard Zones Identified in Argao
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Field Inspection Grounding</span>
              </div>
              <div className="divide-y divide-slate-800/80 bg-slate-950/60 font-mono text-xs">
                {environment.highRiskZones.map((zone, idx) => (
                  <div key={idx} className="p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{zone.zone}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold ${
                            zone.severity === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : zone.severity === 'High'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {zone.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Environmental Hazard: <strong className="text-slate-300">{zone.hazardType}</strong>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-300 font-sans bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                      <strong>Directive:</strong> {zone.actionRequired}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">DRRM-H Legal Anchor (RA 10121):</strong> 70% pre-disaster allocation of the Local Disaster Risk Reduction and Management Fund (LDRRMF) is legally leveraged for predictive surveillance, culvert desilting, and pre-disaster vector suppression, preventing post-disaster vector surges (as documented during secondary epidemics after Typhoon Odette).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 3. ENTOMOLOGICAL CONFIRMATION: LARVAL ENTOMOLOGICAL REPORT */}
      {activeTab === 'entomological' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bug className="w-4 h-4 text-amber-400" />
                  Component 3: Entomological Confirmation — Larval Entomological Report
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Physical household container inspections measuring Breteau Index (BI) and House Index (HI) without ovitraps.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Inspected: <strong className="text-white">{entomological.totalInspectedHouses} Houses</strong>
                </span>
                <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Pos. Containers: <strong className="text-amber-400">{entomological.totalPositiveContainers}</strong>
                </span>
              </div>
            </div>

            {/* Pyrethroid kdr Resistance Restriction Alert Banner */}
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 mb-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-rose-300 uppercase tracking-wide">
                  Official Vector Control Directive: Thermal Fogging Restriction
                </div>
                <div className="text-rose-200/90 mt-0.5 leading-relaxed font-sans">
                  {entomological.thermalFoggingRestrictionNote} Documented voltage-gated sodium channel (<em className="font-mono">kdr</em>) mutations <strong className="font-mono text-white">V1016I</strong> and <strong className="font-mono text-white">F1534C</strong> render routine space spraying biologically counterproductive. Enforce DepEd-DOH OKD-HLI school sweeps and household source reduction.
                </div>
              </div>
            </div>

            {/* Standard Epidemiological Indices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Breteau Index (BI)</span>
                <span
                  className={`text-xl font-bold ${
                    entomological.biAlertThresholdExceeded ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {entomological.averageBreteauIndex}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Threshold: &lt;20% safe / &ge;20% alert</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">House Index (HI)</span>
                <span
                  className={`text-xl font-bold ${
                    entomological.hiAlertThresholdExceeded ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {entomological.averageHouseIndex}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Threshold: &lt;5% safe / &ge;5% alert</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Container Index (CI)</span>
                <span className="text-xl font-bold text-cyan-300">
                  {entomological.averageContainerIndex}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Pos. containers / inspected</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">7-Day Recheck Rate</span>
                <span className="text-xl font-bold text-emerald-400">
                  {entomological.overallReinspectionRate}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Target: &ge; 85% compliance</span>
              </div>
            </div>

            {/* Granular Barangay Inspection Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 mb-4">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Barangay</th>
                    <th className="py-2.5 px-3">Houses Inspected</th>
                    <th className="py-2.5 px-3">Pos. Houses</th>
                    <th className="py-2.5 px-3">Breteau Index (BI)</th>
                    <th className="py-2.5 px-3">House Index (HI)</th>
                    <th className="py-2.5 px-3">7-Day Recheck</th>
                    <th className="py-2.5 px-3">Predominant Breeding Site</th>
                    <th className="py-2.5 px-3">Risk Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                  {entomological.barangayIndices.map(b => (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {b.barangay}
                      </td>
                      <td className="py-2 px-3 text-slate-300">{b.inspectedHouses}</td>
                      <td className="py-2 px-3 text-slate-300">{b.positiveHouses}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-bold ${
                            b.breteauIndex >= 20 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {b.breteauIndex}%
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-bold ${
                            b.houseIndex >= 5 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {b.houseIndex}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{b.containerReinspectionRate}%</td>
                      <td className="py-2 px-3 text-slate-300">{b.predominantBreedingSite}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            b.riskStatus === 'High-Risk'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : b.riskStatus === 'Warning'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {b.riskStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Predominant Breeding Habitats Distribution */}
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase block mb-2 font-mono">
                Confirmed Active Larval Habitats Breakdown in Argao
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
                {entomological.topBreedingSites.map(site => (
                  <div key={site.category} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400 block text-[11px] truncate">{site.category}</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                      {site.count} sites <span className="text-amber-400 text-xs font-normal">({site.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
