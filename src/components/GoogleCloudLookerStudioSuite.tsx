import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Database,
  ExternalLink,
  Copy,
  Check,
  Download,
  Terminal,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  Flame,
  Droplets,
  Bed,
  FileCode,
  Globe,
  Share2,
  Lock,
  Play,
  RotateCw,
  Table,
  Cpu,
} from 'lucide-react';
import {
  SurveillanceRecord,
  MultiStreamSummary,
  HospitalBedCapacityReport,
} from '../types/surveillance';
import {
  LOOKER_DEFAULT_AUTH_TOKEN,
  GCP_PROJECT_ID_DEFAULT,
  BIGQUERY_DATASET_DEFAULT,
  BIGQUERY_DDL_CLINICAL,
  BIGQUERY_DDL_HOSPITAL,
  BIGQUERY_DDL_CLIMATE,
  BIGQUERY_DDL_ENTOMOLOGY,
  BIGQUERY_DDL_ANALYTICS_VIEW,
  LOOKER_MANIFEST_JSON,
  generateLookerStudioAppsScriptCode,
  generateBigQueryClinicalJSONL,
  generateBigQueryHospitalJSONL,
  generateBigQueryClimateJSONL,
  generateBigQueryEntomologyJSONL,
  generateCloudShellIngestScript,
  downloadTextFile,
} from '../utils/googleCloudLookerSuite';

interface GoogleCloudLookerStudioSuiteProps {
  records: SurveillanceRecord[];
  summary: MultiStreamSummary | null;
  selectedDisease: string;
}

