import React, { useState } from 'react';
import {
  Database,
  Upload,
  FileSpreadsheet,
  Activity,
  CloudRain,
  Bug,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  FileText,
  Filter,
  Sparkles,
  Bot,
  Webhook,
  BarChart3,
  Globe,
  Radio,
  Bed,
} from 'lucide-react';
import {
  SurveillanceRecord,
  MultiStreamSummary,
  ValidationReport,
  IntelligenceEngineStage,
} from '../types/surveillance';
import { LineListTable } from './LineListTable';
import { MultiStreamSurveillance } from './MultiStreamSurveillance';
import { PIDSRWebhookPanel } from './PIDSRWebhookPanel';
import { DataManagementSkillsView } from './DataManagementSkillsView';
import { DataAnalyticsSkillsView } from './DataAnalyticsSkillsView';
import { WebhookSpecialistAgentView } from './WebhookSpecialistAgentView';
import { HospitalBedSurveillanceView } from './HospitalBedSurveillanceView';
import { IngestionBottleneckAgent } from './IngestionBottleneckAgent';

interface IngestionHubProps {
  records: SurveillanceRecord[];
  summary: MultiStreamSummary;
  validationReport: ValidationReport;
  selectedDisease: string;
  onOpenUpload: () => void;
  onOpenAgentModal?: (stage: IntelligenceEngineStage) => void;
  onIngestCSV?: (csvText: string, filename: string, mode?: 'replace' | 'append') => void;
  onSelectStage?: (stage: IntelligenceEngineStage) => void;
  onOpenReportModal?: () => void;
}

