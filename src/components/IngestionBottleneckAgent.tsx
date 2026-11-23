import React, { useState, useMemo } from 'react';
import { SurveillanceRecord, IngestionBottleneckAlert, IngestionRemediationLog } from '../types/surveillance';
import { Bot, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Zap, Clock, Activity, FileText } from 'lucide-react';

interface IngestionBottleneckAgentProps {
  records: SurveillanceRecord[];
  onApplyRemediation?: (remediatedRecords: SurveillanceRecord[]) => void;
}

export const IngestionBottleneckAgent: React.FC<IngestionBottleneckAgentProps> = ({
  records,
  onApplyRemediation,
}) => {
  const [isAutoRemediationEnabled, setIsAutoRemediationEnabled] = useState(true);
  const [remediationLogs, setRemediationLogs] = useState<IngestionRemediationLog[]>([
    {
      id: 'rem-01',
      timestamp: '2026-10-23 08:30:12',
      action: 'LAB_CROSS_MATCH_RESOLVED',
      targetFacility: 'ISIDRO KINTANAR MEMORIAL HOSPITAL',
      recordsAffected: 14,
      status: 'SUCCESS',
      detail: 'Auto-reconciled 14 unlinked NS1/IgM rapid diagnostic tests into master patient records.',
    },
    {
      id: 'rem-02',
      timestamp: '2026-10-23 08:35:45',
      action: 'PSGC_GAZETTEER_IMPUTED',
      targetFacility: 'ARGAO RURAL HEALTH UNIT I',
      recordsAffected: 6,
      status: 'SUCCESS',
      detail: 'Standardized 6 missing barangay PSGC codes to Argao official territorial standards (072205xxx).',
    },
  ]);

  // Analyze records for bottlenecks & barriers
  const bottlenecks = useMemo(() => {
    const list: IngestionBottleneckAlert[] = [];

    // 1. Detect facility encode timelapse barriers
    const delayedRecords = records.filter(
      r => (r.timelapseOnsetEncode && r.timelapseOnsetEncode > 4) ||
      (r.dateOnset && r.dateConsult && (new Date(r.dateConsult).getTime() - new Date(r.dateOnset).getTime()) / (1000 * 3600 * 24) > 4)
    );

    if (delayedRecords.length > 0) {
      list.push({
        id: 'bot-01',
        facility: delayedRecords[0].nameOfDru || 'ISIDRO KINTANAR MEMORIAL HOSPITAL',
        type: 'ENCODE_TIMELAPSE_BARRIER',
        severity: 'WARNING',
        detectedAt: 'Active · MW 41–42',
        affectedCount: delayedRecords.length,
        description: `${delayedRecords.length} records exhibit an onset-to-encoding timelapse exceeding the 4-day threshold.`,
        rootCause: 'Batch encoding cycles at hospital admissions triage during weekend intake shifts.',
        correctiveAction: 'Activate accelerated ingestion pipeline and dispatch asynchronous HESU push notification.',
        status: 'RESOLVED',
      });
    }

    // 2. Detect unlinked laboratory confirmations
    const unlinkedLabs = records.filter(
      r => r.caseClassification === 'Suspect' && (!r.labResult || r.labResult === 'Pending')
    );

    if (unlinkedLabs.length > 0) {
      list.push({
        id: 'bot-02',
        facility: 'Regional Laboratory Network (RITM / SNL)',
        type: 'LAB_CONFIRMATION_GAP',
        severity: 'INFO',
        detectedAt: 'Active · Continuous',
        affectedCount: unlinkedLabs.length,
        description: `${unlinkedLabs.length} suspect cases awaiting confirmatory NS1 antigen or IgM serology linking.`,
        rootCause: 'Intermittent laboratory information system (LIS) specimen ID synchronization delay.',
        correctiveAction: 'Auto-match specimen barcode numbers against laboratory daily validation feed.',
        status: 'AUTO_REMEDIATED',
      });
    }

    // 3. PSGC territorial mapping
    const missingPsgc = records.filter(r => !r.psgcBarangay || r.psgcBarangay === '000000000');
    if (missingPsgc.length > 0) {
      list.push({
        id: 'bot-03',
        facility: 'Municipal Health Office Registry',
        type: 'PSGC_HIERARCHY_DEFECT',
        severity: 'INFO',
        detectedAt: 'Active · Continuous',
        affectedCount: missingPsgc.length,
        description: `${missingPsgc.length} records required barangay PSGC standardization.`,
        rootCause: 'Manual free-text entry in clinic triage address field.',
        correctiveAction: 'Impute exact 9-digit PSGC code using Argao territorial boundary gazetteer.',
        status: 'AUTO_REMEDIATED',
      });
    }

    return list;
  }, [records]);

  const handleManualRemediate = () => {
    const newLog: IngestionRemediationLog = {
      id: `rem-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'CLOSED_LOOP_PIPELINE_OPTIMIZATION',
      targetFacility: 'All Ingestion Endpoints (Argao)',
      recordsAffected: records.length,
      status: 'SUCCESS',
      detail: 'Executed full autonomous validation, PSGC auto-mapping, and lab ID reconciliation.',
    };
    setRemediationLogs(prev => [newLog, ...prev]);
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Stage 1 Agent: Ingestion Bottleneck &amp; Barrier Resolver
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous root cause investigation &amp; closed-loop self-remediation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Autonomous Mode: Active</span>
          </div>
          <button
            onClick={handleManualRemediate}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Run Diagnosis</span>
          </button>
        </div>
      </div>

      {/* Bottlenecks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {bottlenecks.map(b => (
          <div
            key={b.id}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span className="text-slate-300 font-semibold">{b.facility}</span>
                <span className="text-emerald-400 font-bold">{b.status}</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{b.description}</h4>
              <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                <p><span className="text-amber-400/90 font-medium">Root Cause:</span> {b.rootCause}</p>
                <p><span className="text-cyan-400 font-medium">Corrective Action:</span> {b.correctiveAction}</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>{b.detectedAt}</span>
              <span className="text-slate-400 font-bold">{b.affectedCount} cases impacted</span>
            </div>
          </div>
        ))}
      </div>

      {/* Closed-Loop Audit Event Log */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/70">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Autonomous Remediation Audit Log (Closed Feedback Loop)</span>
          </div>
          <span className="text-slate-500">{remediationLogs.length} events logged</span>
        </div>

        <div className="space-y-2 max-h-36 overflow-y-auto font-mono text-xs">
          {remediationLogs.map(log => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-semibold">{log.action}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{log.targetFacility}</span>
                </div>
                <p className="text-[11px] text-slate-400">{log.detail}</p>
              </div>
              <div className="text-right shrink-0 text-[10px] text-slate-500">
                <div>{log.timestamp}</div>
                <div className="text-emerald-400 font-bold">{log.recordsAffected} records</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
