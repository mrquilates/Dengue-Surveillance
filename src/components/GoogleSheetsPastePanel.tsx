import React, { useState, useMemo } from 'react';
import {
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  FileSpreadsheet,
  ArrowRight,
  Table2,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { SurveillanceRecord } from '../types/surveillance';
import {
  CanonicalPidsrFieldKey,
  PIDSR_FIELD_OPTIONS,
  SAMPLE_GOOGLE_SHEETS_TSV,
  buildCanonicalCSVFromMappedPaste,
  extractHtmlTableToTSV,
  parseClipboardSheetText,
  validateMappedPasteRows,
} from '../utils/clipboardSheetParser';

interface GoogleSheetsPastePanelProps {
  existingRecords: SurveillanceRecord[];
  onIngestCSV: (csvText: string, filename: string, mode?: 'replace' | 'append') => void;
  onViewLineList: () => void;
  onNavigateToDashboard: () => void;
}

type PreviewFilter = 'all' | 'valid' | 'warning' | 'rejected';

export const GoogleSheetsPastePanel: React.FC<GoogleSheetsPastePanelProps> = ({
  existingRecords,
  onIngestCSV,
  onViewLineList,
  onNavigateToDashboard,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [hasHeaderRow, setHasHeaderRow] = useState<boolean>(true);
  const [columnMapping, setColumnMapping] = useState<Record<number, CanonicalPidsrFieldKey>>({});
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>('all');
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<{
    count: number;
    mode: 'append' | 'replace';
    skippedRejected: number;
    filename: string;
  } | null>(null);

  const activeExistingCount = useMemo(
    () => existingRecords.filter(r => !r.isDuplicate).length,
    [existingRecords]
  );

  // Parse raw pasted text whenever rawText or hasHeaderRow changes
  const parsedMatrix = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseClipboardSheetText(rawText, hasHeaderRow);
  }, [rawText, hasHeaderRow]);

  // Effective column mapping: merges user overrides over auto-detected suggestions
  const effectiveMapping = useMemo(() => {
    if (!parsedMatrix) return {};
    const merged: Record<number, CanonicalPidsrFieldKey> = {};
    parsedMatrix.headers.forEach((_, idx) => {
      merged[idx] =
        columnMapping[idx] !== undefined
          ? columnMapping[idx]
          : parsedMatrix.suggestedMapping[idx] || '__ignore__';
    });
    return merged;
  }, [parsedMatrix, columnMapping]);

  // Row-level validation summary
  const validationSummary = useMemo(() => {
    if (!parsedMatrix || parsedMatrix.dataRows.length === 0) return null;
    return validateMappedPasteRows(
      parsedMatrix.dataRows,
      effectiveMapping,
      existingRecords
    );
  }, [parsedMatrix, effectiveMapping, existingRecords]);

  const filteredPreviewRows = useMemo(() => {
    if (!validationSummary) return [];
    if (previewFilter === 'all') return validationSummary.rows;
    return validationSummary.rows.filter(r => r.overallStatus === previewFilter);
  }, [validationSummary, previewFilter]);

  const applyNewRawText = (text: string, headerToggle = hasHeaderRow) => {
    setRawText(text);
    setClipboardError(null);
    setConnectSuccess(null);
    setPreviewFilter('all');
    const parsed = parseClipboardSheetText(text, headerToggle);
    setColumnMapping(parsed ? parsed.suggestedMapping : {});
  };

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const plain = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    const resolved = plain && plain.trim().length > 0 ? plain : extractHtmlTableToTSV(html);

    if (resolved && resolved.trim().length > 0) {
      e.preventDefault();
      applyNewRawText(resolved);
    }
  };

  const handleReadClipboardButton = async () => {
    setClipboardError(null);
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
      setClipboardError(
        'Browser clipboard API is unavailable here. Click inside the paste box below and press Ctrl+V (or Cmd+V).'
      );
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setClipboardError(
          'Your clipboard appears empty. Copy a range of cells in Google Sheets first, then paste here.'
        );
        return;
      }
      applyNewRawText(text);
    } catch {
      setClipboardError(
        'Clipboard read permission was declined. Click inside the paste box below and press Ctrl+V (or Cmd+V) directly.'
      );
    }
  };

  const handleToggleHeaderRow = () => {
    const next = !hasHeaderRow;
    setHasHeaderRow(next);
    if (rawText.trim()) {
      const parsed = parseClipboardSheetText(rawText, next);
      setColumnMapping(parsed ? parsed.suggestedMapping : {});
    }
  };

  const handleMappingChange = (colIdx: number, targetField: CanonicalPidsrFieldKey) => {
    setConnectSuccess(null);
    setColumnMapping(prev => {
      const next: Record<number, CanonicalPidsrFieldKey> = { ...effectiveMapping, ...prev };
      // If another column already holds this canonical field, release it cleanly
      if (targetField !== '__ignore__') {
        Object.keys(next).forEach(k => {
          const idx = Number(k);
          if (idx !== colIdx && next[idx] === targetField) {
            next[idx] = '__ignore__';
          }
        });
      }
      next[colIdx] = targetField;
      return next;
    });
  };

  const handleClear = () => {
    setRawText('');
    setColumnMapping({});
    setClipboardError(null);
    setConnectSuccess(null);
    setPreviewFilter('all');
  };

  const handleConnectToPipeline = () => {
    if (!parsedMatrix || !validationSummary || validationSummary.readyToConnectCount === 0) {
      return;
    }

    const csvText = buildCanonicalCSVFromMappedPaste(
      parsedMatrix.dataRows,
      effectiveMapping,
      validationSummary.rows
    );
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const filename = `google_sheets_paste_${stamp}.csv`;

    onIngestCSV(csvText, filename, importMode);
    setConnectSuccess({
      count: validationSummary.readyToConnectCount,
      mode: importMode,
      skippedRejected: validationSummary.rejectedCount,
      filename,
    });
  };

  // Detect any duplicate target mappings (should be prevented by handler, kept as safeguard)
  const mappedCount = Object.values(effectiveMapping).filter(v => v !== '__ignore__').length;

  return (
    <div className="space-y-5">
      {/* Top Panel: Paste Input Utility Box */}
      <section className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-semibold text-white">
              Google Sheets Line-List Copy &amp; Paste
            </h2>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Copy rows directly from Google Sheets</span>
              <span aria-hidden="true">·</span>
              <span>Auto-detects tab-separated columns &amp; PIDSR fields</span>
              <span aria-hidden="true">·</span>
              <span>Validates Argao, Cebu jurisdiction before connecting</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReadClipboardButton}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste from Clipboard</span>
            </button>

            <button
              type="button"
              onClick={() => applyNewRawText(SAMPLE_GOOGLE_SHEETS_TSV, true)}
              className="px-3.5 py-2 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Load Sample Sheet</span>
            </button>

            {rawText.trim().length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Clipboard Guidance / Error */}
        {clipboardError && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-[#171a21] border border-amber-500/35 flex items-start justify-between gap-3 text-xs text-amber-200"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{clipboardError}</span>
            </div>
            <button
              type="button"
              onClick={() => setClipboardError(null)}
              className="text-slate-400 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Post-Connect Confirmation Banner */}
        {connectSuccess && (
          <div className="px-4 py-3.5 rounded-lg bg-[#171a21] border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-emerald-300 font-semibold">
                  Connected {connectSuccess.count.toLocaleString()} case(s) to the dashboard pipeline (
                  {connectSuccess.mode === 'append' ? 'Appended to existing dataset' : 'Replaced dataset'}).
                </div>
                <div className="text-slate-400 font-mono tabular-nums">
                  Source batch: {connectSuccess.filename}
                  {connectSuccess.skippedRejected > 0
                    ? ` · ${connectSuccess.skippedRejected} out-of-jurisdiction/rejected row(s) excluded`
                    : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onViewLineList}
                className="px-3 py-1.5 rounded-lg bg-[#111318] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                <span>View Line-List</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Open BI Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Paste Textarea */}
        <div className="space-y-2.5">
          <label htmlFor="google-sheets-paste-input" className="sr-only">
            Paste Google Sheets line-list cells
          </label>
          <textarea
            id="google-sheets-paste-input"
            value={rawText}
            onChange={e => applyNewRawText(e.target.value)}
            onPaste={handleTextareaPaste}
            placeholder={
              'Select your case rows in Google Sheets (including headers if available), press Ctrl+C / Cmd+C, then click here and press Ctrl+V / Cmd+V...\n\nExample columns: EPIID\tDisease ID\tAge\tSex\tMunicipality\tBarangay\tDate Onset\tMW\tAdmitted\tClassification\tOutcome'
            }
            rows={6}
            spellCheck={false}
            className="w-full rounded-lg bg-[#0b0c0e] border border-white/[0.1] focus:border-blue-500 focus:outline-none px-4 py-3 text-xs font-mono text-slate-200 placeholder:text-slate-500 leading-relaxed resize-y"
          />

          {/* Parse Telemetry & Header Row Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleHeaderRow}
                aria-pressed={hasHeaderRow}
                className="flex items-center gap-2 text-xs text-slate-200 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                <span
                  className={`w-8 h-4 rounded-full relative transition-colors inline-flex items-center px-0.5 ${
                    hasHeaderRow ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                      hasHeaderRow ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
                <span>First row is header</span>
              </button>

              {parsedMatrix && (
                <>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="text-slate-300">{parsedMatrix.delimiterLabel}</span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {parsedMatrix.dataRows.length.toLocaleString()} data row(s) /{' '}
                    {parsedMatrix.headers.length} column(s)
                  </span>
                </>
              )}
            </div>

            {parsedMatrix && parsedMatrix.headerRowIndex > 0 && (
              <span className="text-slate-400 font-mono tabular-nums">
                Skipped {parsedMatrix.headerRowIndex} preamble banner row(s)
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Empty State Guide when nothing is pasted yet */}
      {!parsedMatrix && (
        <section className="p-6 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Table2 className="w-4 h-4 text-blue-400" />
              <span>How to Connect Your Google Sheet</span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Highlight your dengue case rows in Google Sheets and copy them directly. Column headers
              such as EPIID, Age, Sex, Municipality, Barangay, Date Onset, MW, Classification, and
              Outcome are matched automatically—or you can remap any column manually before importing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => applyNewRawText(SAMPLE_GOOGLE_SHEETS_TSV, true)}
            className="px-4 py-2 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            Try Sample Google Sheet Paste
          </button>
        </section>
      )}

      {/* Column Mapping Strip */}
      {parsedMatrix && parsedMatrix.headers.length > 0 && (
        <section className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Column Mapping to PIDSR Schema
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {mappedCount} of {parsedMatrix.headers.length} pasted column(s) mapped · Adjust any
                dropdown to override automatic matching
              </p>
            </div>

            {validationSummary && validationSummary.missingRecommendedFields.length > 0 && (
              <div className="text-xs text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Unmapped recommended:{' '}
                  {validationSummary.missingRecommendedFields.map(f => f.label).join(', ')}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {parsedMatrix.headers.map((headerName, colIdx) => {
              const selectedTarget = effectiveMapping[colIdx] || '__ignore__';
              const sampleVal = parsedMatrix.dataRows[0]?.[colIdx] || '—';
              const isMapped = selectedTarget !== '__ignore__';

              return (
                <div
                  key={`${colIdx}-${headerName}`}
                  className="p-3 rounded-lg bg-[#0b0c0e] border border-white/[0.08] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs font-semibold text-slate-200 truncate"
                      title={headerName}
                    >
                      {headerName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
                      Col {colIdx + 1}
                    </span>
                  </div>

                  <select
                    aria-label={`Map column ${headerName}`}
                    value={selectedTarget}
                    onChange={e =>
                      handleMappingChange(colIdx, e.target.value as CanonicalPidsrFieldKey)
                    }
                    className={`w-full rounded-md px-2.5 py-1.5 text-xs bg-[#171a21] border focus:outline-none focus:border-blue-500 cursor-pointer ${
                      isMapped
                        ? 'border-blue-500/40 text-white'
                        : 'border-white/[0.08] text-slate-400'
                    }`}
                  >
                    {PIDSR_FIELD_OPTIONS.map(opt => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div className="text-[11px] font-mono text-slate-400 truncate" title={sampleVal}>
                    Sample: {sampleVal}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Live Row Validation Preview Table */}
      {validationSummary && (
        <section className="rounded-xl bg-[#111318] border border-white/[0.08] overflow-hidden">
          <div className="p-5 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">
                Live Row Validation Preview
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
                <span className="text-slate-200">
                  Total: {validationSummary.totalCount.toLocaleString()}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">
                  Valid: {validationSummary.validCount.toLocaleString()}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400">
                  Warnings: {validationSummary.warningCount.toLocaleString()}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-red-400">
                  Rejected: {validationSummary.rejectedCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Filter Segmented Control */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0b0c0e] border border-white/[0.08] self-start lg:self-auto">
              {(
                [
                  { id: 'all', label: `All (${validationSummary.totalCount})` },
                  { id: 'valid', label: `Valid (${validationSummary.validCount})` },
                  { id: 'warning', label: `Warnings (${validationSummary.warningCount})` },
                  { id: 'rejected', label: `Rejected (${validationSummary.rejectedCount})` },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreviewFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    previewFilter === tab.id
                      ? 'bg-[#171a21] text-white border border-white/[0.1]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0b0c0e] sticky top-0 z-10 border-b border-white/[0.08] text-[11px] font-semibold text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-mono">#</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">EPIID</th>
                  <th className="py-2.5 px-4 text-right">Age</th>
                  <th className="py-2.5 px-4">Sex</th>
                  <th className="py-2.5 px-4">Municipality</th>
                  <th className="py-2.5 px-4">Barangay</th>
                  <th className="py-2.5 px-4">Date Onset</th>
                  <th className="py-2.5 px-4 text-right">MW</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4">Validation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {filteredPreviewRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No rows match the selected validation filter.
                    </td>
                  </tr>
                ) : (
                  filteredPreviewRows.map(row => {
                    const statusConfig =
                      row.overallStatus === 'rejected'
                        ? {
                            icon: XCircle,
                            text: 'Rejected',
                            cls: 'text-red-400',
                          }
                        : row.overallStatus === 'warning'
                        ? {
                            icon: AlertTriangle,
                            text: 'Warning',
                            cls: 'text-amber-400',
                          }
                        : {
                            icon: CheckCircle2,
                            text: 'Ready',
                            cls: 'text-emerald-400',
                          };
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr
                        key={row.rowIndex}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          row.overallStatus === 'rejected' ? 'opacity-65' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500">
                          {row.rowIndex}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 font-medium ${statusConfig.cls}`}>
                            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{statusConfig.text}</span>
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-4 font-mono tabular-nums whitespace-nowrap ${
                            row.cellChecks.epiId?.status === 'warning'
                              ? 'text-amber-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {row.mappedValues.epiId || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-200">
                          {row.mappedValues.age || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {row.mappedValues.sex || '—'}
                        </td>
                        <td
                          className={`py-2.5 px-4 whitespace-nowrap ${
                            row.cellChecks.municipality?.status === 'error'
                              ? 'text-red-400 font-medium'
                              : 'text-slate-300'
                          }`}
                        >
                          {row.mappedValues.municipality || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-200 whitespace-nowrap">
                          {row.mappedValues.barangay || '—'}
                        </td>
                        <td
                          className={`py-2.5 px-4 font-mono tabular-nums whitespace-nowrap ${
                            row.cellChecks.dateOnset?.status === 'warning'
                              ? 'text-amber-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {row.mappedValues.dateOnset || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-300">
                          {row.mappedValues.morbidityWeek || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                          {row.mappedValues.caseClassification || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 min-w-[220px]">
                          {row.issues.length > 0 ? row.issues.join(' · ') : 'Passes all checks'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pipeline Connector Footer Bar */}
          <div className="p-5 bg-[#0b0c0e]/70 border-t border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
                Pipeline Mode:
              </span>
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#111318] border border-white/[0.08] self-start">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    importMode === 'append'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Append to Existing
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    importMode === 'replace'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Replace Dataset
                </button>
              </div>
              <span className="text-xs text-slate-400">
                {importMode === 'append'
                  ? `Adds ${validationSummary.readyToConnectCount.toLocaleString()} ready case(s) to ${activeExistingCount.toLocaleString()} existing active cases`
                  : `Replaces ${activeExistingCount.toLocaleString()} existing active cases with ${validationSummary.readyToConnectCount.toLocaleString()} pasted case(s)`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConnectToPipeline}
              disabled={validationSummary.readyToConnectCount === 0}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span>
                Connect {validationSummary.readyToConnectCount.toLocaleString()} Case(s) to Pipeline
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
