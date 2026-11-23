import React, { useState } from 'react';
import { FileText, Copy, Check, Sparkles } from 'lucide-react';
import {
  EpidemiologicalMetrics,
  GeoMunicipalitySummary,
  SurveillanceAlert,
  DemographicStats,
} from '../types/surveillance';

interface ExecutiveSummaryProps {
  metrics: EpidemiologicalMetrics;
  municipalities: GeoMunicipalitySummary[];
  alerts: SurveillanceAlert[];
  demographics: DemographicStats;
  selectedDisease: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  metrics,
  municipalities,
  alerts,
  demographics,
  selectedDisease,
}) => {
  const [copied, setCopied] = useState(false);
  const topMuni = municipalities[0]?.name || 'Primary Cluster';

  const briefText = `EPIDEMIOLOGICAL SITUATION & DIRECTIVES (${selectedDisease || 'DENGUE'} SURVEILLANCE):
• Cumulative Burden: ${metrics.totalCases} cases reported with ${metrics.newCasesLatestMW} new admissions in Morbidity Week ${metrics.latestMorbidityWeek}.
• Clinical Severity: Case Fatality Rate is ${metrics.cfr.toFixed(2)}% with ${metrics.deaths} fatalities. Inpatient admission rate stands at ${metrics.hospitalizationRate.toFixed(1)}%.
• Primary Geographic Focus: ${topMuni} represents the principal cluster area.
• Priority Field Directives:
  1. Mobilize targeted community larval source elimination (4S Strategy) across high-transmission barangays.
  2. Pre-position oral and intravenous rehydration packs in rural health units.
  3. Ensure daily syndromic surveillance reporting from all public and private triage points.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Actionable Public Health Directives</h3>
            <p className="text-xs text-slate-400">Standard field response protocols based on current surveillance signals</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Directives'}</span>
        </button>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed">
        {briefText}
      </div>
    </div>
  );
};
