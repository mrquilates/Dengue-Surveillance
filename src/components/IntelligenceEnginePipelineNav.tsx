import React from 'react';
import {
  Database,
  Cpu,
  MapPin,
  ShieldAlert,
  Share2,
  Bot,
  Sparkles,
  Flame,
} from 'lucide-react';
import { IntelligenceEngineStage } from '../types/surveillance';

interface PipelineNavProps {
  currentStage: IntelligenceEngineStage;
  onSelectStage: (stage: IntelligenceEngineStage) => void;
  triangulationConfidence: number;
  overallAlertTier: 'Green' | 'Yellow' | 'Red';
  onOpenAgentModal?: (stage: IntelligenceEngineStage) => void;
}

export const IntelligenceEnginePipelineNav: React.FC<PipelineNavProps> = ({
  currentStage,
  onSelectStage,
  triangulationConfidence,
  overallAlertTier,
  onOpenAgentModal,
}) => {
  const stages = [
    {
      id: 'ingestion' as IntelligenceEngineStage,
      num: '01',
      title: 'Data Ingestion & Sanitization',
      tag: '01 / INGEST',
      subtitle: 'Argao Gatekeeper & PII Cleaning',
      agentName: 'Agent 1 & Agent WH-Ops',
      agentRole: 'PIDSR Webhooks, Sanitizer & Ingestion',
      icon: Database,
    },
    {
      id: 'processing' as IntelligenceEngineStage,
      num: '02',
      title: 'Risk Modeling & 2-SD Aberrations',
      tag: '02 / PROCESS',
      subtitle: 'Rolling Baseline & GAM Splines',
      agentName: 'Agent 2: Risk Modeler',
      agentRole: '2-SD Aberrations & GAM Acceleration',
      icon: Cpu,
    },
    {
      id: 'visualize' as IntelligenceEngineStage,
      num: '03',
      title: 'Google Apps Script Visualizer',
      tag: '03 / VISUALIZE',
      subtitle: 'GAS Dashboard & Spatial Clusters',
      agentName: 'GAS & Visualization Specialist',
      agentRole: 'Apps Script Engine & Spatial Density',
      icon: Flame,
    },
    {
      id: 'output' as IntelligenceEngineStage,
      num: '04',
      title: 'Epidemiological Risk Report',
      tag: '04 / RESPONSE',
      subtitle: 'Report Generator & Action Directives',
      agentName: 'Agent 3: Response Directives',
      agentRole: 'RA 11332 Directives & Risk Report Export',
      icon: ShieldAlert,
    },
    {
      id: 'collaboration' as IntelligenceEngineStage,
      num: '05',
      title: 'Systems Audit & Reflexivity AI',
      tag: '05 / FEEDBACK',
      subtitle: 'Audit, Reflexivity AI & Maintenance',
      agentName: 'Agent 4: Audit & Reflexivity',
      agentRole: 'Internal Audit, AI Reflexivity & Maintenance',
      icon: Share2,
    },
  ];

  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.625rem] text-[rgba(228,228,231,0.5)] uppercase tracking-wider font-semibold">
            5-Stage Public Health Surveillance Lifecycle: Ingest › Process › Visualize › Response › Feedback
          </span>
        </div>
        {onOpenAgentModal && (
          <button
            onClick={() => onOpenAgentModal(currentStage)}
            className="flex items-center gap-1.5 font-mono text-[0.65rem] text-[#06b6d4] hover:text-[#22d3ee] px-2 py-0.5 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 transition-all cursor-pointer font-bold"
            title="Inspect autonomous multi-agent telemetry and system prompts"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Agent Orchestration Dossier</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stages.map(stage => {
          const isActive = currentStage === stage.id;
          const StageIcon = stage.icon;

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer relative flex flex-col justify-between ${
                isActive
                  ? 'border-[#06b6d4] bg-[#06b6d4]/[0.08] ring-1 ring-[#06b6d4]/30 shadow-sm'
                  : 'border-[rgba(228,228,231,0.08)] bg-[#111113] hover:border-white/20 hover:bg-[#141417]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[0.6rem] text-[rgba(228,228,231,0.6)] font-bold tracking-wider">
                    {stage.tag}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse" />
                  )}
                </div>

                <div className="font-semibold text-xs text-white my-0.5 truncate">
                  {stage.title}
                </div>
                <div className="font-mono text-[0.6rem] text-[rgba(228,228,231,0.5)] mb-2 truncate">
                  {stage.subtitle}
                </div>
              </div>

              {/* Assigned Agent Pill */}
              <div
                onClick={e => {
                  if (onOpenAgentModal) {
                    e.stopPropagation();
                    onOpenAgentModal(stage.id);
                  }
                }}
                className={`pt-2 mt-2 border-t border-[rgba(228,228,231,0.06)] flex items-center justify-between group/agent ${
                  onOpenAgentModal ? 'hover:text-[#06b6d4]' : ''
                }`}
                title="Click to inspect this agent's dossier"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Bot className="w-3 h-3 text-[#06b6d4] shrink-0" />
                  <span className="font-mono text-[0.58rem] font-bold text-zinc-300 group-hover/agent:text-[#06b6d4] truncate">
                    {stage.agentName}
                  </span>
                </div>
                <span className="font-mono text-[0.52rem] px-1 py-0.2 rounded bg-white/5 text-zinc-400 shrink-0 ml-1">
                  AI
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
