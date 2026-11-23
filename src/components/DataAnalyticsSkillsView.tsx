import React from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  HeartPulse,
  Activity,
  CheckCircle2,
  Users,
  Building2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SurveillanceRecord } from '../types/surveillance';
import { calculateDataAnalyticsSkillsReport } from '../utils/dataCleaner';

interface DataAnalyticsSkillsViewProps {
  records: SurveillanceRecord[];
}

export const DataAnalyticsSkillsView: React.FC<DataAnalyticsSkillsViewProps> = ({
  records,
}) => {
  const report = calculateDataAnalyticsSkillsReport(records);
  const {
    ingestionAberrations,
    diagnosticCompleteness,
    reportingDelayDistribution,
    caseClassificationMix,
  } = report;

  return (
    <div className="space-y-6">
      {/* Top Banner: Data Analytics Skills */}
      <div className="p-5 rounded-2xl bg-[#111113] border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(228,228,231,0.08)] pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Stream 1 Agent Skill: Ingestion-Time Epidemiological Analytics
                </h3>
                <span className="font-mono text-[0.625rem] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  3-SIGMA OUTLIER ENGINE
                </span>
                <span className="font-mono text-[0.625rem] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                  DOH AO 2016-0043 COMPLIANCE
                </span>
              </div>
              <p className="text-xs text-[rgba(228,228,231,0.7)] mt-1 font-mono">
                Immediate statistical profiling computed upon data ingestion: Spatial cluster anomaly z-scores, clinical diagnostics completeness, reporting lag distribution, and pediatric vulnerability ratios.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-[rgba(228,228,231,0.06)] space-y-1">
            <span className="text-zinc-400 text-[0.62rem] block uppercase">
              1. 3-Sigma Spatial Outliers
            </span>
            <div className="text-lg font-bold text-amber-400">
              {ingestionAberrations.outlierBarangays.length} Barangays Flagged
            </div>
            <span className="text-rose-400 text-[0.6rem] block font-bold">
              {ingestionAberrations.threeSigmaAlertCount} Critical Outliers (&ge;3&sigma;)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-[rgba(228,228,231,0.06)] space-y-1">
            <span className="text-zinc-400 text-[0.62rem] block uppercase">
              2. DOH NS1 Compliance (Days 1–5)
            </span>
            <div className="text-lg font-bold text-emerald-400">
              {diagnosticCompleteness.ns1Days1To5CompliancePct}%
            </div>
            <span className="text-zinc-400 text-[0.6rem] block">
              Target Standard: &ge; 85.0%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-[rgba(228,228,231,0.06)] space-y-1">
            <span className="text-zinc-400 text-[0.62rem] block uppercase">
              3. Mean Onset-to-Consult Lag
            </span>
            <div className="text-lg font-bold text-white">
              {reportingDelayDistribution.onsetToConsultMeanDays} Days
            </div>
            <span className="text-cyan-400 text-[0.6rem] block">
              Median: {reportingDelayDistribution.onsetToConsultMedianDays} Days
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-[rgba(228,228,231,0.06)] space-y-1">
            <span className="text-zinc-400 text-[0.62rem] block uppercase">
              4. Pediatric Vulnerability
            </span>
            <div className="text-lg font-bold text-purple-300">
              {caseClassificationMix.pediatricProportionPct}%
            </div>
            <span className="text-zinc-400 text-[0.6rem] block">
              Cases in Cohort &lt; 15 Years Old
            </span>
          </div>
        </div>
      </div>

      {/* 2x2 Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: 3-SIGMA OUTLIER ABERRATION DETECTION */}
        <div className="p-5 rounded-2xl bg-[#111113] border border-[rgba(228,228,231,0.08)] space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(228,228,231,0.08)] pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Ingestion-Time 3-Sigma Spatial Outlier Detection</span>
            </div>
            <span className="font-mono text-[0.65rem] text-zinc-400">
              Z-Score Calculation Across 45 Barangays
            </span>
          </div>

          <div className="space-y-2">
            {ingestionAberrations.outlierBarangays.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#0b0c0e] text-center font-mono text-xs text-zinc-400">
                All 45 barangays are within normal baseline variance (&lt; 1.2&sigma;).
              </div>
            ) : (
              ingestionAberrations.outlierBarangays.slice(0, 5).map((outlier, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#0b0c0e] border border-white/5 flex items-center justify-between font-mono text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Barangay {outlier.barangay}</span>
                      <span
                        className={`text-[0.6rem] px-1.5 py-0.2 rounded font-bold ${
                          outlier.zScore >= 3.0
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : outlier.zScore >= 2.0
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {outlier.sigmaLevel}
                      </span>
                    </div>
                    <div className="text-[0.65rem] text-zinc-400 mt-0.5">
                      Expected Mean: {outlier.expectedMean} cases • Active Count: {outlier.caseCount} cases
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[0.6rem] text-zinc-500 block uppercase">Z-Score</span>
                    <span className="text-sm font-bold text-amber-400">+{outlier.zScore}&sigma;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL 2: DIAGNOSTIC & CLINICAL COMPLETENESS (DOH AO 2016-0043) */}
        <div className="p-5 rounded-2xl bg-[#111113] border border-[rgba(228,228,231,0.08)] space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(228,228,231,0.08)] pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Diagnostic Quality &amp; DOH AO 2016-0043 Protocol</span>
            </div>
            <span className="font-mono text-[0.65rem] text-zinc-400">
              Clinical Completeness Audit
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300">NS1 Administered in Days 1–5:</span>
                <span className="font-bold text-emerald-400">
                  {diagnosticCompleteness.ns1Days1To5CompliancePct}%
                </span>
              </div>
              <div className="w-full bg-[#0b0c0e] h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${diagnosticCompleteness.ns1Days1To5CompliancePct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300">Fever Onset Date Documented:</span>
                <span className="font-bold text-cyan-400">
                  {diagnosticCompleteness.feverOnsetRecordedPct}%
                </span>
              </div>
              <div className="w-full bg-[#0b0c0e] h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${diagnosticCompleteness.feverOnsetRecordedPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300">Clinical Warning Signs Documented:</span>
                <span className="font-bold text-purple-400">
                  {diagnosticCompleteness.warningSignsDocumentedPct}%
                </span>
              </div>
              <div className="w-full bg-[#0b0c0e] h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${diagnosticCompleteness.warningSignsDocumentedPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300">Laboratory Confirmation Rate:</span>
                <span className="font-bold text-white">
                  {diagnosticCompleteness.labConfirmationRatePct}%
                </span>
              </div>
              <div className="w-full bg-[#0b0c0e] h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${diagnosticCompleteness.labConfirmationRatePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3: SURVEILLANCE REPORTING DELAY DISTRIBUTION */}
        <div className="p-5 rounded-2xl bg-[#111113] border border-[rgba(228,228,231,0.08)] space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(228,228,231,0.08)] pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Surveillance Reporting Delay &amp; Notification SLA</span>
            </div>
            <span className="font-mono text-[0.65rem] text-zinc-400">
              SLA Standard: &le; 24h Notification
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-white/5 space-y-1">
              <span className="text-zinc-400 text-[0.62rem] uppercase block">
                Onset to Consultation Lag
              </span>
              <div className="text-base font-bold text-white">
                {reportingDelayDistribution.onsetToConsultMeanDays} Days
              </div>
              <span className="text-zinc-500 text-[0.6rem] block">
                Patient consultation latency
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-white/5 space-y-1">
              <span className="text-zinc-400 text-[0.62rem] uppercase block">
                Consult to MESU Notification
              </span>
              <div className="text-base font-bold text-emerald-400">
                {reportingDelayDistribution.consultToMesuMeanHours} Hours
              </div>
              <span className="text-emerald-400 text-[0.6rem] block">
                Within 24h statutory mandate
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0b0c0e] border border-white/5 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-300">Target Notification SLA Compliance (&le;3d):</span>
            <span className="font-bold text-emerald-400">
              {reportingDelayDistribution.targetSlaCompliancePct}%
            </span>
          </div>
        </div>

        {/* PANEL 4: CASE CLASSIFICATION & DEMOGRAPHIC MIX */}
        <div className="p-5 rounded-2xl bg-[#111113] border border-[rgba(228,228,231,0.08)] space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(228,228,231,0.08)] pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Case Mix &amp; Pediatric Vulnerability Index</span>
            </div>
            <span className="font-mono text-[0.65rem] text-zinc-400">
              DOH Classification Breakdown
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
            <div className="p-2.5 rounded-lg bg-[#0b0c0e] border border-blue-900/30">
              <span className="text-zinc-400 text-[0.6rem] block">SUSPECT</span>
              <span className="text-sm font-bold text-cyan-400">
                {caseClassificationMix.suspectPct}%
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0b0c0e] border border-amber-900/30">
              <span className="text-zinc-400 text-[0.6rem] block">PROBABLE</span>
              <span className="text-sm font-bold text-amber-400">
                {caseClassificationMix.probablePct}%
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0b0c0e] border border-emerald-900/30">
              <span className="text-zinc-400 text-[0.6rem] block">CONFIRMED</span>
              <span className="text-sm font-bold text-emerald-400">
                {caseClassificationMix.confirmedPct}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b0c0e] border border-purple-900/40 space-y-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-purple-300 font-bold">Pediatric Cohort Vulnerability (&lt;15 yo):</span>
              <span className="text-white font-bold">{caseClassificationMix.pediatricProportionPct}%</span>
            </div>
            <p className="text-[0.65rem] text-zinc-400 leading-relaxed">
              Children under 15 represent the primary risk group for rapid plasma leakage and dengue shock syndrome (DSS).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
