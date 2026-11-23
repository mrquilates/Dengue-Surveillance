import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  MapPin,
  Search,
  Dna,
  Database,
  Layers,
  Activity,
  CheckCircle2,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface LeadArchitectAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMapsSearch?: () => void;
  onOpenBioscience?: () => void;
}

export const LeadArchitectAgentModal: React.FC<LeadArchitectAgentModalProps> = ({
  isOpen,
  onClose,
  onOpenMapsSearch,
  onOpenBioscience,
}) => {
  if (!isOpen) return null;

  const skillsList = [
    {
      title: 'Total Makeover UI/UX Intelligence Architecture',
      category: 'Design & Standardized Dashboard Engineering',
      desc: 'Obsidian command deck design, Bento-grid spatial mathematics, WCAG AA compliance, and fluid responsive cross-device layout.',
      icon: Layers,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      badge: 'Award-Winning Bento',
    },
    {
      title: 'Google Maps Grounding Engine',
      category: 'Geospatial Ground Verification',
      desc: 'Powered by gemini-3.8-flash with googleMaps tool. Geocodes Isidro Kintanar Memorial Hospital, Rural Health Units, and emergency referral corridors in Argao.',
      icon: MapPin,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      badge: 'gemini-3.8-flash + googleMaps',
    },
    {
      title: 'Google Search Grounding Wire',
      category: 'Real-time DOH Regional Surveillance',
      desc: 'Powered by gemini-3.8-flash with googleSearch tool. Ingests live DOH Central Visayas alerts, circulating serotype distributions, and PAGASA precipitation radar.',
      icon: Search,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      badge: 'gemini-3.8-flash + googleSearch',
    },
    {
      title: 'Bioscience & Structural Bioinformatics Hub',
      category: 'Genomics, Molecular Structures & Literature',
      desc: 'Integrated with DeepMind Science skills. Covers DENV NS1 viral antigen (PDB 4O6B / UniProt P27909), serotypes 1–4, diagnostic biomarker kinetics, and PubMed search.',
      icon: Dna,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      badge: 'Science Skills Suite',
    },
    {
      title: 'Firebase Auth & Cloud Firestore Persistence',
      category: 'Identity & Multi-Tier Cloud Persistence',
      desc: 'Google Sign-In with Firebase Auth, Cloud Firestore rule enforcement, user investigations, and line-list state synchronization with resilient local fallback.',
      icon: Database,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Firebase Auth & Firestore',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Chief Intelligence Systems &amp; Bioscience Architect Agent
                </h3>
                <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                  Lead Orchestrator Assigned
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Designated master agent with full-stack UI/UX makeover, Maps/Search Grounding, Bioscience skills, and Firebase persistence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Executive Overview Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-blue-950/30 to-purple-950/30 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">
                Agent Assignment Profile · EIEWS Mission Command
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Capabilities Operational</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This master agent unifies the complete surveillance spectrum: transforming raw PIDSR clinical line-lists into an award-winning Obsidian Bento command deck, grounding geographical terrain with Google Maps, pulling live DOH advisories with Google Search, deciphering viral pathology via DeepMind Bioscience models, and securing authenticated data across Cloud Firestore.
            </p>
          </div>

          {/* Core Skills Matrix */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase text-slate-400 font-bold">
              Comprehensive Skills Specification
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skillsList.map((skill, idx) => {
                const IconComponent = skill.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg border ${skill.color}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-white">{skill.title}</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400 mb-1">{skill.category}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{skill.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Status: Verified</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {skill.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Interactive Triggers */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white">Interactive Skill Workbenches</div>
              <div className="text-[11px] text-slate-400">Launch grounded reconnaissance or structural bioscience scouts</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenMapsSearch && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMapsSearch();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Launch Maps &amp; Search Grounding</span>
                </button>
              )}
              {onOpenBioscience && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenBioscience();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Dna className="w-3.5 h-3.5" />
                  <span>Open Bioscience Lab</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div>Municipality of Argao · Lead Intelligence Systems &amp; Bioscience Architect</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
