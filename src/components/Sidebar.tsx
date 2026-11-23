import React from 'react';
import {
  Database,
  Cpu,
  ShieldAlert,
  Share2,
  FileText,
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { IntelligenceEngineStage } from '../types/surveillance';

interface SidebarProps {
  currentStage: IntelligenceEngineStage;
  onSelectStage: (stage: IntelligenceEngineStage) => void;
  selectedDisease: string;
  setSelectedDisease: (disease: string) => void;
  validRecords: number;
  overallDQI: number;
  latestMorbidityWeek: number;
  latestMorbidityYear: number;
  overallAlertTier: 'Green' | 'Yellow' | 'Red';
  onOpenReport: () => void;
  onOpenAgentModal?: (stage: IntelligenceEngineStage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentStage,
  onSelectStage,
  selectedDisease,
  setSelectedDisease,
  validRecords,
  overallDQI,
  latestMorbidityWeek,
  latestMorbidityYear,
  overallAlertTier,
  onOpenReport,
  onOpenAgentModal,
}) => {
  const isElevated = overallAlertTier === 'Yellow' || overallAlertTier === 'Red';

  return (
    <aside className="w-full lg:w-[280px] shrink-0 border-r border-[rgba(228,228,231,0.08)] bg-gradient-to-b from-[#111113] to-[#0b0c0e] p-6 flex flex-col justify-between text-[#e4e4e7] h-full overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#06b6d4]/15 border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4]">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold tracking-[-0.04em] uppercase text-white">
              EIEWS
            </h1>
          </div>
          <div
            className={`font-mono text-[0.625rem] tracking-[0.1em] mt-1.5 flex items-center gap-1.5 font-bold ${
              isElevated
                ? overallAlertTier === 'Red'
                  ? 'text-rose-400'
                  : 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isElevated
                  ? overallAlertTier === 'Red'
                    ? 'bg-rose-400 animate-ping'
                    : 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {overallAlertTier === 'Red'
                ? 'OUTBREAK SURGE'
                : overallAlertTier === 'Yellow'
                ? 'ALERT SIGNAL'
                : 'SURVEILLANCE NOMINAL'} • MW {latestMorbidityWeek}, {latestMorbidityYear}
            </span>
          </div>
        </div>

        {/* Primary Stream Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(228,228,231,0.5)] block">
              Primary Stream
            </span>
            {onOpenAgentModal && (
              <button
                onClick={() => onOpenAgentModal(currentStage)}
                className="font-mono text-[0.6rem] text-[#06b6d4] hover:text-[#22d3ee] flex items-center gap-1 cursor-pointer font-bold"
                title="View step agent assignments"
              >
                <Bot className="w-3 h-3" />
                <span>4 Agents</span>
              </button>
            )}
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onSelectStage('overview')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                currentStage === 'overview'
                  ? 'bg-blue-600/20 text-white border border-blue-500/40 font-bold'
                  : 'text-[rgba(228,228,231,0.55)] hover:text-[#e4e4e7] hover:bg-white/[0.04]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <div className="flex-1 flex items-center justify-between">
                <span>00 Overview</span>
                <span className="font-mono text-[0.6rem] text-blue-300">Executive Slide</span>
              </div>
            </button>

            <button
              onClick={() => onSelectStage('ingestion')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                currentStage === 'ingestion'
                  ? 'bg-[rgba(228,228,231,0.08)] text-[#e4e4e7] border border-white/10 font-semibold'
                  : 'text-[rgba(228,228,231,0.55)] hover:text-[#e4e4e7] hover:bg-white/[0.04]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#06b6d4]" />
              <div className="flex-1 flex items-center justify-between">
                <span>01 Ingestion</span>
                <span className="font-mono text-[0.6rem] opacity-60">Agent 1 & WH</span>
              </div>
            </button>

            <button
              onClick={() => onSelectStage('processing')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                currentStage === 'processing'
                  ? 'bg-[rgba(228,228,231,0.08)] text-[#e4e4e7] border border-white/10 font-semibold'
                  : 'text-[rgba(228,228,231,0.55)] hover:text-[#e4e4e7] hover:bg-white/[0.04]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#06b6d4]" />
              <div className="flex-1 flex items-center justify-between">
                <span>02 Processing</span>
                <span className="font-mono text-[0.6rem] opacity-60">Agent 2: Risk</span>
              </div>
            </button>

            <button
              onClick={() => onSelectStage('visualize')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                currentStage === 'visualize'
                  ? 'bg-[rgba(228,228,231,0.08)] text-[#e4e4e7] border border-white/10 font-semibold'
                  : 'text-[rgba(228,228,231,0.55)] hover:text-[#e4e4e7] hover:bg-white/[0.04]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <div className="flex-1 flex items-center justify-between">
                <span>03 Visualize</span>
                <span className="font-mono text-[0.6rem] text-emerald-400/90">Apps Script Suite</span>
              </div>
            </button>

            <button
              onClick={() => onSelectStage('output')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                currentStage === 'output'
                  ? 'bg-[rgba(228,228,231,0.08)] text-[#e4e4e7] border border-white/10 font-semibold'
                  : 'text-[rgba(228,228,231,0.55)] hover:text-[#e4e4e7] hover:bg-white/[0.04]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#f59e0b]" />
              <div className="flex-1 flex items-center justify-between">
                <span>04 Response</span>
                <span className="font-mono text-[0.6rem] opacity-60">Agent 3: Action</span>
              </div>
            </button>

            <button
              onClick={() => onSelectStage('collaboration')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                currentStage === 'collaboration'
                  ? 'bg-[rgba(228,228,231,0.08)] text-[#e4e4e7] border border-white/10 font-semibold'
                  : 'text-[rgba(228,228,231,0.55)] hover:text-[#e4e4e7] hover:bg-white/[0.04]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <div className="flex-1 flex items-center justify-between">
                <span>05 Feedback</span>
                <span className="font-mono text-[0.6rem] opacity-60">Agent 4: Audit</span>
              </div>
            </button>
          </nav>
        </div>

        {/* AI Agent Orchestration Action Card */}
        {onOpenAgentModal && (
          <div className="mb-6 p-2.5 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Bot className="w-3.5 h-3.5 text-[#06b6d4]" />
                <span>Multi-Agent Engine</span>
              </div>
              <span className="font-mono text-[0.6rem] text-[#06b6d4] bg-[#06b6d4]/20 px-1 rounded font-bold">
                5 Active
              </span>
            </div>
            <p className="text-[0.68rem] text-[rgba(228,228,231,0.7)] leading-relaxed mb-2">
              5 autonomous agents assigned (including Agent WH-Ops: Webhook Specialist &amp; Integrations).
            </p>
            <button
              onClick={() => onOpenAgentModal(currentStage)}
              className="w-full py-1.5 px-2 rounded bg-[#06b6d4]/20 hover:bg-[#06b6d4]/30 text-[#06b6d4] border border-[#06b6d4]/40 font-mono text-[0.65rem] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Inspect 5-Agent Dossier</span>
            </button>
          </div>
        )}

        {/* Configuration Group */}
        <div className="mb-6 space-y-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(228,228,231,0.5)] mb-3 block">
            Configuration
          </span>

          <div className="p-2.5 rounded-md bg-[rgba(228,228,231,0.04)] border border-[rgba(228,228,231,0.06)] space-y-1">
            <span className="text-[0.65rem] text-[rgba(228,228,231,0.5)] block font-mono">
              Pathogen
            </span>
            <select
              value={selectedDisease}
              onChange={e => setSelectedDisease(e.target.value)}
              className="w-full bg-[#111113] border border-white/10 text-xs font-bold text-[#06b6d4] rounded px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL DISEASES</option>
              <option value="DEN">Dengue Virus (DEN)</option>
              <option value="CHOL">V. cholerae / AGE</option>
              <option value="MEA">Measles Virus (MEA)</option>
            </select>
          </div>

          <div className="p-2.5 rounded-md bg-[rgba(228,228,231,0.04)] border border-[rgba(228,228,231,0.06)] flex items-center justify-between text-xs">
            <span className="text-[rgba(228,228,231,0.55)] font-mono text-[0.68rem]">Verification:</span>
            <strong className="text-white font-mono font-bold">{validRecords.toLocaleString()} CASES</strong>
          </div>

          <div className="p-2.5 rounded-md bg-[rgba(228,228,231,0.04)] border border-[rgba(228,228,231,0.06)] flex items-center justify-between text-xs">
            <span className="text-[rgba(228,228,231,0.55)] font-mono text-[0.68rem]">Data Quality:</span>
            <strong className="text-[#10b981] font-mono font-bold">{overallDQI}% DQI</strong>
          </div>
        </div>
      </div>

      {/* Bottom Action: Executive Brief */}
      <div className="pt-4 border-t border-[rgba(228,228,231,0.08)] mt-auto">
        <button
          onClick={onOpenReport}
          className="w-full py-2.5 px-4 rounded-md bg-[#06b6d4] hover:bg-[#0891b2] text-[#0b0c0e] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Executive Brief</span>
        </button>
        <span className="block text-center font-mono text-[0.6rem] text-[rgba(228,228,231,0.4)] mt-2">
          Local Health Officers &amp; MDRRMC
        </span>
      </div>
    </aside>
  );
};
