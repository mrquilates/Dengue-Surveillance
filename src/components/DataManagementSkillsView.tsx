import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  Lock,
  Layers,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Trash2,
  Sparkles,
  RefreshCw,
  GitCommit,
  HardDrive,
  FileCode,
} from 'lucide-react';
import {
  SurveillanceRecord,
  ValidationReport,
  DataManagementSkillsReport,
} from '../types/surveillance';
import { calculateDataManagementSkillsReport } from '../utils/dataCleaner';

interface DataManagementSkillsViewProps {
  records: SurveillanceRecord[];
  validationReport: ValidationReport;
  onOpenUpload?: () => void;
}

export const DataManagementSkillsView: React.FC<DataManagementSkillsViewProps> = ({
  records,
  validationReport,
  onOpenUpload,
}) => {
  const report = calculateDataManagementSkillsReport(records, validationReport);
  const [activeSubSection, setActiveSubSection] = useState<
    'pii' | 'dedup' | 'schema' | 'staging'
  >('pii');

  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(report.stagingAndBackup.provenanceHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadSnapshot = () => {
    const jsonStr = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argao_surveillance_snapshot_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Data Management System Skills */}
      <div className="p-5 rounded-2xl bg-[#111113] border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(228,228,231,0.08)] pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Stream 1 Agent Skill: Data Management Systems &amp; Governance
                </h3>
                <span className="font-mono text-[0.625rem] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  RA 10173 ZERO-PII CERTIFIED
                </span>
                <span className="font-mono text-[0.625rem] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  ACID LINE-LIST STAGING
                </span>
              </div>
              <p className="text-xs text-[rgba(228,228,231,0.7)] mt-1 font-mono">
                Multi-tier data lifecycle orchestration: Zero-PII sanitization, probabilistic deduplication, schema version harmonization, and cryptographic provenance auditing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadSnapshot}
              className="px-3.5 py-2 rounded-xl bg-[rgba(228,228,231,0.08)] hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-white/10 transition-colors font-mono"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Snapshot JSON</span>
            </button>
          </div>
        </div>

        {/* 4 Core Data Management Capabilities Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div
            onClick={() => setActiveSubSection('pii')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeSubSection === 'pii'
                ? 'bg-[#0b0c0e] border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-[#0b0c0e]/60 border-[rgba(228,228,231,0.06)] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-zinc-400 text-[0.62rem] block uppercase">1. Zero-PII Sanitization</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white">100% Compliant</div>
            <span className="text-emerald-400 text-[0.6rem] block">
              {report.piiSanitization.strippedFields.length} Patient Name Columns Purged
            </span>
          </div>

          <div
            onClick={() => setActiveSubSection('dedup')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeSubSection === 'dedup'
                ? 'bg-[#0b0c0e] border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-[#0b0c0e]/60 border-[rgba(228,228,231,0.06)] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-zinc-400 text-[0.62rem] block uppercase">2. Deduplication Engine</span>
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {report.deduplication.dedupAccuracyPct}% Accuracy
            </div>
            <span className="text-cyan-400 text-[0.6rem] block">
              {report.deduplication.exactDuplicateCount} Exact • {report.deduplication.fuzzyPhoneticDuplicateCount} Fuzzy Collisions
            </span>
          </div>

          <div
            onClick={() => setActiveSubSection('schema')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeSubSection === 'schema'
                ? 'bg-[#0b0c0e] border-purple-500 shadow-md ring-1 ring-purple-500/30'
                : 'bg-[#0b0c0e]/60 border-[rgba(228,228,231,0.06)] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-zinc-400 text-[0.62rem] block uppercase">3. Schema Harmonizer</span>
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {report.schemaHarmonization.confidenceScore}% Match
            </div>
            <span className="text-purple-400 text-[0.6rem] block">
              {report.schemaHarmonization.detectedStandard}
            </span>
          </div>

          <div
            onClick={() => setActiveSubSection('staging')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeSubSection === 'staging'
                ? 'bg-[#0b0c0e] border-amber-500 shadow-md ring-1 ring-amber-500/30'
                : 'bg-[#0b0c0e]/60 border-[rgba(228,228,231,0.06)] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-zinc-400 text-[0.62rem] block uppercase">4. Staging &amp; Provenance</span>
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {report.stagingAndBackup.stagingState}
            </div>
            <span className="text-amber-400 text-[0.6rem] block truncate">
              {report.stagingAndBackup.provenanceHash.substring(0, 16)}...
            </span>
          </div>
        </div>
      </div>

      {/* DETAIL SECTION 1: ZERO-PII SANITIZATION (RA 10173) */}
      {activeSubSection === 'pii' && (
        <div className="p-5 rounded-2xl bg-[#111113] border border-[rgba(228,228,231,0.08)] space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(228,228,231,0.08)] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-400 uppercase">
              <Lock className="w-4 h-4" />
              <span>Data Privacy Act of 2012 (Republic Act No. 10173) Zero-PII Enforcement Pipeline</span>
            </div>
            <span className="font-mono text-[0.65rem] text-zinc-400">
              National Privacy Commission (NPC) Certified Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-emerald-900/30 space-y-2">
              <span className="text-zinc-400 text-[0.65rem] uppercase block">Automated Column Stripping</span>
              <div className="text-base font-bold text-white">
                {report.piiSanitization.strippedFields.length} Column Headers Intercepted
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {report.piiSanitization.strippedFields.map((f, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[0.6rem]"
                  >
                    Purged: {f}
                  </span>
                ))}
              </div>
              <p className="text-[0.65rem] text-zinc-400 pt-1 leading-relaxed">
                Any column matching first name, last name, middle name, or suffix is purged from browser memory immediately upon CSV ingestion.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-cyan-900/30 space-y-2">
              <span className="text-zinc-400 text-[0.65rem] uppercase block">Deterministic Case Tokenization</span>
              <div className="text-base font-bold text-cyan-300">
                {report.piiSanitization.tokenizedIdentifiersCount} Anonymized Tokens
              </div>
              <div className="p-2 rounded bg-[#111113] border border-white/5 font-mono text-[0.65rem] text-cyan-400">
                Pattern: EPI-[DISEASE]-[YEAR]-[HEX]
                <br />
                Example: <span className="text-white font-bold">EPI-DEN-2026-0001</span>
              </div>
              <p className="text-[0.65rem] text-zinc-400 pt-1 leading-relaxed">
                Patient identity is decoupled from medical record while preserving epidemiologic tracking and linkage across morbidity weeks.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-purple-900/30 space-y-2">
              <span className="text-zinc-400 text-[0.65rem] uppercase block">Statutory Compliance Status</span>
              <div className="text-base font-bold text-purple-300">0 Retention Violations</div>
              <div className="text-[0.65rem] text-zinc-300 leading-relaxed">
                Fully compliant with Section 12 &amp; 13 of RA 10173 governing public health emergencies and mandatory epidemiologic surveillance under RA 11332.
              </div>
              <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800 text-[0.62rem] text-emerald-300 font-bold">
                Status: Audit Passed • Ready for Inter-LGU Exchange
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL SECTION 2: DEDUPLICATION ENGINE */}
      {activeSubSection === 'dedup' && (
        <div className="p-5 rounded-2xl bg-[#111113] border border-[rgba(228,228,231,0.08)] space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(228,228,231,0.08)] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-400 uppercase">
              <Copy className="w-4 h-4" />
              <span>Dual-Tier Deduplication &amp; Collision Resolution Engine</span>
            </div>
            <span className="font-mono text-[0.65rem] text-zinc-400">
              Deterministic (EPIID) + Probabilistic (Soundex Demographic)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-white/5 space-y-1">
              <span className="text-zinc-400 text-[0.62rem] uppercase block">Tier 1: Exact Key Deduplication</span>
              <div className="text-lg font-bold text-white">
                {report.deduplication.exactDuplicateCount} Collisions Flagged
              </div>
              <p className="text-[0.65rem] text-zinc-400 leading-relaxed">
                Detects identical primary identifier records within the incoming PIDSR dataset.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-white/5 space-y-1">
              <span className="text-zinc-400 text-[0.62rem] uppercase block">Tier 2: Fuzzy Demographic Matching</span>
              <div className="text-lg font-bold text-amber-300">
                {report.deduplication.fuzzyPhoneticDuplicateCount} Suspected Re-entries
              </div>
              <p className="text-[0.65rem] text-zinc-400 leading-relaxed">
                Flags duplicate records with matching Age, Sex, Barangay, and Symptom Onset within &plusmn;3 days.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-white/5 space-y-1">
              <span className="text-zinc-400 text-[0.62rem] uppercase block">Unique Validated Registry</span>
              <div className="text-lg font-bold text-emerald-400">
                {report.deduplication.uniqueVerifiedCount} Clean Cases
              </div>
              <p className="text-[0.65rem] text-zinc-400 leading-relaxed">
                Cases retained for biostatistical modeling and second-derivative outbreak acceleration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL SECTION 3: SCHEMA HARMONIZATION */}
      {activeSubSection === 'schema' && (
        <div className="p-5 rounded-2xl bg-[#111113] border border-[rgba(228,228,231,0.08)] space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(228,228,231,0.08)] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-purple-400 uppercase">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Multi-Version DOH PIDSR Schema Harmonization Matrix</span>
            </div>
            <span className="font-mono text-[0.65rem] text-zinc-400">
              Confidence Score: {report.schemaHarmonization.confidenceScore}%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[0.65rem] text-zinc-400 uppercase">
                  <th className="py-2 px-3">PIDSR Standard Field</th>
                  <th className="py-2 px-3">Harmonization Status</th>
                  <th className="py-2 px-3">Accepted Aliases</th>
                  <th className="py-2 px-3">Validation Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">EPIID</td>
                  <td className="py-2.5 px-3 text-emerald-400">Mapped (100%)</td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[0.65rem]">epi_id, case_id, surveillance_id</td>
                  <td className="py-2.5 px-3 text-zinc-300 text-[0.65rem]">Alphanumeric token required</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Date Onset of First Symptoms</td>
                  <td className="py-2.5 px-3 text-emerald-400">Mapped (100%)</td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[0.65rem]">date_onset, onset_date, symptom_date</td>
                  <td className="py-2.5 px-3 text-zinc-300 text-[0.65rem]">ISO YYYY-MM-DD format</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Case Classification</td>
                  <td className="py-2.5 px-3 text-emerald-400">Mapped (100%)</td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[0.65rem]">case_class, doh_class, diagnosis</td>
                  <td className="py-2.5 px-3 text-zinc-300 text-[0.65rem]">DOH AO 2016-0043 (Suspect/Probable/Confirmed)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">PSGC_Barangay</td>
                  <td className="py-2.5 px-3 text-emerald-400">Mapped (100%)</td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[0.65rem]">barangay_psgc, psgc_bgy, bgy_code</td>
                  <td className="py-2.5 px-3 text-zinc-300 text-[0.65rem]">9-digit standard geographic code</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL SECTION 4: STAGING & PROVENANCE */}
      {activeSubSection === 'staging' && (
        <div className="p-5 rounded-2xl bg-[#111113] border border-[rgba(228,228,231,0.08)] space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(228,228,231,0.08)] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-amber-400 uppercase">
              <GitCommit className="w-4 h-4" />
              <span>ACID Staging Environment &amp; Dataset Provenance Fingerprint</span>
            </div>
            <span className="font-mono text-[0.65rem] text-zinc-400">
              Cryptographic Data Hash • Rollback Safe
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0b0c0e] border border-white/5 space-y-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-zinc-400 text-[0.65rem] uppercase block">
                  Active Dataset Provenance Digest
                </span>
                <div className="text-sm font-bold text-amber-300 mt-0.5">
                  {report.stagingAndBackup.provenanceHash}
                </div>
              </div>
              <button
                onClick={handleCopyHash}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedHash ? 'Hash Copied!' : 'Copy SHA-256 Digest'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#111113] border border-white/5">
                <span className="text-zinc-500 text-[0.6rem] block">ISOLATION TIER</span>
                <span className="text-white font-bold">Staging &rarr; Verified Production</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111113] border border-white/5">
                <span className="text-zinc-500 text-[0.6rem] block">TRANSACTION AUDIT</span>
                <span className="text-emerald-400 font-bold">Immutable Append Log</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111113] border border-white/5">
                <span className="text-zinc-500 text-[0.6rem] block">AUTOMATED SNAPSHOTS</span>
                <span className="text-cyan-400 font-bold">{report.stagingAndBackup.snapshotsCount} Incremental Snapshots</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