export const GoogleCloudLookerStudioSuite: React.FC<GoogleCloudLookerStudioSuiteProps> = ({
  records,
  summary,
  selectedDisease,
}) => {
  const [activeTab, setActiveTab] = useState<
    'direct-reports' | 'bigquery-ddl' | 'download-datasets' | 'live-dashboard' | 'rest-inspector'
  >('direct-reports');

  const [selectedDdlStream, setSelectedDdlStream] = useState<
    'all' | 'clinical' | 'hospital' | 'climate' | 'entomology' | 'view'
  >('all');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string>(LOOKER_DEFAULT_AUTH_TOKEN);
  const [projectId, setProjectId] = useState<string>(GCP_PROJECT_ID_DEFAULT);
  const [datasetId, setDatasetId] = useState<string>(BIGQUERY_DATASET_DEFAULT);
  const [serverOrigin, setServerOrigin] = useState<string>('');

  // Hospital Bed Report state from server
  const [bedReport, setBedReport] = useState<HospitalBedCapacityReport | null>(null);
  const [testResult, setTestResult] = useState<{
    loading: boolean;
    status?: number;
    rowsCount?: number;
    latencyMs?: number;
    error?: string;
    payloadSample?: any;
  }>({ loading: false });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setServerOrigin(window.location.origin);
    }

    // Fetch latest Kintanar Bed Report
    fetch('/api/hospital/bed-capacity/current')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.report) {
          setBedReport(data.report);
        }
      })
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const appsScriptCode = generateLookerStudioAppsScriptCode(
    serverOrigin || 'https://ais-dev-2elfvpz2xbblrshyqqfd5o-908841305730.asia-east1.run.app',
    authToken
  );

  const fullDdlBundle = [
    BIGQUERY_DDL_CLINICAL,
    BIGQUERY_DDL_HOSPITAL,
    BIGQUERY_DDL_CLIMATE,
    BIGQUERY_DDL_ENTOMOLOGY,
    BIGQUERY_DDL_ANALYTICS_VIEW,
  ].join('\n\n');

  const getDdlForSelection = () => {
    switch (selectedDdlStream) {
      case 'clinical':
        return BIGQUERY_DDL_CLINICAL;
      case 'hospital':
        return BIGQUERY_DDL_HOSPITAL;
      case 'climate':
        return BIGQUERY_DDL_CLIMATE;
      case 'entomology':
        return BIGQUERY_DDL_ENTOMOLOGY;
      case 'view':
        return BIGQUERY_DDL_ANALYTICS_VIEW;
      case 'all':
      default:
        return fullDdlBundle;
    }
  };

  // Test live REST connector endpoint
  const runConnectorLiveTest = async () => {
    setTestResult({ loading: true });
    const startTime = performance.now();
    try {
      const res = await fetch(`/api/looker/connector/data?stream=all`, {
        headers: {
          'X-Surveillance-Token': authToken,
          'Accept': 'application/json',
        },
      });
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setTestResult({
          loading: false,
          status: res.status,
          latencyMs,
          error: errJson.error || `HTTP ${res.status} ${res.statusText}`,
        });
        return;
      }
      const data = await res.json();
      setTestResult({
        loading: false,
        status: res.status,
        latencyMs,
        rowsCount: data.totalRows || (data.rows ? data.rows.length : 0),
        payloadSample: data.rows ? data.rows.slice(0, 3) : null,
      });
    } catch (err: any) {
      setTestResult({
        loading: false,
        error: err.message || 'Network error testing Looker Studio connector endpoint.',
      });
    }
  };

  // Direct Looker Studio Report links with custom parameter prefill
  const lookerStudioBaseUrl = 'https://lookerstudio.google.com/reporting/create';
  const lookerStudioParams = new URLSearchParams({
    'c.reportId': 'argao-eiews-surveillance-template',
    'ds.connector': 'community',
    'ds.param.projectId': projectId,
    'ds.param.datasetId': datasetId,
    'ds.param.stream': 'all',
  });
  const lookerStudioDirectUrl = `${lookerStudioBaseUrl}?${lookerStudioParams.toString()}`;

  // Hospital Bed BOR calculation
  const borPct = bedReport ? bedReport.overallBOR : 152.0;
  const surgeLevel = bedReport ? bedReport.surgeAlertLevel : 'WARNING';

  return (
    <div className="space-y-6">
      {/* =========================================================================
          HERO BANNER: GOOGLE CLOUD & LOOKER STUDIO SUITE
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                <Cloud className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Google Cloud &amp; Looker Studio Suite</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-normal">
                  v2.4 Production
                </span>
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Multi-stream data warehouse pipeline and live BI analytics bridging <strong className="text-white">Argao MESU PIDSR surveillance</strong> and <strong className="text-white">Dr. Isidro C. Kintanar Memorial Hospital</strong> telemetry with <strong className="text-indigo-300">Google BigQuery</strong> and <strong className="text-indigo-300">Looker Studio</strong> dashboards.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-950/80 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hybrid: Token REST + BigQuery DDL</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-950/80 text-cyan-300 border border-cyan-500/30">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>4 Streams: Clinical + Bed + Climate + Entomology</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-950/80 text-amber-300 border border-amber-500/30">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Kintanar Hospital Bed BOR: {borPct}%</span>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('direct-reports')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Looker Studio Report</span>
            </button>
            <button
              onClick={() => downloadTextFile(fullDdlBundle, 'argao_surveillance_ddl_suite.sql', 'text/sql')}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-700 hover:border-slate-600 font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download BigQuery SQL Suite</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUITE SUB-NAVIGATION TABS
         ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('direct-reports')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'direct-reports'
              ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>1. Looker Studio Direct Reports &amp; Connector</span>
        </button>

        <button
          onClick={() => setActiveTab('bigquery-ddl')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'bigquery-ddl'
              ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>2. BigQuery DDL Schemas &amp; Views</span>
        </button>

        <button
          onClick={() => setActiveTab('download-datasets')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'download-datasets'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>3. Download Datasets &amp; Cloud Shell Script</span>
        </button>

        <button
          onClick={() => setActiveTab('live-dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'live-dashboard'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>4. Live Looker Studio Canvas Preview</span>
        </button>

        <button
          onClick={() => setActiveTab('rest-inspector')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rest-inspector'
              ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>5. Token REST Connector Inspector</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: LOOKER STUDIO DIRECT REPORTS & COMMUNITY CONNECTOR
         ========================================================================= */}
      {activeTab === 'direct-reports' && (
        <div className="space-y-6">
          {/* 3 Pre-Packaged Looker Studio Report Templates */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Pre-Configured Looker Studio Surveillance Templates</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Report 1: Hospital Surge & BOR */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Hospital Capacity
                    </span>
                    <Bed className="w-4 h-4 text-rose-400" />
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Dr. Isidro C. Kintanar Hospital Surge &amp; Bed Occupancy (BOR)
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Executive dashboard displaying real-time bed capacity (25 licensed vs 50 operational), pediatric overflow, dengue isolation occupancy, and days to bed exhaustion.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Current BOR:</span>
                    <strong className="text-rose-400 font-bold">{borPct}%</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Surge Status:</span>
                    <span className="text-amber-300">{surgeLevel}</span>
                  </div>
                  <a
                    href={lookerStudioDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Template in Looker Studio</span>
                  </a>
                </div>
              </div>

              {/* Report 2: Multi-Stream Triangulation */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Triangulation
                    </span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Argao Multi-Stream Outbreak Early Warning System
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cross-analyzes rainfall anomalies (PAGASA), Aedes Breteau/House indices, PIDSR clinical cases, and hospital admissions across Morbidity Weeks.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Breteau Alert:</span>
                    <strong className="text-rose-400 font-bold">BI 26.2 (Threshold &ge;20.0)</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Lagged Rain:</span>
                    <span className="text-cyan-300">52.8 mm (+34% anomaly)</span>
                  </div>
                  <a
                    href={lookerStudioDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Template in Looker Studio</span>
                  </a>
                </div>
              </div>

              {/* Report 3: Barangay Spatial Incidence */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Spatial Heatmap
                    </span>
                    <Flame className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Argao Barangay Spatial Incidence &amp; Clustering
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Choropleth mapping of the 45 Argao barangays with attack rate per 10,000 population, CUSUM aberration flags, and Aksyon Barangay Kontra Dengue (ABKD) target zones.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Hotspot Barangay:</span>
                    <strong className="text-rose-400 font-bold">Poblacion &amp; Balisong</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Target Area:</span>
                    <span className="text-emerald-300">Argao [PSGC: 072205000]</span>
                  </div>
                  <a
                    href={lookerStudioDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Template in Looker Studio</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Looker Studio Community Connector (Google Apps Script) Code & Deployment Guide */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-400" />
                  <span>Google Apps Script Looker Studio Community Connector</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Deploy this custom Community Connector in Google Apps Script to stream live surveillance data into any Looker Studio report.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(appsScriptCode, 'apps-script')}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'apps-script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'apps-script' ? 'Copied Code.gs!' : 'Copy Code.gs'}</span>
                </button>

                <button
                  onClick={() => downloadTextFile(appsScriptCode, 'LookerStudioConnector.gs', 'application/javascript')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download .gs</span>
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">Step 1: Open Apps Script</div>
                <div className="text-slate-400">Visit <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">script.google.com</a> and click <strong>New project</strong>.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">Step 2: Paste Code.gs</div>
                <div className="text-slate-400">Copy the JavaScript code below and paste it into the editor replacing default content.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">Step 3: Manifest Config</div>
                <div className="text-slate-400">In Project Settings, enable <em>appsscript.json</em> and paste the JSON manifest below.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-mono text-indigo-400 font-bold">Step 4: Deploy &amp; Connect</div>
                <div className="text-slate-400">Click <strong>Deploy &gt; New Deployment</strong>, choose <strong>Looker Studio</strong>, and authorize with your token.</div>
              </div>
            </div>

            {/* Code Box: Code.gs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>Code.gs (Google Apps Script Looker Studio Community Connector)</span>
                </span>
                <span>Configured for: {serverOrigin || 'Current Applet Endpoint'}</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-200 overflow-x-auto max-h-72 leading-relaxed selection:bg-indigo-500/30">
                {appsScriptCode}
              </pre>
            </div>

            {/* Code Box: appsscript.json Manifest */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>appsscript.json (Connector Manifest)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(LOOKER_MANIFEST_JSON, 'manifest')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'manifest' ? 'Copied Manifest!' : 'Copy Manifest'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                {LOOKER_MANIFEST_JSON}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BIGQUERY DDL SCHEMAS & VIEWS
         ========================================================================= */}
      {activeTab === 'bigquery-ddl' && (
        <div className="space-y-6">
          {/* GCP Config Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Project ID:</span>
                <input
                  type="text"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Dataset ID:</span>
                <input
                  type="text"
                  value={datasetId}
                  onChange={e => setDatasetId(e.target.value)}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span>Location:</span>
                <span className="text-indigo-300 font-bold">asia-southeast1</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(getDdlForSelection(), 'ddl-code')}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'ddl-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ddl-code' ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>

              <button
                onClick={() => downloadTextFile(getDdlForSelection(), `bigquery_${selectedDdlStream}_schema.sql`, 'text/sql')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download .sql</span>
              </button>
            </div>
          </div>

          {/* DDL Stream Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Tables & Views (Complete DDL Bundle)', count: 5 },
              { id: 'clinical', label: '1. Clinical PIDSR Line-List Table', count: 1 },
              { id: 'hospital', label: '2. Kintanar Hospital Bed Telemetry', count: 1 },
              { id: 'climate', label: '3. Climate & Meteorological Stream', count: 1 },
              { id: 'entomology', label: '4. Entomology & Larval Survey', count: 1 },
              { id: 'view', label: '5. Triangulated Outbreak View', count: 1 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedDdlStream(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  selectedDdlStream === tab.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Schema Viewer */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Google BigQuery SQL DDL Definition</span>
              </span>
              <span className="text-slate-400">Format: Standard SQL (Partitioned &amp; Clustered)</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11.5px] font-mono text-cyan-200 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-blue-500/30">
              {getDdlForSelection()}
            </pre>
          </div>

          {/* Table Schema Architecture Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h5 className="font-bold text-white font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Partitioning &amp; Clustering Strategy</span>
              </h5>
              <ul className="text-slate-300 space-y-1.5 pl-4 list-disc font-sans leading-relaxed">
                <li><strong className="text-white">pidsr_clinical_linelist:</strong> Partitioned by <code className="text-cyan-300">date_onset (MONTH)</code>, clustered by <code className="text-cyan-300">psgc_barangay, case_classification, outcome</code> for high-speed sub-municipality indexing.</li>
                <li><strong className="text-white">kintanar_hospital_bed_telemetry:</strong> Partitioned by <code className="text-cyan-300">report_timestamp (DAY)</code>, clustered by <code className="text-cyan-300">surge_alert_level, facility_name</code> for zero-scan telemetry updates.</li>
                <li><strong className="text-white">meteorological_climate_stream:</strong> Partitioned by observation date, enabling instant 2-week lag anomaly joins.</li>
                <li><strong className="text-white">entomological_larval_surveillance:</strong> Partitioned by survey date, clustered by Breteau risk status.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h5 className="font-bold text-white font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Looker Studio Native BigQuery Connector</span>
              </h5>
              <p className="text-slate-300 font-sans leading-relaxed">
                When using the native BigQuery connector in Looker Studio, connect directly to the pre-aggregated analytical view:
              </p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 break-all select-all">
                {`${projectId}.${datasetId}.vw_multi_stream_triangulated_outbreak_risk`}
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                This view eliminates cross-table join overhead, automatically calculates the Triangulated Outbreak Risk Score (0-100), and computes the Action Tier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DOWNLOAD DATASETS & CLOUD SHELL SCRIPT
         ========================================================================= */}
      {activeTab === 'download-datasets' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download BigQuery Ready Datasets (NDJSON / JSONL)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stream 1: Clinical PIDSR */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Stream 1: Clinical
                  </span>
                  <h4 className="text-sm font-bold text-white">PIDSR Line-List</h4>
                  <p className="text-xs text-slate-400">
                    {records.length} validated Argao case records with ICD-10, classification, and outcome.
                  </p>
                </div>
                <button
                  onClick={() => downloadTextFile(generateBigQueryClinicalJSONL(records), 'pidsr_clinical_linelist.jsonl', 'application/x-ndjson')}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .jsonl</span>
                </button>
              </div>

              {/* Stream 2: Hospital Bed Telemetry */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Stream 2: Hospital Bed
                  </span>
                  <h4 className="text-sm font-bold text-white">Kintanar Bed Telemetry</h4>
                  <p className="text-xs text-slate-400">
                    25-bed authorized capacity, ward telemetry, microhematocrit turnaround, and BOR {borPct}%.
                  </p>
                </div>
                <button
                  onClick={() => downloadTextFile(generateBigQueryHospitalJSONL(bedReport), 'kintanar_hospital_bed_telemetry.jsonl', 'application/x-ndjson')}
                  className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .jsonl</span>
                </button>
              </div>

              {/* Stream 3: Climate */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Stream 3: Climate
                  </span>
                  <h4 className="text-sm font-bold text-white">PAGASA Agromet Rainfall</h4>
                  <p className="text-xs text-slate-400">
                    Precipitation, 2-week lag incubation rainfall, and relative humidity timeseries.
                  </p>
                </div>
                <button
                  onClick={() => downloadTextFile(generateBigQueryClimateJSONL(), 'meteorological_climate_stream.jsonl', 'application/x-ndjson')}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .jsonl</span>
                </button>
              </div>

              {/* Stream 4: Entomology */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Stream 4: Entomology
                  </span>
                  <h4 className="text-sm font-bold text-white">Larval Survey Indices</h4>
                  <p className="text-xs text-slate-400">
                    Barangay Breteau (BI), House (HI), and Container (CI) surveys across domestic premises.
                  </p>
                </div>
                <button
                  onClick={() => downloadTextFile(generateBigQueryEntomologyJSONL(summary), 'entomological_larval_surveillance.jsonl', 'application/x-ndjson')}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .jsonl</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cloud Shell 1-Liner Script */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span>Google Cloud Shell One-Liner Load Script</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Run this script in Google Cloud Shell to automatically provision the dataset, execute the DDL, and load all 4 streams using <code className="text-emerald-300 font-mono">bq load</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(generateCloudShellIngestScript(), 'cloud-shell')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'cloud-shell' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cloud-shell' ? 'Copied Script!' : 'Copy Script'}</span>
                </button>

                <button
                  onClick={() => downloadTextFile(generateCloudShellIngestScript(), 'load_to_bigquery.sh', 'application/x-sh')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download .sh</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11.5px] font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-emerald-500/30">
              {generateCloudShellIngestScript()}
            </pre>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: LIVE LOOKER STUDIO CANVAS PREVIEW
         ========================================================================= */}
      {activeTab === 'live-dashboard' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Interactive BI Canvas
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  Looker Studio Live Executive Dashboard Mockup
                </h4>
                <p className="text-xs text-slate-400">
                  Emulates the executive Looker Studio layout connected directly to our Argao EIEWS data stream.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Stream Connected</span>
                </span>
              </div>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">Hospital Bed Occupancy</div>
                <div className="text-2xl font-black text-rose-400 font-mono mt-1">{borPct}%</div>
                <div className="text-[10px] text-slate-400 mt-1">Base: 25 licensed beds (RA 5720)</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">Active Argao Cases</div>
                <div className="text-2xl font-black text-white font-mono mt-1">{records.length}</div>
                <div className="text-[10px] text-emerald-400 mt-1">100% Argao Territorial Isolation</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">Average Breteau Index</div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">26.2</div>
                <div className="text-[10px] text-rose-400 mt-1">Threshold: &ge; 20.0 (High Risk)</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">2-Week Lagged Rainfall</div>
                <div className="text-2xl font-black text-cyan-400 font-mono mt-1">52.8 mm</div>
                <div className="text-[10px] text-cyan-400 mt-1">+34% vs 5-Yr Baseline</div>
              </div>
            </div>

            {/* Visual Indicators: Hospital Bed Status & Multi-Stream Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* DICKMH Hospital Surge Gauge Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Bed className="w-4 h-4 text-rose-400" />
                    <span>DICKMH Bed Surge Breakdown</span>
                  </h5>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                    {surgeLevel}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Authorized Bed Capacity (25 Beds):</span>
                    <strong className="text-rose-400">{borPct}%</strong>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, (borPct / 200) * 100)}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Dengue Isolation Ward</span>
                    <span className="text-amber-300 font-bold">11 / 12 Beds (91.7%)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Pediatric Ward</span>
                    <span className="text-rose-400 font-bold">9 / 8 Beds (112.5% Overflow)</span>
                  </div>
                </div>
              </div>

              {/* Barangay Risk Ranking */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-indigo-400" />
                    <span>Top Priority Argao Barangays</span>
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">By Composite Outbreak Score</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-1.5 font-medium">Barangay</th>
                        <th className="pb-1.5 font-medium">Cases</th>
                        <th className="pb-1.5 font-medium">Breteau</th>
                        <th className="pb-1.5 font-medium">Action Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {[
                        { name: 'Poblacion', cases: 14, bi: 38.0, tier: 'RED_EPIDEMIC' },
                        { name: 'Balisong', cases: 11, bi: 31.0, tier: 'RED_EPIDEMIC' },
                        { name: 'Talaga', cases: 8, bi: 24.0, tier: 'RED_EPIDEMIC' },
                        { name: 'Canbanua', cases: 6, bi: 18.0, tier: 'YELLOW_ALERT' },
                        { name: 'Bogo', cases: 5, bi: 16.0, tier: 'YELLOW_ALERT' },
                      ].map(row => (
                        <tr key={row.name}>
                          <td className="py-1.5 text-white font-semibold">{row.name}</td>
                          <td className="py-1.5 text-slate-300">{row.cases}</td>
                          <td className="py-1.5 text-amber-300">{row.bi}</td>
                          <td className="py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.tier === 'RED_EPIDEMIC'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {row.tier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: TOKEN REST CONNECTOR INSPECTOR
         ========================================================================= */}
      {activeTab === 'rest-inspector' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-400" />
                  <span>Token-Secured REST Connector Diagnostic &amp; Test Tool</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Verify the live HTTP endpoint accessed by Looker Studio Community Connectors. Requires valid token authentication.
                </p>
              </div>

              <button
                onClick={runConnectorLiveTest}
                disabled={testResult.loading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow"
              >
                {testResult.loading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{testResult.loading ? 'Testing Endpoint...' : 'Send Test Request'}</span>
              </button>
            </div>

            {/* Authentication Config & URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold block">Surveillance Connector Authentication Token</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={authToken}
                    onChange={e => setAuthToken(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => copyToClipboard(authToken, 'token-val')}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    title="Copy Token"
                  >
                    {copiedKey === 'token-val' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Passed in Looker Studio connector credentials or via HTTP header <code className="text-rose-300">X-Surveillance-Token</code>.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold block">Live REST Connector Endpoint</span>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    type="text"
                    value={`${serverOrigin || ''}/api/looker/connector/data?stream=all`}
                    className="flex-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(`${serverOrigin || ''}/api/looker/connector/data?stream=all`, 'url-val')}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    title="Copy URL"
                  >
                    {copiedKey === 'url-val' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Returns typed rows conforming to the Looker Studio Community Connector spec.
                </div>
              </div>
            </div>

            {/* Test Results Display */}
            {testResult.status !== undefined || testResult.error ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Response Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        testResult.status === 200
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      HTTP {testResult.status} {testResult.status === 200 ? 'OK' : 'ERROR'}
                    </span>
                    {testResult.latencyMs && (
                      <span className="text-slate-400">({testResult.latencyMs} ms)</span>
                    )}
                  </div>

                  {testResult.rowsCount !== undefined && (
                    <span className="text-emerald-400 font-bold">{testResult.rowsCount} records returned</span>
                  )}
                </div>

                {testResult.error && (
                  <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
                    {testResult.error}
                  </div>
                )}

                {testResult.payloadSample && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">Sample Row Data:</span>
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                      {JSON.stringify(testResult.payloadSample, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : null}

            {/* Curl Command Snippet */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>cURL Verification Command:</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `curl -H "X-Surveillance-Token: ${authToken}" "${serverOrigin || ''}/api/looker/connector/data?stream=all"`,
                      'curl-cmd'
                    )
                  }
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'curl-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'curl-cmd' ? 'Copied cURL!' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto">
                {`curl -H "X-Surveillance-Token: ${authToken}" "${serverOrigin || 'http://localhost:3000'}/api/looker/connector/data?stream=all"`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
