import React from 'react';
import {
  Printer,
  Download,
  X,
  Shield,
  Activity,
  Calendar,
  AlertTriangle,
  FileCheck,
  Building2,
  Stethoscope,
  HeartPulse,
  Bug,
  DollarSign,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  EpidemiologicalMetrics,
  GeoMunicipalitySummary,
  GeoBarangaySummary,
  ValidationReport,
  SurveillanceAlert,
  DemographicStats,
} from '../types/surveillance';
import { triggerCSVDownload } from '../utils/sampleData';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: EpidemiologicalMetrics;
  municipalities: GeoMunicipalitySummary[];
  barangays: GeoBarangaySummary[];
  report: ValidationReport;
  alerts: SurveillanceAlert[];
  demographics: DemographicStats;
  selectedDisease: string;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  municipalities,
  barangays,
  report,
  alerts,
  demographics,
  selectedDisease,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSVReport = () => {
    const lines = [
      'CONFIDENTIAL EXECUTIVE BRIEF - LOCAL HEALTH OFFICERS ONLY',
      'MUNICIPALITY OF ARGAO - PROVINCE OF CEBU',
      `Target Officers,Municipal Health Officer (MHO) | RHU Physicians | Hospital Triage Officers | MESU`,
      `Reporting Morbidity Week,MW ${metrics.latestMorbidityWeek} (${metrics.latestMorbidityYear})`,
      `Report Generated,${new Date().toISOString()}`,
      `Statutory Authority,RA 11332 | RA 10121 (DRRM-H) | DOH AO 2016-0043 | DOH CPG 2012-0006`,
      '',
      'EPIDEMIOLOGICAL SUMMARY',
      `Total Cumulative Cases,${metrics.totalCases}`,
      `Latest Week Notifications,${metrics.newCasesLatestMW}`,
      `WoW Velocity Delta,${metrics.velocityPctChange}%`,
      `Laboratory Confirmed,${metrics.confirmedCases}`,
      `Reported Deaths,${metrics.deaths}`,
      `Case Fatality Rate (CFR),${metrics.cfr}%`,
      `Hospitalization Rate,${metrics.hospitalizationRate}%`,
      `NS1 RDT Window Compliance (Days 1-5),88.5%`,
      `Breteau Index (BI),21.6% (ALERT)`,
      `House Index (HI),14.8% (ALERT)`,
      `Vector Resistance Status,kdr V1016I / F1534C Confirmed (Zero Thermal Fogging)`,
      '',
      'FACILITY BREAKDOWN (ARGAO CATCHMENT)',
      'Facility,Type,Cases Reported,Timeliness %,Fast Lane Status',
      'Rural Health Unit I (Poblacion),Primary Care RHU,38,94.2%,Active ORT Corner',
      'Rural Health Unit II (Taloot),Peripheral RHU,24,89.5%,Peripheral Triage',
      'Isidro C. Kintanar Memorial Hospital,District Hospital,52,96.0%,Dengue Fast Lane ACTIVE',
    ];

    triggerCSVDownload(
      lines.join('\n'),
      `argao_health_officers_brief_MW${metrics.latestMorbidityWeek}.csv`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Modal Controls Bar (Hidden during actual print) */}
        <div className="no-print px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Executive Brief for Local Health Officers Only
            </span>
            <span className="text-[10px] text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 font-bold">
              RESTRICTED: CLINICAL &amp; MESU DIRECTIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSVReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 shadow-md hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Brief / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Brief Document */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black print:p-0">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Formal Republic of the Philippines Header */}
            <div className="border-b-2 border-slate-700 print:border-black pb-4 text-center space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 print:text-slate-700 font-mono font-bold">
                REPUBLIC OF THE PHILIPPINES • PROVINCE OF CEBU • MUNICIPALITY OF ARGAO
              </div>
              <div className="text-[11px] font-bold text-cyan-400 print:text-black uppercase tracking-wider font-mono">
                MUNICIPAL HEALTH OFFICE &amp; MUNICIPAL EPIDEMIOLOGY SURVEILLANCE UNIT (MESU)
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white print:text-black tracking-tight uppercase mt-1">
                EXECUTIVE BRIEF FOR LOCAL HEALTH OFFICERS ONLY
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono pt-1 text-slate-300 print:text-slate-900">
                <span className="bg-slate-900 print:bg-slate-100 px-2 py-0.5 rounded border border-slate-800 print:border-slate-300">
                  Morbidity Week: <strong>MW {metrics.latestMorbidityWeek}, {metrics.latestMorbidityYear}</strong>
                </span>
                <span className="bg-slate-900 print:bg-slate-100 px-2 py-0.5 rounded border border-slate-800 print:border-slate-300">
                  Classification: <strong>OFFICIAL HEALTH OFFICER DIRECTIVE</strong>
                </span>
                <span className="bg-rose-950/60 print:bg-rose-100 text-rose-300 print:text-rose-900 px-2 py-0.5 rounded font-bold border border-rose-800/60">
                  Alert Level: <strong>YELLOW EARLY WARNING (3–5 WEEKS LEAD TIME)</strong>
                </span>
              </div>
            </div>

            {/* Recipient Roster */}
            <div className="p-3.5 rounded-xl bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs font-mono space-y-1">
              <span className="text-slate-400 print:text-slate-600 block uppercase font-bold text-[10px]">
                Addressed Exclusively To Local Health Leadership:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 print:text-slate-900 pt-1 font-sans">
                <div>• <strong>Municipal Health Officer (MHO)</strong>, Argao</div>
                <div>• <strong>Chief of Clinics &amp; Triage Team</strong>, Isidro C. Kintanar Hospital</div>
                <div>• <strong>Rural Health Physicians &amp; PHNs</strong>, RHU I &amp; RHU II</div>
                <div>• <strong>MESU Surveillance Officers &amp; BHW Supervisors</strong></div>
              </div>
              <div className="text-[10px] text-cyan-400 print:text-slate-700 pt-1 font-mono">
                Statutory Anchors: <strong>RA 11332</strong> (Mandatory Reporting) | <strong>DOH AO 2016-0043</strong> (NS1 Timing) | <strong>RA 10121</strong> (DRRM-H Surveillance &amp; Response)
              </div>
            </div>

            {/* 1. Clinical Diagnostic Protocols & Hospital Fast Lanes */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-300 pb-1 flex items-center gap-1.5 font-mono">
                <Stethoscope className="w-4 h-4 text-cyan-400 print:text-black" />
                1. Clinical Triage Mandate &amp; Isidro C. Kintanar Hospital Fast Lanes
              </h2>
              <div className="space-y-2 text-xs text-slate-300 print:text-slate-900 leading-relaxed font-sans">
                <p>
                  <strong>DOH AO No. 2016-0043 Strict Window:</strong> Dengue NS1 Rapid Diagnostic Tests (RDT) must be administered strictly within <strong>Days 1 to 5</strong> of fever onset. Current catchment compliance stands at <strong>88.5%</strong>. All patients presenting on or after Day 6 must transition directly to complete blood count (CBC) with micro-hematocrit/platelet monitoring and IgM serology.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2.5 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                    <span className="font-bold text-cyan-400 print:text-black block">RHU I (Poblacion)</span>
                    <span className="text-slate-400 print:text-slate-600 block text-[10px]">Primary Care Catchment</span>
                    <div className="mt-1 font-sans text-slate-300 print:text-slate-800">
                      Operate active Oral Rehydration Therapy (ORT) corner. Buffer stock: 180 NS1 kits.
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                    <span className="font-bold text-cyan-400 print:text-black block">RHU II (Taloot)</span>
                    <span className="text-slate-400 print:text-slate-600 block text-[10px]">Southern Rural Catchment</span>
                    <div className="mt-1 font-sans text-slate-300 print:text-slate-800">
                      Peripheral fever screening; maintain dedicated transport for urgent referrals.
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-400 print:text-black block">Isidro C. Kintanar Memorial Hospital</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        BOR: 152% (38/25 beds)
                      </span>
                    </div>
                    <span className="text-slate-400 print:text-slate-600 block text-[10px]">
                      District Hospital (PSGC: 072205000) • Source: FB Advisory (19jG4RfAoc) &amp; Webhook
                    </span>
                    <div className="mt-1 font-sans text-slate-300 print:text-slate-800 text-xs">
                      Activate <strong>"Dengue Fast Lane"</strong> for stat CBC/platelets (&lt;30 min). <strong>11/12 Dengue Isolation beds occupied (91.7%)</strong>; Pediatric Ward operating at overflow (9/8 beds).
                    </div>
                    <div className="mt-1.5 text-[10px] font-mono text-cyan-400 print:text-cyan-800">
                      Operational Surge Wing: 50 beds (scalable to 100). Secondary referral standby: Carcar Provincial &amp; VSMMC.
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-[11px] font-mono">
                  <strong>Warning Signs for Immediate Hospitalization:</strong> Severe abdominal pain, persistent vomiting (&gt;3 episodes/hour), mucosal bleeding, clinical fluid accumulation (pleural/ascites), lethargy/restlessness, and rapid drop in platelets with concurrent hematocrit rise &gt;20%.
                </div>
              </div>
            </div>

            {/* 2. Vector Control Directive & Thermal Fogging Prohibition */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-300 pb-1 flex items-center gap-1.5 font-mono">
                <Bug className="w-4 h-4 text-amber-400 print:text-black" />
                2. Vector Intelligence: Mandatory Thermal Fogging Prohibition
              </h2>
              <div className="p-3 rounded-xl bg-rose-950/40 print:bg-rose-50 border border-rose-800/80 print:border-rose-400 text-xs text-rose-200 print:text-rose-950 leading-relaxed font-sans">
                <strong className="font-mono text-rose-300 print:text-rose-900 uppercase block mb-1">
                  Chemical Space Spraying Restriction Notice:
                </strong>
                Documented voltage-gated sodium channel (<em className="font-mono">kdr</em>) mutations <strong className="font-mono">V1016I</strong> and <strong className="font-mono">F1534C</strong> have been confirmed in Central Visayas <em>Aedes aegypti</em> populations. <strong>Indiscriminate thermal fogging is biologically ineffective and strictly prohibited.</strong> Health officers must advise local barangay captains against purchasing unauthorized fogging chemicals.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 block">Breteau Index (BI)</span>
                  <span className="text-base font-bold text-rose-400 print:text-slate-900">21.6%</span>
                  <span className="text-[9px] text-slate-500 block">&ge;20% Alert Trigger</span>
                </div>
                <div className="p-2 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 block">House Index (HI)</span>
                  <span className="text-base font-bold text-rose-400 print:text-slate-900">14.8%</span>
                  <span className="text-[9px] text-slate-500 block">&ge;5% Alert Trigger</span>
                </div>
                <div className="p-2 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 block">7-Day Re-Inspection</span>
                  <span className="text-base font-bold text-emerald-400 print:text-slate-900">89.2%</span>
                  <span className="text-[9px] text-slate-500 block">Target: &ge;85% Met</span>
                </div>
                <div className="p-2 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 block">Predominant Vector Site</span>
                  <span className="text-sm font-bold text-amber-400 print:text-slate-900">Storage Drums</span>
                  <span className="text-[9px] text-slate-500 block">43% of active foci</span>
                </div>
              </div>
            </div>

            {/* 3. Mandatory Reporting Timelines & RA 11332 Compliance */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-300 pb-1 flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-emerald-400 print:text-black" />
                3. PIDSR Mandatory Notification &amp; Investigation Targets
              </h2>
              <div className="space-y-1.5 text-xs text-slate-300 print:text-slate-900 font-sans leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Electronic Notification:</strong> All suspected, probable, and confirmed cases must be logged into online PIDSR within <strong>24 hours</strong> of consultation.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Epidemiological Case Investigation:</strong> Case Investigation Forms (CIF) and household GPS geocoding must be completed by MESU within <strong>24 to 48 hours</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Weekly Audit Synchronization:</strong> Reconcile RHU I, RHU II, and Isidro C. Kintanar Memorial Hospital logbooks every Friday at 15:00H.
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Emergency Medical Logistics & Buffer Stocking */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-300 pb-1 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-black" />
                4. Emergency Medical Logistics &amp; Buffer Stocking (RA 11332 &amp; RA 10121)
              </h2>
              <p className="text-xs text-slate-300 print:text-slate-900 font-sans leading-relaxed">
                The Municipal Disaster Risk Reduction &amp; Management Council (MDRRMC) and RHU Supply Chain Officers must ensure immediate inventory replenishment and zero-charge dispensing:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-slate-400 print:text-slate-600 block text-[10px]">Oral Rehydration &amp; IV Buffers</span>
                  <span className="text-base font-bold text-emerald-400 print:text-black">100% Stock Availability</span>
                  <span className="text-[10px] text-slate-400 block font-sans">Zero-cost ORS sachets, 0.9% NaCl &amp; Lactated Ringer's deployed</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <span className="text-slate-400 print:text-slate-600 block text-[10px]">Rapid Diagnostics Buffer</span>
                  <span className="text-base font-bold text-cyan-400 print:text-black">250 NS1 RDT Kits</span>
                  <span className="text-[10px] text-slate-400 block font-sans">Priority distribution to RHU I (Poblacion) &amp; RHU II (Taloot)</span>
                </div>
              </div>
            </div>

            {/* 5. Health Officer Directives Action Checklist */}
            <div className="space-y-2 pt-2 border-t border-slate-800 print:border-slate-400">
              <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider font-mono">
                Immediate Action Verification Checklist (Next 72 Hours)
              </h3>
              <div className="space-y-1.5 text-xs text-slate-300 print:text-slate-900 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border border-slate-600 rounded flex items-center justify-center text-[9px] font-bold">✓</span>
                  <span>RHU I &amp; RHU II: Verify minimum 100-kit buffer of Dengue NS1 RDTs.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border border-slate-600 rounded flex items-center justify-center text-[9px] font-bold">✓</span>
                  <span>Isidro C. Kintanar Hospital: Keep stat platelet/micro-hematocrit fast lane staffed 24/7.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border border-slate-600 rounded flex items-center justify-center text-[9px] font-bold">✓</span>
                  <span>BHW Teams: Complete 7-day container re-inspections in Balisong, Poblacion, and Talaga.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border border-slate-600 rounded flex items-center justify-center text-[9px] font-bold">✓</span>
                  <span>Health Education: Enforce school OKD-HLI container sweeps; halt any fogging requests.</span>
                </div>
              </div>
            </div>

            {/* Official Signature Endorsement Block */}
            <div className="pt-6 border-t-2 border-slate-700 print:border-black grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs font-mono">
              <div className="space-y-1">
                <div className="border-b border-slate-600 print:border-black pb-8" />
                <span className="font-bold text-white print:text-black block text-[11px]">
                  DR. MUNICIPAL HEALTH OFFICER
                </span>
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">
                  Municipal Health Officer (MHO) • Argao
                </span>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-600 print:border-black pb-8" />
                <span className="font-bold text-white print:text-black block text-[11px]">
                  CHIEF OF CLINICS / TRIAGE HEAD
                </span>
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">
                  Isidro C. Kintanar Memorial Hospital
                </span>
              </div>

              <div className="space-y-1 sm:col-span-1 col-span-2">
                <div className="border-b border-slate-600 print:border-black pb-8" />
                <span className="font-bold text-white print:text-black block text-[11px]">
                  MESU SURVEILLANCE LEAD
                </span>
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">
                  Municipal Epidemiology &amp; Surveillance Unit
                </span>
              </div>
            </div>

            {/* Footer Confidentiality Notice */}
            <div className="pt-4 text-center text-[10px] text-slate-500 font-mono">
              CONFIDENTIAL: FOR INTERNAL USE OF ARGAO LOCAL HEALTH OFFICERS AND REFERRAL PARTNERS ONLY • REPRODUCTION RESTRICTED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
