import React, { useMemo } from 'react';
import {
  EpidemiologicalMetrics,
  SurveillanceRecord,
  SurveillanceAlert,
  MultiStreamSummary,
} from '../types/surveillance';
import {
  calculateBarangayHeatmapPareto,
  calculateClinicalSeverityBreakdown,
  calculateFullYearEpiChannel,
} from '../utils/epidemiology';
import { FileText } from 'lucide-react';

interface StakeholderDecisionSupportViewProps {
  records: SurveillanceRecord[];
  metrics: EpidemiologicalMetrics;
  alerts: SurveillanceAlert[];
  summary: MultiStreamSummary;
  onOpenExecutiveBrief: () => void;
}

export const StakeholderDecisionSupportView: React.FC<
  StakeholderDecisionSupportViewProps
> = ({ records, metrics, summary, onOpenExecutiveBrief }) => {
  const { rows: paretoRows } = useMemo(
    () => calculateBarangayHeatmapPareto(records),
    [records]
  );
  const severity = useMemo(
    () => calculateClinicalSeverityBreakdown(records),
    [records]
  );
  const channel = useMemo(
    () => calculateFullYearEpiChannel(records, 46),
    [records]
  );

  const emergencyWeeks = channel.filter(w => w.status === 'Emergency');
  const alertWeeks = channel.filter(w => w.status === 'Alert');
  const top3Barangays = paretoRows.slice(0, 3);
  const top3Names = top3Barangays.map(b => `${b.name} (${b.ytdCases})`).join(', ');
  const vitalFewCount = paretoRows.filter(b => b.isVitalFew80).length;

  const stakeholderCards = [
    {
      audience: 'Expanded Local Health Board (ELHB)',
      mandate: 'Inter-Agency Governance & Outbreak Resolution',
      alertStatus:
        emergencyWeeks.length > 0
          ? 'Emergency Threshold Reached (+2 SD)'
          : alertWeeks.length > 0
          ? 'Alert Threshold Active (+1 SD)'
          : 'Routine Baseline Monitoring',
      directives: [
        `Prioritize municipal DRRM-H sanitation funding toward the ${vitalFewCount} Pareto priority barangays led by ${top3Names}.`,
        `Maintain municipal CFR below the <1.00% DOH national benchmark (current CFR: ${metrics.cfr.toFixed(2)}%) via zero-delay hospital referral protocols.`,
        `Convene Barangay Dengue Task Forces weekly when any cluster breaches ${emergencyWeeks.length > 0 ? '2-SD emergency thresholds' : '1-SD provisional alert thresholds'}.`,
      ],
    },
    {
      audience: 'Policy-Makers & LGU Executives',
      mandate: 'Ordinance Enforcement & Resource Allocation',
      alertStatus: 'Statutory Authority: RA 11332',
      directives: [
        `Pre-position dengue NS1 RDT kits and larvicidal supplies across RHU I, RHU II, and coastal barangay health stations.`,
        `Enforce Municipal Ordinance on the 4 o'clock community source-reduction habit and stagnant drainage clearing in high-attack-rate sitios.`,
        `Authorize supplemental surge staffing and IV fluid reserves for Isidro C. Kintanar Memorial Hospital when hospitalization exceeds 70%.`,
      ],
    },
    {
      audience: 'PCPN Service Providers & Referral Hospitals',
      mandate: 'Clinical Triage & Early Warning Management',
      alertStatus: `Hospitalization Rate: ${severity.hospitalizationRatePct.toFixed(1)}%`,
      directives: [
        `Administer NS1 RDT strictly within Days 1–5 of fever onset per DOH AO 2016-0043 at all RHU and Barangay Health Station entry points.`,
        `Admit or closely observe all ${severity.withWarningSigns.count} Warning-Sign and ${severity.severeDengue.count} Severe Dengue presentations with serial microhematocrit tracking.`,
        `Monitor dehydration progression closely among pediatric and adolescent cohorts who represent the primary transmission burden.`,
      ],
    },
    {
      audience: 'General Public & Community Advisories',
      mandate: '4S Strategy & Early Care-Seeking Behavior',
      alertStatus: 'Public Risk Communication',
      directives: [
        `Practice the 4S Dengue Prevention Strategy daily: Search and destroy breeding sites, Self-protection measures, Seek early consultation within 48 hours of fever, and Support fogging only in confirmed hotspots.`,
        `Cover household water storage drums, clean roof gutters weekly, and eliminate standing rainwater in discarded containers.`,
        `Seek immediate RHU assessment if fever persists beyond 2 days or if abdominal pain, persistent vomiting, or mucosal bleeding develops.`,
      ],
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Policy &amp; Stakeholder Decision Support
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Municipality of Argao, Cebu
          </p>
        </div>

        <button
          onClick={onOpenExecutiveBrief}
          className="no-print px-4 py-2 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Open Formal Health Officer Brief</span>
        </button>
      </div>

      {/* Quantitative Risk Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08]">
          <div className="text-xs text-slate-400">Epi Curve Alert Weeks (+1 SD)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-yellow-400 mt-1">
            {alertWeeks.length} weeks
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08]">
          <div className="text-xs text-slate-400">Emergency Weeks (+2 SD)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400 mt-1">
            {emergencyWeeks.length} weeks
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08]">
          <div className="text-xs text-slate-400">Pareto Priority Barangays (80%)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-400 mt-1">
            {vitalFewCount} barangays
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08]">
          <div className="text-xs text-slate-400">Hospitalized Share</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {severity.hospitalizationRatePct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 2x2 Stakeholder Directives Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {stakeholderCards.map(card => (
          <div
            key={card.audience}
            className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] space-y-4 print-break-inside"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-semibold text-white">{card.audience}</h2>
                <p className="text-xs text-slate-400">{card.mandate}</p>
              </div>
              <span className="text-xs font-mono text-slate-300 whitespace-nowrap">
                {card.alertStatus}
              </span>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {card.directives.map((dir, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-blue-400 font-semibold mt-0.5 shrink-0">
                    0{i + 1}.
                  </span>
                  <span>{dir}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
