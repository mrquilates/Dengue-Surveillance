import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Database,
  Upload,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Webhook,
  ChevronDown,
  ClipboardPaste,
  ArrowLeft,
} from 'lucide-react';
import { SurveillanceRecord, ValidationReport } from '../types/surveillance';
import { LineListTable } from './LineListTable';
import { PIDSRWebhookPanel } from './PIDSRWebhookPanel';
import { GoogleSheetsPastePanel } from './GoogleSheetsPastePanel';
import {
  exportSurveillanceCSV,
  exportSurveillanceExcel,
} from '../utils/datasetExporter';

interface AutoSyncTelemetry {
  enabled: boolean;
  totalCases: number;
  lastSync: string;
  sourceUrl: string;
  status: string;
}

interface DataCollectionViewProps {
  records: SurveillanceRecord[];
  validationReport: ValidationReport;
  autoSyncTelemetry: AutoSyncTelemetry;
  isManualSyncing: boolean;
  onTriggerManualSync: () => void;
  onOpenUpload: () => void;
  onDownloadSample: () => void;
  onIngestCSV: (csvText: string, filename: string, mode?: 'replace' | 'append') => void;
  onNavigateToDashboard: () => void;
}

export const DataCollectionView: React.FC<DataCollectionViewProps> = ({
  records,
  validationReport,
  autoSyncTelemetry,
  isManualSyncing,
  onTriggerManualSync,
  onOpenUpload,
  onDownloadSample,
  onIngestCSV,
  onNavigateToDashboard,
}) => {
  const [subTab, setSubTab] = useState<'linelist' | 'paste' | 'pidsr'>('linelist');
  const [tableFilteredRecords, setTableFilteredRecords] = useState<SurveillanceRecord[] | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const activeRecords = records.filter(r => !r.isDuplicate);
  const recordsToExport =
    subTab === 'linelist' && tableFilteredRecords !== null
      ? tableFilteredRecords.filter(r => !r.isDuplicate)
      : activeRecords;

  const handleFilteredRecordsChange = useCallback((filtered: SurveillanceRecord[]) => {
    setTableFilteredRecords(filtered);
  }, []);

  // Close export dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleExportCSV = () => {
    if (recordsToExport.length === 0) {
      setExportNotice('No matching surveillance records available to export.');
      setIsExportMenuOpen(false);
      return;
    }
    const filename = exportSurveillanceCSV(recordsToExport);
    setExportNotice(
      `Exported ${recordsToExport.length.toLocaleString()} filtered surveillance record(s) to ${filename}`
    );
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    if (recordsToExport.length === 0) {
      setExportNotice('No matching surveillance records available to export.');
      setIsExportMenuOpen(false);
      return;
    }
    const filename = exportSurveillanceExcel(recordsToExport);
    setExportNotice(
      `Exported ${recordsToExport.length.toLocaleString()} filtered surveillance record(s) to ${filename}`
    );
    setIsExportMenuOpen(false);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="no-print mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to BI Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Data Collection &amp; Case Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Municipality of Argao, Cebu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <button
            onClick={onTriggerManualSync}
            disabled={isManualSyncing}
            className="px-3.5 py-2 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>{isManualSyncing ? 'Syncing PIDSR...' : 'Sync Live PIDSR'}</span>
          </button>

          <button
            onClick={onDownloadSample}
            className="px-3.5 py-2 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Template CSV</span>
          </button>

          {/* Export Data Dropdown (CSV & Excel) */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              className="px-3.5 py-2 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-slate-100 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Data</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isExportMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isExportMenuOpen && (
              <div
                role="menu"
                aria-label="Export surveillance dataset formats"
                className="absolute right-0 mt-2 w-64 rounded-xl bg-[#171a21] border border-white/[0.12] shadow-xl py-1.5 z-30"
              >
                <div className="px-3.5 py-2 border-b border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current filtered dataset</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {recordsToExport.length.toLocaleString()} cases
                  </span>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-white/[0.05] flex items-center justify-between gap-3 text-xs text-slate-100 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-white/[0.08]"
                >
                  <span className="flex items-center gap-2.5 font-medium">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Download CSV (.csv)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">PIDSR</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-white/[0.05] flex items-center justify-between gap-3 text-xs text-slate-100 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-white/[0.08]"
                >
                  <span className="flex items-center gap-2.5 font-medium">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Download Excel (.xlsx)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">2 Sheets</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest Line-List</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation */}
      {exportNotice && (
        <div className="px-4 py-3 rounded-xl bg-[#111318] border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <span className="text-emerald-300">{exportNotice}</span>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-slate-400 hover:text-white cursor-pointer text-xs whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08]">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Verified Active Cases</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1.5">
            {activeRecords.length.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
            Export selection: {recordsToExport.length.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08]">
          <div className="text-xs text-slate-400">Data Quality Index</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1.5">
            {validationReport.overallDQI}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08]">
          <div className="text-xs text-slate-400">Completeness</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1.5">
            {validationReport.completenessScore}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08]">
          <div className="text-xs text-slate-400">Last Sync</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-400 mt-1.5">
            {autoSyncTelemetry.lastSync}
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3 no-print">
        <button
          onClick={() => setSubTab('linelist')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            subTab === 'linelist'
              ? 'bg-blue-600 text-white'
              : 'bg-[#111318] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Master Case Line-List ({activeRecords.length})</span>
        </button>

        <button
          onClick={() => setSubTab('paste')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            subTab === 'paste'
              ? 'bg-blue-600 text-white'
              : 'bg-[#111318] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Paste Google Sheets</span>
        </button>

        <button
          onClick={() => setSubTab('pidsr')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            subTab === 'pidsr'
              ? 'bg-blue-600 text-white'
              : 'bg-[#111318] text-slate-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          <Webhook className="w-3.5 h-3.5" />
          <span>DOH PIDSR Live Sync Gateway</span>
        </button>
      </div>

      {subTab === 'linelist' ? (
        <LineListTable
          records={records}
          selectedDisease="DEN"
          onFilteredRecordsChange={handleFilteredRecordsChange}
        />
      ) : subTab === 'paste' ? (
        <GoogleSheetsPastePanel
          existingRecords={records}
          onIngestCSV={onIngestCSV}
          onViewLineList={() => setSubTab('linelist')}
          onNavigateToDashboard={onNavigateToDashboard}
        />
      ) : (
        <PIDSRWebhookPanel
          onIngestCSV={onIngestCSV}
          selectedDisease="DEN"
          currentRecordsCount={activeRecords.length}
        />
      )}
    </div>
  );
};
