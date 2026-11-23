import React, { useState, useEffect } from 'react';
import {
  Dna,
  Layers,
  BookOpen,
  Activity,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Search,
  FlaskConical,
  Microscope,
} from 'lucide-react';

interface BioscienceSkillsHubProps {
  selectedSerotype?: string;
}

export const BioscienceSkillsHub: React.FC<BioscienceSkillsHubProps> = () => {
  const [activeTab, setActiveTab] = useState<'ns1' | 'serotypes' | 'kinetics' | 'literature'>('ns1');
  const [diagnosticDay, setDiagnosticDay] = useState<number>(3);
  const [pathologyData, setPathologyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/science/dengue-pathology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'ns1_structure_and_serotypes' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setPathologyData(data.data);
        }
      })
      .catch(err => console.warn('Pathology data fetch warning:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Diagnostic biomarker window calculation based on Day of Illness
  const getBiomarkerStatus = (day: number) => {
    if (day <= 3) {
      return {
        phase: 'Early Acute Viremic Phase',
        ns1Confidence: 'High (95% Sensitivity)',
        igmConfidence: 'Negative / Undetectable',
        viremiaLevel: 'Peak Viral Load (10^7 - 10^8 copies/mL)',
        clinicalAction: 'Gold standard test: Dengue NS1 Antigen RDT or RT-PCR. Pre-position oral rehydration immediately.',
      };
    } else if (day <= 5) {
      return {
        phase: 'Critical Transition Window',
        ns1Confidence: 'Moderate (70-80% Sensitivity)',
        igmConfidence: 'Emerging Seroconversion (30-50%)',
        viremiaLevel: 'Declining rapidly',
        clinicalAction: 'Order dual NS1 + Dengue IgM combo test. Monitor hematocrit for plasma leakage signs.',
      };
    } else {
      return {
        phase: 'Convalescent Serological Phase',
        ns1Confidence: 'Negative / Cleared from Circulation',
        igmConfidence: 'High Positive (85-95% Sensitivity)',
        viremiaLevel: 'Cleared / Undetectable',
        clinicalAction: 'Rely on Dengue IgM/IgG serology. Monitor for organ impairment or recovery reabsorption.',
      };
    }
  };

  const biomarkerStatus = getBiomarkerStatus(diagnosticDay);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-5 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Bioscience &amp; Molecular Pathology Hub</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Science Skills Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              DENV structural bioinformatics, AlphaFold pLDDT scores, diagnostic kinetics, and PubMed literature
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ns1')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'ns1' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            NS1 Structure
          </button>
          <button
            onClick={() => setActiveTab('serotypes')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'serotypes' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Serotypes (1–4)
          </button>
          <button
            onClick={() => setActiveTab('kinetics')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'kinetics' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Biomarker Kinetics
          </button>
          <button
            onClick={() => setActiveTab('literature')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'literature' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            PubMed Literature
          </button>
        </div>
      </div>

      {/* TAB 1: NS1 Structural Biology */}
      {activeTab === 'ns1' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Structural Specs Card */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="text-[11px] font-mono uppercase text-purple-400 font-bold">
                AlphaFold &amp; PDB Protein Registry
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">PDB ID:</span>
                  <span className="text-white font-bold">4O6B</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">UniProt Accession:</span>
                  <span className="text-cyan-400 font-bold">P27909 (POLG_DEN26)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Molecular Weight:</span>
                  <span className="text-slate-200">48.0 kDa (monomer)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Quaternary Complex:</span>
                  <span className="text-slate-200">Hexameric barrel (sNS1)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">AlphaFold pLDDT Score:</span>
                  <span className="text-emerald-400 font-bold">92.4 (Very High Confidence)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/50 text-[11px] text-purple-200 leading-relaxed">
                Secreted NS1 (sNS1) functions as a direct viral vascular permeability toxin, triggering endothelial glycocalyx degradation and plasma leakage in severe dengue.
              </div>
            </div>

            {/* Interactive Domain Mapping */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    NS1 Polypeptide Domain Architecture (352 Residues)
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Residues 1–352</span>
                </div>

                {/* Schematic Domain Diagram */}
                <div className="h-12 w-full rounded-lg overflow-hidden flex border border-slate-700 font-mono text-[10px] font-bold text-center">
                  <div
                    className="h-full bg-blue-600 flex items-center justify-center text-white"
                    style={{ width: '15%' }}
                    title="Residues 1-29: Beta-roll domain (dimerization scaffold)"
                  >
                    β-Roll (1-29)
                  </div>
                  <div
                    className="h-full bg-purple-600 flex items-center justify-center text-white"
                    style={{ width: '45%' }}
                    title="Residues 30-180: Wing domain (lipid membrane binding)"
                  >
                    Wing Domain (30-180)
                  </div>
                  <div
                    className="h-full bg-cyan-600 flex items-center justify-center text-white"
                    style={{ width: '40%' }}
                    title="Residues 181-352: Beta-ladder domain (TLR4 binding & antigenicity)"
                  >
                    β-Ladder Domain (181-352)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-[11px] text-slate-300">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-blue-400 block">β-Roll (1–29)</strong>
                    Forms central hydrophobic core for dimer stabilization.
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-purple-400 block">Wing (30–180)</strong>
                    Contains Trp115 loop engaging endothelial cell membranes.
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-cyan-400 block">β-Ladder (181–352)</strong>
                    Primary epitope recognized by diagnostic monoclonal antibodies.
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Diagnostic Window: Days 1–5 post-fever</span>
                <a
                  href="https://www.rcsb.org/structure/4O6B"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Inspect RCSB PDB 4O6B</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DENV Serotypes 1–4 */}
      {activeTab === 'serotypes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              code: 'DENV-1',
              strain: 'Genotype IV (Pacific/Asian)',
              severity: 'Moderate',
              features: 'High viremia; classical breakbone fever with retro-orbital pain; prevalent in school-age cohorts.',
              color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',
            },
            {
              code: 'DENV-2',
              strain: 'Cosmopolitan Genotype',
              severity: 'Severe Risk',
              features: 'Dominant Central Visayas lineage. Highest association with secondary dengue shock syndrome (DSS) via antibody-dependent enhancement (ADE).',
              color: 'border-rose-500/40 bg-rose-950/20 text-rose-400',
            },
            {
              code: 'DENV-3',
              strain: 'Genotype I',
              severity: 'High Warning Signs',
              features: 'Co-circulating in southern Cebu. Frequent hepatic transaminase elevations and spontaneous mucosal petechiae.',
              color: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
            },
            {
              code: 'DENV-4',
              strain: 'Genotype II',
              severity: 'Mild to Moderate',
              features: 'Lowest clinical hospitalization rate; sporadic endemic detection throughout Region VII surveillance corridors.',
              color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
            },
          ].map(s => (
            <div key={s.code} className={`p-4 rounded-xl border flex flex-col justify-between ${s.color}`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold font-mono">{s.code}</span>
                  <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {s.severity}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mb-2">{s.strain}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{s.features}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                Cross-neutralization titer: Variable
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Diagnostic Biomarker Kinetics */}
      {activeTab === 'kinetics' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white">Diagnostic Biomarker Window Simulator</div>
              <p className="text-xs text-slate-400">
                Drag the illness day slider to view expected viral antigen vs serological titer trajectories
              </p>
            </div>
            <div className="text-sm font-mono font-bold text-cyan-400 px-3 py-1 rounded bg-slate-900 border border-slate-700">
              Day {diagnosticDay} of Fever
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min={1}
              max={14}
              value={diagnosticDay}
              onChange={e => setDiagnosticDay(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Day 1 (Onset)</span>
              <span>Day 3 (Peak NS1)</span>
              <span>Day 5 (Critical Transition)</span>
              <span>Day 8 (IgM Peak)</span>
              <span>Day 14 (Convalescent)</span>
            </div>
          </div>

          {/* Biomarker Status Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Clinical Phase</span>
              <span className="text-sm font-bold text-white">{biomarkerStatus.phase}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">NS1 Ag Sensitivity</span>
              <span className="text-sm font-bold text-cyan-400">{biomarkerStatus.ns1Confidence}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">IgM Seroconversion</span>
              <span className="text-sm font-bold text-amber-400">{biomarkerStatus.igmConfidence}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 text-xs font-mono text-blue-200">
            <strong>DOH Clinical Directive:</strong> {biomarkerStatus.clinicalAction}
          </div>
        </div>
      )}

      {/* TAB 4: PubMed Literature */}
      {activeTab === 'literature' && (
        <div className="space-y-2.5">
          {pathologyData?.literatureReferences?.map((paper: any) => (
            <div
              key={paper.pmid}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-white hover:text-cyan-400 transition-colors"
                  >
                    {paper.title}
                  </a>
                </div>
                <div className="text-[11px] font-mono text-slate-400 ml-6">
                  {paper.journal} · {paper.year} · PMID: {paper.pmid} · DOI: {paper.doi}
                </div>
              </div>

              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-400 border border-slate-700 flex items-center gap-1 shrink-0"
              >
                <span>PubMed</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )) || (
            <div className="p-4 text-center text-xs text-slate-500 font-mono">
              Loading peer-reviewed literature citations...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
