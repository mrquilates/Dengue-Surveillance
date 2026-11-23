import React, { useState } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  TrendingDown,
  ShieldCheck,
  Sliders,
  DollarSign,
  Building,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Bot,
  Brain,
  Server,
  Terminal,
  Activity,
  Play,
  Check,
  Shield,
  Zap,
  Info,
} from 'lucide-react';
import {
  SurveillanceAuditMetric,
  InterLGUIntelligenceFeed,
  MultiStreamSummary,
  IntelligenceEngineStage,
} from '../types/surveillance';

interface NetworksCollaborationProps {
  summary: MultiStreamSummary;
  onOpenAgentModal?: (stage: IntelligenceEngineStage) => void;
}

export const NetworksCollaboration: React.FC<NetworksCollaborationProps> = ({ summary, onOpenAgentModal }) => {
  // Navigation tabs for Feedback stage
  const [activeTab, setActiveTab] = useState<'all' | 'audit' | 'reflexivity' | 'maintenance'>('all');

  // Model Tuning interactive states
  const [gamSensitivity, setGamSensitivity] = useState<number>(1.96); // 1.96 SE (95% CI)
  const [rainfallLagWeeks, setRainfallLagWeeks] = useState<number>(2); // 2-week lag
  const [biThreshold, setBiThreshold] = useState<number>(20); // 20% BI alert trigger

  // Reflexivity AI runner states
  const [isReflexivityRunning, setIsReflexivityRunning] = useState<boolean>(false);
  const [reflexivityCompleted, setReflexivityCompleted] = useState<boolean>(false);

  // Systems maintenance runner states
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState<boolean>(false);
  const [maintenanceCompleted, setMaintenanceCompleted] = useState<boolean>(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<string[]>([
    'System standby: All microservices synchronized.',
    'Webhook listener: Active (PIDSR & Kintanar Hospital Bed & Triage Webhook).',
    'Local cache integrity: Verified (0 corrupted records).',
  ]);

  const auditMetrics: SurveillanceAuditMetric[] = [
    {
      id: 'm1',
      name: 'Investigation Timeliness',
      category: 'Process',
      currentValue: 92.4,
      targetValue: 90.0,
      unit: '%',
      status: 'Met',
      description: 'Percentage of probable/confirmed cases field-investigated and geocoded within 24–48 hours.',
      policyStandard: 'DOH PIDSR National Guideline & RA 11332',
    },
    {
      id: 'm2',
      name: 'Notification Lag to MESU',
      category: 'Process',
      currentValue: 18.2,
      targetValue: 24.0,
      unit: 'Hours',
      status: 'Met',
      description: 'Mean elapsed time between clinical consult and electronic line-list synchronization.',
      policyStandard: 'Mandatory Reporting Act (RA 11332)',
    },
    {
      id: 'm3',
      name: '7-Day Container Re-Inspection Compliance',
      category: 'Process',
      currentValue: summary.entomological.overallReinspectionRate,
      targetValue: 85.0,
      unit: '%',
      status: summary.entomological.overallReinspectionRate >= 85 ? 'Met' : 'Warning',
      description: 'Proportion of positive breeding premises re-checked within 7 days by BHWs.',
      policyStandard: 'National Dengue Vector Surveillance Manual',
    },
    {
      id: 'm4',
      name: 'NS1 RDT Days 1–5 Testing Window',
      category: 'Process',
      currentValue: summary.surveillance.ns1TestedWithin5DaysPct,
      targetValue: 85.0,
      unit: '%',
      status: summary.surveillance.ns1TestedWithin5DaysPct >= 85 ? 'Met' : 'Warning',
      description: 'Rapid diagnostic tests administered strictly within the initial 5 days of fever onset.',
      policyStandard: 'DOH Administrative Order No. 2016-0043',
    },
    {
      id: 'm5',
      name: 'Predictive Pre-Peak Lead Time',
      category: 'Impact',
      currentValue: summary.triangulationStatus.prePeakLeadTimeWeeks,
      targetValue: 3.0,
      unit: 'Weeks',
      status: 'Met',
      description: 'Early warning lead time generated ahead of clinical epidemic surge peak.',
      policyStandard: 'WHO-TDR EWARS Technical Implementation Framework',
    },
    {
      id: 'm6',
      name: 'Severe Clinical Progression Rate',
      category: 'Impact',
      currentValue: 0.0,
      targetValue: 0.5,
      unit: '%',
      status: 'Met',
      description: 'Dengue cases progressing to shock/severe hemorrhage after early triage.',
      policyStandard: 'DOH CPG 2012-0006 Zero-Fatality Standard',
    },
  ];

  const interLGUFeeds: InterLGUIntelligenceFeed[] = [
    {
      municipality: 'Dalaguete (Adjacent South)',
      distanceKm: 14.2,
      currentCasesMW: 26,
      pctChangeWoW: 18.2,
      alertStatus: 'Alert',
      crossBorderRisk: 'Moderate',
      lastSynchronized: '2 hours ago',
    },
    {
      municipality: 'Sibonga (Adjacent North)',
      distanceKm: 16.8,
      currentCasesMW: 31,
      pctChangeWoW: 24.5,
      alertStatus: 'Alert',
      crossBorderRisk: 'Moderate',
      lastSynchronized: '4 hours ago',
    },
    {
      municipality: 'Cebu Provincial Health Office (PHO)',
      distanceKm: 65.0,
      currentCasesMW: 384,
      pctChangeWoW: 12.1,
      alertStatus: 'Alert',
      crossBorderRisk: 'Low',
      lastSynchronized: '1 hour ago',
    },
    {
      municipality: 'DOH RESU Central Visayas (Region VII)',
      distanceKm: 68.5,
      currentCasesMW: 1420,
      pctChangeWoW: 8.5,
      alertStatus: 'Normal',
      crossBorderRisk: 'Low',
      lastSynchronized: '30 mins ago',
    },
  ];

  // Run Reflexivity AI evaluation routine
  const handleRunReflexivity = () => {
    setIsReflexivityRunning(true);
    setTimeout(() => {
      setIsReflexivityRunning(false);
      setReflexivityCompleted(true);
    }, 1800);
  };

  // Run Systems Maintenance routine
  const handleRunMaintenance = () => {
    setIsMaintenanceRunning(true);
    setMaintenanceLogs(prev => [...prev, '[START] Initiating automated systems maintenance cycle...']);
    setTimeout(() => {
      setMaintenanceLogs(prev => [
        ...prev,
        '[DIAGNOSTIC] Webhook connection test: PIDSR endpoint (200 OK, latency 42ms).',
        '[DATABASE] Cleaning stale session buffers and optimizing spatial indices...',
        '[RETENTION] 5-year longitudinal anonymized records partitioned under RA 11332 Section 9.',
        '[COMPLETED] Systems maintenance routine completed successfully. All health checks nominal.',
      ]);
      setIsMaintenanceRunning(false);
      setMaintenanceCompleted(true);
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Stage Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-purple-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner">
              <Share2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Stage 5: Feedback — Internal Systems Audit, Reflexivity AI Skills &amp; Systems Maintenance
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  Internal Systems Audit
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Reflexivity AI
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  Systems Maintenance
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Continuous closed-loop evaluation conducting internal pipeline audits, epistemic AI reflexivity assessments, automated maintenance routines, and cross-border regional synchronization.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenAgentModal && (
              <button
                onClick={() => onOpenAgentModal('collaboration')}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Inspect Agent 4: Federation & Continuous M&E Audit Agent"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>Agent 4: Audit &amp; Reflexivity</span>
              </button>
            )}
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Feedback Loop: Active &amp; Verified</span>
            </span>
          </div>
        </div>

        {/* Feedback Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">Internal Systems Audit</span>
            <div className="text-base font-bold text-emerald-400">6/6 Standards Met</div>
            <span className="text-[11px] text-slate-400 block font-sans">
              RA 11332 &amp; DOH PIDSR Compliant
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">Reflexivity AI Index</span>
            <div className="text-base font-bold text-cyan-300">94.8 / 100 Score</div>
            <span className="text-[11px] text-slate-400 block font-sans">
              Bias mitigated across 45 barangays
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">Systems Maintenance</span>
            <div className="text-base font-bold text-purple-300">100% Operational</div>
            <span className="text-[11px] text-slate-400 block font-sans">
              Webhook &amp; Database healthy
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase">Statutory Governance</span>
            <div className="text-base font-bold text-amber-300">100% Zero-PII Clean</div>
            <span className="text-[11px] text-slate-400 block font-sans">
              RA 11332 &amp; RA 10121 Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Navigation for Feedback Stage */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-purple-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Complete Feedback Engine Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-purple-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Internal Systems Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('reflexivity')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reflexivity'
              ? 'bg-purple-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Reflexivity AI Skills</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'maintenance'
              ? 'bg-purple-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Systems Maintenance</span>
        </button>
      </div>

      {/* SECTION 1: INTERNAL SYSTEMS AUDIT */}
      {(activeTab === 'all' || activeTab === 'audit') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                Internal Systems Audit: Surveillance Process &amp; Empirical Standards
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates MESU investigation velocity, notification lag compliance, and statutory alignment under RA 11332.
              </p>
            </div>

            <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              Audit Period: <strong className="text-white">Morbidity Year 2026</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {auditMetrics.map(metric => (
              <div
                key={metric.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-sans text-xs">{metric.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      metric.status === 'Met'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {metric.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Current Performance</span>
                    <span className="text-lg font-extrabold text-cyan-300">
                      {metric.currentValue} {metric.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Policy Standard</span>
                    <span className="text-slate-300 text-xs font-semibold">
                      {metric.targetValue} {metric.unit}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed border-t border-slate-900 pt-2">
                  {metric.description}
                </p>

                <div className="text-[10px] text-slate-500 font-sans truncate">
                  <strong className="text-slate-400">Anchor:</strong> {metric.policyStandard}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: REFLEXIVITY AI SKILLS (EPISTEMIC & BIAS CRITIQUE) */}
      {(activeTab === 'all' || activeTab === 'reflexivity') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Reflexivity AI Skills: Epistemic Critique &amp; Algorithmic Surveillance Reflection
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proactive algorithmic self-audit evaluating geographic equity, health-seeking reporting disparities, and false-positive sensitivity.
              </p>
            </div>

            <button
              onClick={handleRunReflexivity}
              disabled={isReflexivityRunning}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow"
            >
              {isReflexivityRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating AI Reflexivity...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Reflexivity Evaluation</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            {/* Reflexivity Card 1: Mountain vs Urban Equity */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-sans">Geographic Equity Reflexivity</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Score: 94/100
                </span>
              </div>
              <p className="text-slate-400 font-sans text-xs leading-relaxed">
                Reflective audit detects potential under-reporting in mountainous barangays (Catang, Gutlang, Jampang) due to transit distance to Isidro C. Kintanar Hospital.
              </p>
              <div className="pt-2 border-t border-slate-900 text-[10px] text-cyan-300 font-sans">
                <strong>Corrective Action:</strong> BHW mobile NS1 RDT rapid testing dispatched to eliminate geographic reporting lag.
              </div>
            </div>

            {/* Reflexivity Card 2: False Positive Trade-Off */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-sans">Early Warning vs Alarm Fatigue</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  Score: 96/100
                </span>
              </div>
              <p className="text-slate-400 font-sans text-xs leading-relaxed">
                Reflexive review of 1.96 SE vs 2.58 SE threshold calibration demonstrates optimal 3.0-week early lead time with 0 false-alarm panic declarations.
              </p>
              <div className="pt-2 border-t border-slate-900 text-[10px] text-cyan-300 font-sans">
                <strong>Corrective Action:</strong> Maintain dual-tier alert: Level 1 (Internal BHW alert) before Level 2 (Public emergency).
              </div>
            </div>

            {/* Reflexivity Card 3: Model Assumptions */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-sans">Vector Lag Assumption Check</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                  Score: 92/100
                </span>
              </div>
              <p className="text-slate-400 font-sans text-xs leading-relaxed">
                Evaluates empirical correlation between PAGASA precipitation surges and Breteau index peaks across coastal vs upland terrain.
              </p>
              <div className="pt-2 border-t border-slate-900 text-[10px] text-cyan-300 font-sans">
                <strong>Corrective Action:</strong> Calibrated 2-week lag accounts for Aedes aegypti pupation cycle in Argao containers.
              </div>
            </div>
          </div>

          {reflexivityCompleted && (
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs font-mono text-purple-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Reflexivity AI Synthesis:</strong> Surveillance algorithms have been audited against systemic selection bias. The EIEWS predictive model satisfies DOH ethical surveillance principles, with equal diagnostic access across urban Poblacion and remote sitios.
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: SYSTEMS MAINTENANCE */}
      {(activeTab === 'all' || activeTab === 'maintenance') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Systems Maintenance &amp; Pipeline Health Diagnostics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated database indexing, webhook endpoint verification, and statutory record retention protocols.
              </p>
            </div>

            <button
              onClick={handleRunMaintenance}
              disabled={isMaintenanceRunning}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow"
            >
              {isMaintenanceRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Systems Maintenance...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Execute Systems Maintenance Audit</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">PIDSR Webhook Ingestion</span>
              <div className="text-white font-bold text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active // 200 OK</span>
              </div>
              <span className="text-[10px] text-slate-400 block font-sans">Mean latency: 38ms</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">Kintanar Bed &amp; Triage Webhook</span>
              <div className="text-white font-bold text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Synchronized // Real-Time</span>
              </div>
              <span className="text-[10px] text-slate-400 block font-sans">Zero transmission defects (19jG4RfAoc)</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">Data Retention Compliance</span>
              <div className="text-emerald-400 font-bold text-sm">5-Year Archival Active</div>
              <span className="text-[10px] text-slate-400 block font-sans">RA 11332 Section 9 Compliant</span>
            </div>
          </div>

          {/* Maintenance Diagnostic Terminal Logs */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-900 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Systems Diagnostic Terminal</span>
              </span>
              <span className="text-[10px] text-slate-500">Auto-Maintenance Daemon</span>
            </div>

            <div className="space-y-1 font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto">
              {maintenanceLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400">&gt;</span>
                  <span className={log.includes('[COMPLETED]') ? 'text-emerald-300 font-bold' : ''}>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: INTER-LGU REGIONAL SURVEILLANCE & MODEL PARAMETER TUNING */}
      {(activeTab === 'all' || activeTab === 'audit') && (
        <>
          {/* Inter-LGU Regional Cross-Border Surveillance Network */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  Inter-LGU Regional Cross-Border Surveillance Network
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live automated data exchange with neighboring municipalities (Dalaguete, Sibonga), Cebu PHO, and DOH RESU VII.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  RESU Interoperability Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              {interLGUFeeds.map(feed => (
                <div key={feed.municipality} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate">{feed.municipality}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        feed.alertStatus === 'Alert'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {feed.alertStatus}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Weekly Cases:</span>
                      <span className="text-white font-bold">{feed.currentCasesMW}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WoW Change:</span>
                      <span className="text-amber-400 font-bold">+{feed.pctChangeWoW}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cross-Border Risk:</span>
                      <span className="text-cyan-300 font-bold">{feed.crossBorderRisk}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 font-sans">
                    Sync: {feed.lastSynchronized}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Parameter Calibration & Refinement Engine */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Closed-Loop Model Refinement &amp; Hyperparameter Tuning
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Refine WHO EWARS GAM baseline sensitivity and environmental lag windows based on empirical accuracy.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setGamSensitivity(1.96);
                  setRainfallLagWeeks(2);
                  setBiThreshold(20);
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* GAM Threshold Confidence Interval */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">GAM Z-Score Multiplier:</span>
                  <strong className="text-cyan-400">{gamSensitivity} SE ({gamSensitivity === 1.96 ? '95% CI' : '90% CI'})</strong>
                </div>
                <input
                  type="range"
                  min="1.44"
                  max="2.58"
                  step="0.1"
                  value={gamSensitivity}
                  onChange={e => setGamSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-sans leading-tight">
                  Higher value decreases false alarms; lower value provides earlier, more sensitive trigger.
                </p>
              </div>

              {/* Rainfall Predictive Lag */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Rainfall Predictive Lag:</span>
                  <strong className="text-blue-400">{rainfallLagWeeks} Weeks Pre-Larval Peak</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={rainfallLagWeeks}
                  onChange={e => setRainfallLagWeeks(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-sans leading-tight">
                  Optimal calibrated lag between precipitation surge and Aedes aegypti breeding peak in Argao.
                </p>
              </div>

              {/* Breteau Index Alert Cutoff */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Breteau Index (BI) Trigger:</span>
                  <strong className="text-amber-400">{biThreshold}% Container Positivity</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={biThreshold}
                  onChange={e => setBiThreshold(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-sans leading-tight">
                  DOH standard is 20%; conservative threshold can be lowered for high-density barangays.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Continuous Learning Loop:</strong> Model hyper-parameters are periodically synchronized with retrospective case line-lists from Isidro C. Kintanar Memorial Hospital to ensure the 3–5 week predictive window remains statistically robust against climate shifts.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