export const IngestionHub: React.FC<IngestionHubProps> = ({
  records,
  summary,
  validationReport,
  selectedDisease,
  onOpenUpload,
  onOpenAgentModal,
  onIngestCSV,
  onSelectStage,
  onOpenReportModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'bottleneck-agent' | 'multimodal' | 'kintanar-beds' | 'webhook' | 'webhook-specialist' | 'datamanagement' | 'dataanalytics' | 'linelist' | 'quality'
  >('bottleneck-agent');

  const activeRecords = records.filter(r => !r.isDuplicate);

  return (
    <div className="space-y-6">
      {/* Stage Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-blue-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Stage 1: Ingestion — Data Collection &amp; Interoperability Hub
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                  Multi-Modal Ingestion
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  DOH Interoperable Standards
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ingests multi-source data and laboratory signals utilizing global tool marketplaces and interoperable PIDSR formats.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenAgentModal && (
              <>
                <button
                  onClick={() => onOpenAgentModal('ingestion')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Inspect Agent 1: Ingestion & Privacy Guardian Agent"
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Agent 1: Privacy Guardian</span>
                </button>
                <button
                  onClick={() => onOpenAgentModal('webhook' as any)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Inspect Agent WH: PIDSR Webhook & Data Pipeline Optimization Agent"
                >
                  <Webhook className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Agent WH: Webhook Optimizer</span>
                </button>
              </>
            )}
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest Batch Dataset</span>
            </button>
          </div>
        </div>

        {/* Multi-Stream Ingestion Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Stream 1: PIDSR Registry</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Online Sync
              </span>
            </div>
            <div className="text-lg font-bold text-white">{activeRecords.length} Records Verified</div>
            <span className="text-[10px] text-slate-500 font-sans block">
              DOH AO 2016-0043 NS1 compliance: {summary.surveillance.ns1TestedWithin5DaysPct}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Stream 2: Environmental HIRA</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                AWS Active
              </span>
            </div>
            <div className="text-lg font-bold text-blue-300">{summary.environment.currentRainfallMm} mm / Wk</div>
            <span className="text-[10px] text-slate-500 font-sans block">
              2-Week Lagged Precipitation: {summary.environment.twoWeekLagRainfallMm} mm
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Stream 3: Larval Surveys</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                Field BHWs
              </span>
            </div>
            <div className="text-lg font-bold text-amber-300">
              BI: {summary.entomological.averageBreteauIndex}%
            </div>
            <span className="text-[10px] text-slate-500 font-sans block">
              {summary.entomological.totalInspectedHouses} Houses Physical Inspection
            </span>
          </div>
        </div>

        {/* Dedicated Online PIDSR (pidsr.doh.gov.ph) Ingestion Gateway */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-blue-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Online PIDSR Case Aggregator Gateway
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  Official Portal
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Ready to ingest and harmonize aggregated case line lists exported from the national DOH PIDSR platform (
                <a
                  href="https://pidsr.doh.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-mono hover:underline font-semibold"
                >
                  https://pidsr.doh.gov.ph/
                </a>
                ).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[11px] text-slate-400 font-mono">
                <span>Auto-mapped headers:</span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">EPIID</span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">Date of Onset</span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">Age &amp; Sex</span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">PSGC Codes</span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">Case Classification</span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">Outcome</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Line-List (Excel, CSV, ODS)</span>
            </button>
          </div>
        </div>

        {/* Data Privacy (RA 10173) & DOH AO 2016-0043 Case Classification Summary */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                DOH AO No. 2016-0043 Case Classification &amp; Data Privacy Protocol
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                RA 10173 Compliant
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Auto-Classified upon Ingestion • Names Purged
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Confirmed */}
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-900/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400">Confirmed Dengue</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {((activeRecords.filter(r => r.caseClassification === 'Confirmed').length / (activeRecords.length || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {activeRecords.filter(r => r.caseClassification === 'Confirmed').length} Cases
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Lab-confirmed (Positive NS1 in Days 1–5, RT-PCR, or viral isolation)
              </p>
            </div>

            {/* Probable */}
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-900/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-400">Probable Dengue</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {((activeRecords.filter(r => r.caseClassification === 'Probable').length / (activeRecords.length || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {activeRecords.filter(r => r.caseClassification === 'Probable').length} Cases
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Acute fever 2–7d + warning signs, single IgM positive, or admitted
              </p>
            </div>

            {/* Suspect */}
            <div className="p-3 rounded-lg bg-slate-950 border border-blue-900/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-400">Suspected Dengue</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                  {((activeRecords.filter(r => r.caseClassification === 'Suspect').length / (activeRecords.length || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {activeRecords.filter(r => r.caseClassification === 'Suspect').length} Cases
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Acute febrile illness pending diagnostic confirmation
              </p>
            </div>

            {/* Privacy Protection Summary */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-300">Data Privacy (RA 10173)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                  Protected
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200 font-mono">
                0 PII Columns Stored
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                First Name, Middle Name, Last Name, and Suffix are permanently stripped on upload
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('bottleneck-agent')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'bottleneck-agent'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Stage 1 Bottleneck &amp; Remediation Agent</span>
        </button>

        <button
          onClick={() => setActiveTab('multimodal')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'multimodal'
              ? 'bg-blue-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Multi-Stream Triangulation</span>
        </button>

        <button
          onClick={() => setActiveTab('kintanar-beds')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'kintanar-beds'
              ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bed className="w-3.5 h-3.5" />
          <span>Kintanar Bed Capacity &amp; Webhook</span>
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'webhook'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Webhook className="w-3.5 h-3.5" />
          <span>1. Webhook Extraction (pidsr.doh.gov.ph)</span>
        </button>

        <button
          onClick={() => setActiveTab('webhook-specialist')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'webhook-specialist'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Specialist Webhook Tasks &amp; Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('datamanagement')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'datamanagement'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>2. Data Management Skills</span>
        </button>

        <button
          onClick={() => setActiveTab('dataanalytics')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'dataanalytics'
              ? 'bg-purple-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>3. Data Analytics Skills</span>
        </button>

        <button
          onClick={() => setActiveTab('linelist')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'linelist'
              ? 'bg-blue-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Master Registry ({activeRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'quality'
              ? 'bg-blue-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>DQI ({validationReport.overallDQI}%)</span>
        </button>
      </div>

      {/* SUB-VIEW 0: STAGE 1 INGESTION BOTTLENECK & REMEDIATION AGENT */}
      {activeTab === 'bottleneck-agent' && (
        <IngestionBottleneckAgent records={activeRecords} />
      )}

      {/* SUB-VIEW 1: MULTI-MODAL TRIANGULATION ENGINE */}
      {activeTab === 'multimodal' && (
        <MultiStreamSurveillance records={records} selectedDisease={selectedDisease} />
      )}

      {/* SUB-VIEW 1B: ISIDRO C. KINTANAR MEMORIAL HOSPITAL BED CAPACITY & WEBHOOK SURVEILLANCE */}
      {activeTab === 'kintanar-beds' && (
        <HospitalBedSurveillanceView
          onSelectStage={onSelectStage}
          onOpenReportModal={onOpenReportModal}
        />
      )}

      {/* SUB-VIEW 2: STREAM 1 DOH PIDSR WEBHOOK & EXTRACTION GATEWAY */}
      {activeTab === 'webhook' && (
        <PIDSRWebhookPanel
          onIngestCSV={onIngestCSV}
          selectedDisease={selectedDisease}
          currentRecordsCount={activeRecords.length}
          onSelectTab={setActiveTab}
        />
      )}

      {/* SUB-VIEW 2B: SPECIALIST AGENT FOR WEBHOOK TASKS & INTEGRATIONS */}
      {activeTab === 'webhook-specialist' && (
        <WebhookSpecialistAgentView
          onIngestCSV={onIngestCSV}
          selectedDisease={selectedDisease}
          currentRecordsCount={activeRecords.length}
          onOpenAgentModal={onOpenAgentModal}
        />
      )}

      {/* SUB-VIEW 3: DATA MANAGEMENT SYSTEM SKILLS */}
      {activeTab === 'datamanagement' && (
        <DataManagementSkillsView
          records={records}
          validationReport={validationReport}
          onOpenUpload={onOpenUpload}
        />
      )}

      {/* SUB-VIEW 4: DATA ANALYTICS SKILLS */}
      {activeTab === 'dataanalytics' && (
        <DataAnalyticsSkillsView records={records} />
      )}

      {/* SUB-VIEW 5: MASTER PATIENT LINE-LIST */}
      {activeTab === 'linelist' && (
        <section className="space-y-4">
          <LineListTable records={records} selectedDisease={selectedDisease} />
        </section>
      )}

      {/* SUB-VIEW 6: INGESTION QUALITY AUDIT */}
      {activeTab === 'quality' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Ingestion Quality Index &amp; Interoperability Validation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates line-list completeness, deduplication, timeliness, and field schema validity per DOH standards.
              </p>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              DQI Score: {validationReport.overallDQI}%
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">Completeness:</span>
              <div className="text-lg font-bold text-white">{validationReport.completenessScore}%</div>
              <span className="text-[10px] text-slate-500 font-sans">Required epidemiological fields populated</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">Deduplication:</span>
              <div className="text-lg font-bold text-white">{validationReport.duplicateScore}%</div>
              <span className="text-[10px] text-slate-500 font-sans">Exact and probabilistic deduplication</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">Timeliness:</span>
              <div className="text-lg font-bold text-white">{validationReport.timelinessScore}%</div>
              <span className="text-[10px] text-slate-500 font-sans">Consult to notification lag &lt; 24h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
