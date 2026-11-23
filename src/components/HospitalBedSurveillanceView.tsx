import React, { useState, useEffect } from 'react';
import {
  Bed,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Clock,
  Droplets,
  HeartPulse,
  Share2,
  FileText,
  Building2,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { HospitalBedCapacityReport, IntelligenceEngineStage } from '../types/surveillance';

interface HospitalBedSurveillanceViewProps {
  onSelectStage?: (stage: IntelligenceEngineStage) => void;
  onOpenReportModal?: () => void;
}

export const HospitalBedSurveillanceView: React.FC<HospitalBedSurveillanceViewProps> = ({
  onSelectStage,
  onOpenReportModal,
}) => {
  const [report, setReport] = useState<HospitalBedCapacityReport | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string>('https://www.facebook.com/share/p/19jG4RfAoc/');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [customBulletinText, setCustomBulletinText] = useState<string>('');
  const [showAdvancedExtraction, setShowAdvancedExtraction] = useState<boolean>(false);
  const [rejectionTestOutput, setRejectionTestOutput] = useState<{
    status: 'IDLE' | 'REJECTED' | 'ACCEPTED';
    message: string;
    reason?: string;
  }>({ status: 'IDLE', message: '' });

  // Fetch current hospital bed status from backend
  const fetchCurrentBedStatus = async () => {
    try {
      const res = await fetch('/api/hospital/bed-capacity/current');
      const data = await res.json();
      if (data.success && data.data) {
        setReport(data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch bed status from server, initializing default state.');
    }
  };

  useEffect(() => {
    fetchCurrentBedStatus();
  }, []);

  // Trigger Facebook / Social Post Data Extraction
  const handleExtractFromUrl = async (urlToExtract?: string) => {
    const targetUrl = urlToExtract || sourceUrl;
    setIsLoading(true);
    setRejectionTestOutput({ status: 'IDLE', message: '' });

    try {
      const res = await fetch('/api/hospital/bed-capacity/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: targetUrl,
          bulletinText: customBulletinText || undefined,
          facilityName: 'Dr. Isidro C. Kintanar Memorial Hospital',
          forceSurgeVariation: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setReport(data.data);
        setRejectionTestOutput({
          status: 'ACCEPTED',
          message: `ACCEPTED & VERIFIED: Extracted from ${targetUrl}. Standard data requirements validated. Zero-PII enforced.`,
        });
      } else {
        setRejectionTestOutput({
          status: 'REJECTED',
          message: data.error || 'Failed to extract data.',
        });
      }
    } catch (err: any) {
      setRejectionTestOutput({
        status: 'REJECTED',
        message: `Extraction Error: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test Gatekeeper Rejection with Cross-Border or Malformed Data
  const handleTestRejectionGatekeeper = async (type: 'CROSS_BORDER' | 'MALFORMED_SCHEMA') => {
    setIsLoading(true);
    try {
      let payload: any = {};
      if (type === 'CROSS_BORDER') {
        payload = {
          facilityName: 'Carcar District Hospital',
          psgc: '072214000', // Carcar City PSGC, outside Argao
          totalInpatients: 45,
        };
      } else {
        payload = {
          invalidPayload: true,
          patientNames: ['Juan Dela Cruz', 'Maria Santos'], // PII violation
        };
      }

      const res = await fetch('/api/hospital/bed-capacity/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setRejectionTestOutput({
          status: 'REJECTED',
          message: data.error,
          reason: data.validationFlags?.join(', '),
        });
      } else {
        setRejectionTestOutput({
          status: 'ACCEPTED',
          message: 'Payload unexpectedly accepted.',
        });
      }
    } catch (e: any) {
      setRejectionTestOutput({
        status: 'REJECTED',
        message: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Live HIS Inbound Webhook Push
  const handleSimulateWebhookPush = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/hospital/bed-capacity/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hospital-signature': 'hmac-sha256-kintanar-verified',
        },
        body: JSON.stringify({
          facilityName: 'Dr. Isidro C. Kintanar Memorial Hospital',
          psgc: '072205000',
          totalInpatients: Math.floor(Math.random() * 6) + 38,
          sourceUrl: 'https://hospital.argao.gov.ph/api/triage/surveillance-ingest',
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setRejectionTestOutput({
          status: 'ACCEPTED',
          message: 'HIS Webhook Push ingested and synchronized with MESU surveillance!',
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!report) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-300">Synchronizing with Isidro C. Kintanar Memorial Hospital bed telemetry...</p>
      </div>
    );
  }

  const {
    authorizedBedCapacity,
    operationalBedCapacity,
    totalInpatients,
    totalAvailableBeds,
    overallBOR,
    surgeAlertLevel,
    surgeStatusText,
    dengueIsolationBeds,
    pediatricWardBeds,
    generalMedicalBeds,
    icuHighDependencyBeds,
    erTriageBacklogCount,
    erFastLaneActive,
    microhematocritTurnaroundMinutes,
    mechanicalVentilatorsAvailable,
    mechanicalVentilatorsTotal,
    ivFluidSupplyDaysRemaining,
    ns1RdtStockAvailable,
    daysToBedCapacityExhaustion,
    referralPressureIndex,
    sourceUrl: currentSourceUrl,
    extractedAt,
    verifiedBySignature,
  } = report;

  return (
    <div className="space-y-6">
      {/* Primary Hospital Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Dr. Isidro C. Kintanar Memorial Hospital (DICKMH)
                </h2>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Argao Referral Hospital
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  PSGC: 072205000
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  DOH Level 1 District Hospital
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Hospital Bed Capacity, Dengue Isolation Ward Occupancy, Fast-Lane Triage, and Secondary Referral Surveillance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 px-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Extracted:</span>
              <strong className="text-white font-bold">{new Date(extractedAt).toLocaleTimeString()}</strong>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                surgeAlertLevel === 'CRITICAL_SURGE' || surgeAlertLevel === 'DISASTER_OVERFLOW'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-950/40 animate-pulse'
                  : surgeAlertLevel === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>
                {surgeAlertLevel === 'CRITICAL_SURGE'
                  ? 'CODE RED: Critical Bed Surge'
                  : surgeAlertLevel === 'WARNING'
                  ? 'YELLOW ALERT: Elevated Admissions'
                  : 'GREEN: Normal Operational BOR'}
              </span>
            </span>
          </div>
        </div>

        {/* Status Text & Fast Lane Indicator */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white">Clinical Status: </span>
              <span className="text-slate-300">{surgeStatusText}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono shrink-0">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Dengue Fast-Lane: ACTIVE
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Stat CBC TAT: {microhematocritTurnaroundMinutes}m (Target &lt;30m)
            </span>
          </div>
        </div>
      </div>

      {/* Webhook & Social Post Extraction Control Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Facebook Advisory &amp; Webhook Extraction Gateway</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Live Listener
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingests official Isidro C. Kintanar Memorial Hospital bed capacity advisories from Facebook or REST Webhooks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedExtraction(!showAdvancedExtraction)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-950 border border-slate-800 cursor-pointer font-mono"
            >
              {showAdvancedExtraction ? 'Hide Inspector' : 'Show Ingest Gatekeeper'}
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <ExternalLink className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="text"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://www.facebook.com/share/p/19jG4RfAoc/ or hospital webhook URL"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <button
            onClick={() => handleExtractFromUrl()}
            disabled={isLoading || !sourceUrl}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Extract Bed Capacity</span>
          </button>

          <button
            onClick={handleSimulateWebhookPush}
            disabled={isSimulating}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-xs font-bold font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
            title="Simulate inbound webhook push from hospital information system"
          >
            {isSimulating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Simulate HIS Push</span>
          </button>
        </div>

        {/* Quick link to original post */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Official Facebook Source:</span>
            <a
              href="https://www.facebook.com/share/p/19jG4RfAoc/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>https://www.facebook.com/share/p/19jG4RfAoc/</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <span className="text-slate-500">Post ID: 19jG4RfAoc • Signature: {verifiedBySignature}</span>
        </div>

        {/* Rejection / Gatekeeper Test Notification */}
        {rejectionTestOutput.status !== 'IDLE' && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              rejectionTestOutput.status === 'ACCEPTED'
                ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
            }`}
          >
            {rejectionTestOutput.status === 'ACCEPTED' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{rejectionTestOutput.message}</p>
              {rejectionTestOutput.reason && (
                <p className="text-[11px] font-mono mt-0.5 text-slate-300">
                  Audit Flag: {rejectionTestOutput.reason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Advanced Ingest Gatekeeper Testing & Verification Drawer */}
        {showAdvancedExtraction && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-white font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Ingest Gatekeeper &amp; Territorial Validation Protocol
              </span>
              <span className="text-[10px] text-slate-400">RA 10173 Zero-PII • Argao PSGC: 072205000</span>
            </div>

            <p className="text-slate-300 font-sans text-xs">
              Every hospital record is checked against standard data requirements:
              1) Facility must match Argao referral boundaries; 
              2) Non-negative numerical bed limits; 
              3) Strict PII stripping (no patient names allowed in surveillance streams).
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-slate-400 text-[11px]">Test Gatekeeper Actions:</span>
              <button
                onClick={() => handleTestRejectionGatekeeper('CROSS_BORDER')}
                className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] cursor-pointer"
              >
                Test Cross-Border Rejection (Carcar PSGC)
              </button>
              <button
                onClick={() => handleTestRejectionGatekeeper('MALFORMED_SCHEMA')}
                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] cursor-pointer"
              >
                Test PII Violation Rejection
              </button>
              <button
                onClick={() => handleExtractFromUrl()}
                className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] cursor-pointer"
              >
                Verify Legitimate DICKMH Advisory
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards: Bed Capacity Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Admitted */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Current Inpatients</span>
            <Bed className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalInpatients}
          </div>
          <div className="text-[11px] text-slate-400">
            Across All Hospital Wards
          </div>
        </div>

        {/* Authorized vs Operational BOR */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Bed Occupancy Rate</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {overallBOR}%
          </div>
          <div className="text-[11px] text-slate-400">
            Authorized: {authorizedBedCapacity} | Op: {operationalBedCapacity} beds
          </div>
        </div>

        {/* Dengue Isolation Ward */}
        <div className="p-4 rounded-xl bg-slate-900 border border-rose-900/40 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-rose-400">Dengue Isolation</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">
            {dengueIsolationBeds.occupiedBeds} / {dengueIsolationBeds.totalBeds}
          </div>
          <div className="text-[11px] text-rose-400 font-mono">
            {dengueIsolationBeds.occupancyPct}% Occupied ({dengueIsolationBeds.availableBeds} vacant)
          </div>
        </div>

        {/* Days to Depletion */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Days to Capacity Limit</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {daysToBedCapacityExhaustion} Days
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Referral Pressure: {referralPressureIndex}%
          </div>
        </div>
      </div>

      {/* Ward Breakdown & Critical Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ward Breakdown Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Specific Ward Utilization Breakdown</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total Vacant: <strong className="text-emerald-400">{totalAvailableBeds} beds</strong>
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Dengue Ward */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  {dengueIsolationBeds.wardName}
                </span>
                <span className="font-mono text-rose-400 font-bold">
                  {dengueIsolationBeds.occupiedBeds} / {dengueIsolationBeds.totalBeds} ({dengueIsolationBeds.occupancyPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                  style={{ width: `${Math.min(100, dengueIsolationBeds.occupancyPct)}%` }}
                />
              </div>
            </div>

            {/* Pediatric Ward */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {pediatricWardBeds.wardName}
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {pediatricWardBeds.occupiedBeds} / {pediatricWardBeds.totalBeds} ({pediatricWardBeds.occupancyPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, pediatricWardBeds.occupancyPct)}%` }}
                />
              </div>
              {pediatricWardBeds.occupiedBeds > pediatricWardBeds.totalBeds && (
                <p className="text-[10px] text-amber-400 font-mono">
                  ⚠ Overflow detected: Temporary observation cots mobilized in pediatric annex.
                </p>
              )}
            </div>

            {/* Adult Medical Ward */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">
                  {generalMedicalBeds.wardName}
                </span>
                <span className="font-mono text-slate-300 font-bold">
                  {generalMedicalBeds.occupiedBeds} / {generalMedicalBeds.totalBeds} ({generalMedicalBeds.occupancyPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, generalMedicalBeds.occupancyPct)}%` }}
                />
              </div>
            </div>

            {/* ICU / High-Dependency */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">
                  {icuHighDependencyBeds.wardName}
                </span>
                <span className="font-mono text-slate-300 font-bold">
                  {icuHighDependencyBeds.occupiedBeds} / {icuHighDependencyBeds.totalBeds} ({icuHighDependencyBeds.occupancyPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min(100, icuHighDependencyBeds.occupancyPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Preparedness & Diagnostics Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Clinical Preparedness &amp; Triage Readiness</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">DOH AO 2016-0043 Compliant</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">ER Triage Backlog:</span>
              <div className="text-base font-bold text-white font-mono">{erTriageBacklogCount} Patients</div>
              <span className="text-[10px] text-slate-500">Awaiting admission / CBC stat</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">IV Fluids Supply:</span>
              <div className="text-base font-bold text-emerald-400 font-mono">{ivFluidSupplyDaysRemaining} Days</div>
              <span className="text-[10px] text-slate-500">D5LR &amp; Plain NSS buffer</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">NS1 RDT Kits Stock:</span>
              <div className="text-base font-bold text-cyan-400 font-mono">{ns1RdtStockAvailable} Units</div>
              <span className="text-[10px] text-slate-500">Zero-charge triage testing</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">Mechanical Ventilators:</span>
              <div className="text-base font-bold text-white font-mono">
                {mechanicalVentilatorsAvailable} / {mechanicalVentilatorsTotal} Available
              </div>
              <span className="text-[10px] text-slate-500">Invasive &amp; HFNC ready</span>
            </div>
          </div>

          {/* Secondary Referral Escalation Corridor */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Secondary Referral Standby:</span>
              <span className="text-indigo-400 font-mono font-bold">Carcar &amp; VSMMC</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If DICKMH bed occupancy exceeds 85%, severe dengue cases with persistent shock or severe hemorrhage are routed via the One Hospital Command corridor to <strong>Carcar Provincial Hospital (18 km)</strong> or <strong>Vicente Sotto Memorial Medical Center (VSMMC, Cebu City)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 5-Stage Public Health Lifecycle Quick Actions */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-medium">
            Cross-Stage Triangulation: Hospital Bed Occupancy is synchronized across all 5 Public Health Stages.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSelectStage && (
            <>
              <button
                onClick={() => onSelectStage('processing')}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-mono cursor-pointer transition-colors"
              >
                Stage 2: Risk Process
              </button>
              <button
                onClick={() => onSelectStage('visualize')}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-mono cursor-pointer transition-colors"
              >
                Stage 3: GAS Visualizer
              </button>
            </>
          )}
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold cursor-pointer transition-all shadow"
            >
              Stage 4: Generate Risk Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
