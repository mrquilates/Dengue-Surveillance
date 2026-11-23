import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Play,
  Webhook,
  RefreshCw,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Eye,
  ChevronDown,
  ChevronRight,
  Info,
  Check,
  HelpCircle,
  Layers,
  Sparkles,
  FileText,
  Loader2,
  Table,
} from 'lucide-react';
import Papa from 'papaparse';
import {
  detectSchemaMapping,
  convertPIDSRWebhookCasesToCSV,
  isArgaoJurisdiction,
  parseDateToISO,
} from '../utils/dataCleaner';
import { SAMPLE_CSV_CONTENT, SAMPLE_CHOLERA_CSV } from '../utils/sampleData';
import {
  ACCEPT_SPREADSHEET_MIME,
  parseAnySpreadsheet,
  ParsedSpreadsheetResult,
  SheetInfo,
  createSampleMultiSheetExcelFile,
} from '../utils/spreadsheetParser';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestCSV: (csvText: string, filename: string) => void;
}

// Mandatory fields required for epidemiological surveillance
export interface MandatoryFieldDef {
  key: string;
  label: string;
  description: string;
  requiredRule: string;
}

export const MANDATORY_SURVEILLANCE_FIELDS: MandatoryFieldDef[] = [
  {
    key: 'epiId',
    label: 'Case ID (EPIID)',
    description: 'Unique PIDSR Case ID',
    requiredRule: 'Must be non-empty and unique',
  },
  {
    key: 'diseaseId',
    label: 'Disease ID',
    description: 'Pathogen code (DEN, CHOL, MEA)',
    requiredRule: 'Must match standard disease code',
  },
  {
    key: 'age',
    label: 'Age at Onset',
    description: 'Patient age in completed years',
    requiredRule: 'Numeric between 0 and 120',
  },
  {
    key: 'sex',
    label: 'Sex (M/F)',
    description: 'Biological sex',
    requiredRule: 'Strictly "M" or "F"',
  },
  {
    key: 'municipality',
    label: 'Municipality',
    description: 'Territorial catchment gatekeeper',
    requiredRule: 'Strictly "Argao, Cebu" (RA 11332)',
  },
  {
    key: 'barangay',
    label: 'Barangay',
    description: 'Administrative barangay name',
    requiredRule: 'Must be valid Argao barangay',
  },
  {
    key: 'dateOnset',
    label: 'Onset Date',
    description: 'Date of first symptom onset',
    requiredRule: 'Valid date format, not in future',
  },
  {
    key: 'caseClassification',
    label: 'Classification',
    description: 'Clinical surveillance level',
    requiredRule: 'Suspect, Probable, or Confirmed',
  },
  {
    key: 'outcome',
    label: 'Outcome',
    description: 'Current patient status',
    requiredRule: 'Alive, Died, or Recovered',
  },
];

export interface CellValidationResult {
  status: 'valid' | 'warning' | 'error';
  message?: string;
}

export interface RowValidationResult {
  rowNum: number;
  data: Record<string, any>;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  cellResults: Record<string, CellValidationResult>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onIngestCSV,
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRawRows, setPreviewRawRows] = useState<any[]>([]);
  const [totalRowCount, setTotalRowCount] = useState<number>(0);
  const [schemaAnalysis, setSchemaAnalysis] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'issues' | 'errors' | 'valid'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isPullingWebhook, setIsPullingWebhook] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedWorkbook, setParsedWorkbook] = useState<ParsedSpreadsheetResult | null>(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSheetData = (sheet: SheetInfo, fname: string) => {
    setCsvContent(sheet.csv);
    setFilename(fname);
    setErrorMsg(null);
    setExpandedRows(new Set());
    setTotalRowCount(sheet.rowCount);
    setPreviewHeaders(sheet.headers);
    setPreviewRawRows(sheet.previewRows);

    if (sheet.headers.length === 0) {
      setErrorMsg(`The selected sheet "${sheet.name}" does not contain readable column headers.`);
      setSchemaAnalysis(null);
      return;
    }

    const analysis = detectSchemaMapping(sheet.headers);
    setSchemaAnalysis(analysis);
  };

  const handleSpreadsheetFile = async (file: File) => {
    setIsProcessingFile(true);
    setErrorMsg(null);
    try {
      const result = await parseAnySpreadsheet(file);
      setParsedWorkbook(result);
      setActiveSheetIndex(result.activeSheetIndex);
      loadSheetData(result.activeSheet, file.name);
    } catch (err: any) {
      setErrorMsg(`Failed to parse spreadsheet "${file.name}": ${err.message}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSwitchSheet = (sheetIdx: number) => {
    if (!parsedWorkbook || !parsedWorkbook.sheets[sheetIdx]) return;
    setActiveSheetIndex(sheetIdx);
    loadSheetData(parsedWorkbook.sheets[sheetIdx], filename);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleSpreadsheetFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSpreadsheetFile(file);
    }
  };

  const parseAndInspect = (text: string, fname: string) => {
    try {
      setCsvContent(text);
      setFilename(fname);
      setErrorMsg(null);
      setExpandedRows(new Set());
      setParsedWorkbook(null);
      setActiveSheetIndex(0);

      // Count total lines in CSV roughly
      const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
      setTotalRowCount(Math.max(0, lines.length - 1));

      // Parse up to 26 preview rows for real-time validation inspection
      const parsed = Papa.parse(text, {
        header: true,
        preview: 26,
        skipEmptyLines: true,
        transformHeader: h => h.trim(),
      });

      const headers = parsed.meta.fields || [];
      if (headers.length === 0) {
        setErrorMsg('The selected CSV file does not contain valid headers.');
        return;
      }

      setPreviewHeaders(headers);
      setPreviewRawRows(parsed.data);

      const analysis = detectSchemaMapping(headers);
      setSchemaAnalysis(analysis);
    } catch (err: any) {
      setErrorMsg(`Failed to parse CSV: ${err.message}`);
    }
  };

  const loadPreset = (presetName: 'dengue' | 'cholera') => {
    const content = presetName === 'dengue' ? SAMPLE_CSV_CONTENT : SAMPLE_CHOLERA_CSV;
    const name =
      presetName === 'dengue'
        ? 'dengue_surveillance_linelist_2026.csv'
        : 'cholera_waterborne_linelist_2026.csv';
    parseAndInspect(content, name);
  };

  const loadSampleMultiSheetExcel = () => {
    const file = createSampleMultiSheetExcelFile();
    handleSpreadsheetFile(file);
  };

  const pullFromPIDSRWebhook = async () => {
    setIsPullingWebhook(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/pidsr/data_extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipality: 'Argao',
          disease: 'DEN',
          morbidityYear: 2026,
          morbidityWeekStart: 1,
          morbidityWeekEnd: 34,
        }),
      });
      const data = await res.json();
      if (data.success && data.payload?.cases) {
        const csv = convertPIDSRWebhookCasesToCSV(data.payload.cases);
        parseAndInspect(csv, `pidsr_webhook_${data.payload.extractionId}.csv`);
      } else {
        throw new Error(data.error || 'Webhook extraction returned empty dataset');
      }
    } catch (err: any) {
      setErrorMsg(`PIDSR Webhook error: ${err.message}`);
    } finally {
      setIsPullingWebhook(false);
    }
  };

  const handleCommitIngestion = () => {
    if (!csvContent) return;
    onIngestCSV(csvContent, filename || 'uploaded_surveillance.csv');
    onClose();
  };

  const toggleRowExpanded = (rowNum: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowNum)) next.delete(rowNum);
      else next.add(rowNum);
      return next;
    });
  };

  // Mandatory fields matching analysis
  const mandatoryFieldsStatus = useMemo(() => {
    if (!schemaAnalysis) return [];
    const mapping = schemaAnalysis.mapping || {};

    return MANDATORY_SURVEILLANCE_FIELDS.map(f => {
      const mappedHeader = mapping[f.key];
      const isPresent = Boolean(mappedHeader);
      return {
        ...f,
        isPresent,
        mappedHeader: mappedHeader || null,
      };
    });
  }, [schemaAnalysis]);

  const missingMandatoryCount = useMemo(() => {
    return mandatoryFieldsStatus.filter(f => !f.isPresent).length;
  }, [mandatoryFieldsStatus]);

  // Real-time Row & Cell Validation Engine
  const validatedRows = useMemo<RowValidationResult[]>(() => {
    if (!previewRawRows || previewRawRows.length === 0 || !schemaAnalysis) return [];
    const mapping = schemaAnalysis.mapping || {};

    return previewRawRows.map((rawRow, idx) => {
      const rowNum = idx + 1;
      const errors: string[] = [];
      const warnings: string[] = [];
      const cellResults: Record<string, CellValidationResult> = {};

      // Helper to fetch cell by mapped internal key or raw header
      const getVal = (key: string): any => {
        const h = mapping[key];
        return h ? rawRow[h] : undefined;
      };

      // 1. EPIID
      const rawEpiId = getVal('epiId');
      const epiHeader = mapping['epiId'];
      if (!rawEpiId || String(rawEpiId).trim() === '') {
        errors.push('Missing Case ID / EPIID');
        if (epiHeader) cellResults[epiHeader] = { status: 'error', message: 'Mandatory field is empty' };
      } else if (epiHeader) {
        cellResults[epiHeader] = { status: 'valid' };
      }

      // 2. Disease ID
      const rawDisease = getVal('diseaseId');
      const diseaseHeader = mapping['diseaseId'];
      if (!rawDisease || String(rawDisease).trim() === '') {
        errors.push('Missing Disease / Pathogen code');
        if (diseaseHeader) cellResults[diseaseHeader] = { status: 'error', message: 'Missing disease identifier' };
      } else if (diseaseHeader) {
        cellResults[diseaseHeader] = { status: 'valid' };
      }

      // 3. Age
      const rawAge = getVal('age');
      const ageHeader = mapping['age'];
      if (rawAge === undefined || rawAge === null || String(rawAge).trim() === '') {
        warnings.push('Age is missing (will auto-impute median)');
        if (ageHeader) cellResults[ageHeader] = { status: 'warning', message: 'Empty age (imputation applied)' };
      } else {
        const numAge = Number(rawAge);
        if (isNaN(numAge) || numAge < 0 || numAge > 120) {
          errors.push(`Invalid age value: "${rawAge}" (expected 0–120)`);
          if (ageHeader) cellResults[ageHeader] = { status: 'error', message: 'Age out of valid range (0-120)' };
        } else if (ageHeader) {
          cellResults[ageHeader] = { status: 'valid' };
        }
      }

      // 4. Sex (M/F)
      const rawSex = getVal('sex');
      const sexHeader = mapping['sex'];
      if (!rawSex || String(rawSex).trim() === '') {
        warnings.push('Sex is unspecified');
        if (sexHeader) cellResults[sexHeader] = { status: 'warning', message: 'Unspecified sex' };
      } else {
        const s = String(rawSex).trim().toUpperCase();
        if (s !== 'M' && s !== 'F' && s !== 'MALE' && s !== 'FEMALE') {
          warnings.push(`Unrecognized sex code: "${rawSex}" (expected M/F)`);
          if (sexHeader) cellResults[sexHeader] = { status: 'warning', message: 'Non-standard sex format' };
        } else if (sexHeader) {
          cellResults[sexHeader] = { status: 'valid' };
        }
      }

      // 5. Municipality (Argao Gatekeeper)
      const rawMuni = getVal('municipality');
      const rawPsgcMuni = getVal('psgcMunicipality');
      const muniHeader = mapping['municipality'];
      if (!rawMuni && !rawPsgcMuni) {
        errors.push('Missing municipality designation');
        if (muniHeader) cellResults[muniHeader] = { status: 'error', message: 'Missing municipality' };
      } else {
        const isArgao = isArgaoJurisdiction(String(rawMuni || ''), String(rawPsgcMuni || ''));
        if (!isArgao) {
          errors.push(`Out of Jurisdiction: "${rawMuni || 'Unknown'}" (Will be REJECTED under RA 11332 gatekeeper)`);
          if (muniHeader) cellResults[muniHeader] = {
            status: 'error',
            message: `Territorial Gatekeeper Rejection: "${rawMuni}" is outside Argao, Cebu`,
          };
        } else if (muniHeader) {
          cellResults[muniHeader] = { status: 'valid' };
        }
      }

      // 6. Barangay
      const rawBrgy = getVal('barangay');
      const brgyHeader = mapping['barangay'];
      if (!rawBrgy || String(rawBrgy).trim() === '') {
        errors.push('Missing Barangay designation');
        if (brgyHeader) cellResults[brgyHeader] = { status: 'error', message: 'Missing mandatory barangay' };
      } else if (brgyHeader) {
        cellResults[brgyHeader] = { status: 'valid' };
      }

      // 7. Date Onset
      const rawDate = getVal('dateOnset');
      const dateHeader = mapping['dateOnset'];
      if (!rawDate || String(rawDate).trim() === '') {
        errors.push('Missing Onset Date');
        if (dateHeader) cellResults[dateHeader] = { status: 'error', message: 'Missing mandatory onset date' };
      } else {
        const { iso, error } = parseDateToISO(String(rawDate));
        if (error || !iso) {
          errors.push(`Invalid date format: "${rawDate}"`);
          if (dateHeader) cellResults[dateHeader] = { status: 'error', message: `Unparseable date: ${error}` };
        } else {
          // Check for future date
          const parsedD = new Date(iso);
          const now = new Date();
          now.setDate(now.getDate() + 1); // 1-day grace
          if (parsedD > now) {
            errors.push(`Future onset date detected: "${iso}"`);
            if (dateHeader) cellResults[dateHeader] = { status: 'error', message: 'Onset date is in future' };
          } else if (dateHeader) {
            cellResults[dateHeader] = { status: 'valid' };
          }
        }
      }

      // 8. Morbidity Week
      const rawMW = getVal('morbidityWeek');
      const mwHeader = mapping['morbidityWeek'];
      if (rawMW !== undefined && rawMW !== null && String(rawMW).trim() !== '') {
        const numMW = Number(rawMW);
        if (isNaN(numMW) || numMW < 1 || numMW > 53) {
          warnings.push(`Morbidity Week out of range: "${rawMW}" (1–53)`);
          if (mwHeader) cellResults[mwHeader] = { status: 'warning', message: 'Out of range 1-53 (will re-derive)' };
        } else if (mwHeader) {
          cellResults[mwHeader] = { status: 'valid' };
        }
      }

      // 9. Case Classification
      const rawClass = getVal('caseClassification');
      const classHeader = mapping['caseClassification'];
      if (rawClass && String(rawClass).trim() !== '') {
        const c = String(rawClass).trim().toLowerCase();
        if (!c.includes('suspect') && !c.includes('prob') && !c.includes('conf')) {
          warnings.push(`Non-standard classification: "${rawClass}"`);
          if (classHeader) cellResults[classHeader] = { status: 'warning', message: 'Non-standard classification' };
        } else if (classHeader) {
          cellResults[classHeader] = { status: 'valid' };
        }
      }

      // 10. Outcome
      const rawOutcome = getVal('outcome');
      const outcomeHeader = mapping['outcome'];
      if (rawOutcome && String(rawOutcome).trim() !== '') {
        const o = String(rawOutcome).trim().toLowerCase();
        if (!o.includes('aliv') && !o.includes('recov') && !o.includes('died') && !o.includes('death')) {
          warnings.push(`Non-standard outcome: "${rawOutcome}"`);
          if (outcomeHeader) cellResults[outcomeHeader] = { status: 'warning', message: 'Non-standard outcome' };
        } else if (outcomeHeader) {
          cellResults[outcomeHeader] = { status: 'valid' };
        }
      }

      // Row status derivation
      const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';

      return {
        rowNum,
        data: rawRow,
        status,
        errors,
        warnings,
        cellResults,
      };
    });
  }, [previewRawRows, schemaAnalysis]);

  // Validation breakdown metrics
  const validationSummary = useMemo(() => {
    const total = validatedRows.length;
    const clean = validatedRows.filter(r => r.status === 'valid').length;
    const withWarnings = validatedRows.filter(r => r.status === 'warning').length;
    const withErrors = validatedRows.filter(r => r.status === 'error').length;
    const cleanPct = total > 0 ? Math.round((clean / total) * 100) : 100;

    return {
      total,
      clean,
      withWarnings,
      withErrors,
      cleanPct,
    };
  }, [validatedRows]);

  // Filtered rows for inspection table
  const displayedRows = useMemo(() => {
    if (filterView === 'issues') return validatedRows.filter(r => r.status !== 'valid');
    if (filterView === 'errors') return validatedRows.filter(r => r.status === 'error');
    if (filterView === 'valid') return validatedRows.filter(r => r.status === 'valid');
    return validatedRows;
  }, [validatedRows, filterView]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Ingest Disease Surveillance Line-List &amp; Spreadsheets
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  PIDSR COMPLIANT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  UNIVERSAL SPREADSHEET ENGINE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  PRE-FLIGHT VALIDATION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Accepts any spreadsheet format (<strong>.xlsx, .xls, .csv, .ods, .tsv, .xlsm, .xlsb, .txt</strong>) with automatic header detection, multi-sheet inspection, and real-time validation for <strong>Argao, Cebu</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 group relative ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/40 ring-4 ring-cyan-500/20 scale-[0.99]'
                : 'border-slate-700 hover:border-cyan-500 bg-slate-950/60 hover:bg-slate-950/90'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={ACCEPT_SPREADSHEET_MIME}
              className="hidden"
            />

            {isProcessingFile ? (
              <div className="py-4 flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm font-semibold text-white">Analyzing spreadsheet structure...</p>
                <p className="text-xs text-slate-400 font-mono">Parsing worksheets, auto-detecting headers, and converting dates</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-inner">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {filename ? (
                      <span className="text-cyan-300 font-mono">{filename}</span>
                    ) : (
                      'Click to select or drag and drop ANY spreadsheet file'
                    )}
                  </p>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Automatically detects column headers, skips DOH title banners, and standardizes Excel date formats.
                  </p>
                </div>

                {/* Format Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    .XLSX Excel
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-950/80 text-teal-300 border border-teal-800">
                    .XLS Legacy
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                    .CSV Delimited
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800">
                    .ODS OpenDocument
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800">
                    .TSV Tab
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800">
                    .XLSM Macro
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                    .XLSB Binary
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    .TXT Text
                  </span>
                </div>
              </>
            )}
          </div>

          {/* SPREADSHEET WORKBOOK DETAILS & MULTI-SHEET TABS */}
          {parsedWorkbook && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                    parsedWorkbook.formatBadge.color === 'emerald'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : parsedWorkbook.formatBadge.color === 'purple'
                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                      : parsedWorkbook.formatBadge.color === 'blue'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  }`}>
                    {parsedWorkbook.formatBadge.label}
                  </span>
                  <span className="text-white font-semibold truncate max-w-xs">{parsedWorkbook.fileName}</span>
                  <span className="text-slate-500">
                    ({(parsedWorkbook.fileSizeBytes / 1024).toFixed(1)} KB)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span>
                    Worksheets: <strong className="text-white">{parsedWorkbook.sheets.length}</strong>
                  </span>
                  <span>
                    Rows in Sheet: <strong className="text-cyan-400">{totalRowCount}</strong>
                  </span>
                  <span>
                    Columns: <strong className="text-white">{previewHeaders.length}</strong>
                  </span>
                </div>
              </div>

              {/* Multi-Sheet Tab Navigation (if workbook contains more than 1 worksheet) */}
              {parsedWorkbook.sheets.length > 1 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Multi-Sheet Workbook Detected &mdash; Select Worksheet to Ingest:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedWorkbook.sheets.map((sheet, sIdx) => {
                      const isActive = sIdx === activeSheetIndex;
                      return (
                        <button
                          key={sheet.name}
                          type="button"
                          onClick={() => handleSwitchSheet(sIdx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-950/50 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <Table className="w-3 h-3 shrink-0" />
                          <span>{sheet.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                            isActive ? 'bg-cyan-900/60 text-cyan-200' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {sheet.rowCount} rows
                          </span>
                          {isActive && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">Presets &amp; Benchmarks:</span>
            <button
              onClick={pullFromPIDSRWebhook}
              disabled={isPullingWebhook}
              className="px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors font-mono cursor-pointer flex items-center gap-1.5 font-bold shadow-sm"
              title="Extract verified cases from https://pidsr.doh.gov.ph/pidsr/data_extraction"
            >
              <Webhook className={`w-3.5 h-3.5 ${isPullingWebhook ? 'animate-spin' : 'text-cyan-400'}`} />
              <span>{isPullingWebhook ? 'Pulling Webhook...' : 'Pull via PIDSR Webhook'}</span>
            </button>
            <button
              onClick={() => loadPreset('dengue')}
              className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700 transition-colors font-mono cursor-pointer flex items-center gap-1.5"
            >
              <span>Load Dengue PIDSR (CSV)</span>
            </button>
            <button
              onClick={() => loadPreset('cholera')}
              className="px-2.5 py-1 rounded bg-slate-800 text-purple-300 border border-slate-700 hover:bg-slate-700 transition-colors font-mono cursor-pointer"
            >
              <span>Load Cholera Linelist (CSV)</span>
            </button>
            <button
              onClick={loadSampleMultiSheetExcel}
              className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors font-mono cursor-pointer flex items-center gap-1.5 font-bold shadow-sm"
              title="Generate and inspect a multi-sheet Excel spreadsheet with PIDSR Dengue linelist and summary worksheets"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Multi-Sheet Excel (.xlsx)</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* REAL-TIME PRE-FLIGHT VALIDATION SCORECARD & MANDATORY FIELDS CHECKLIST */}
          {schemaAnalysis && (
            <div className="space-y-4">
              {/* Validation Scorecard Banner */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  missingMandatoryCount > 0 || validationSummary.withErrors > 0
                    ? 'bg-gradient-to-r from-slate-950 via-rose-950/20 to-slate-950 border-rose-500/30'
                    : validationSummary.withWarnings > 0
                    ? 'bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-950 border-amber-500/30'
                    : 'bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border-emerald-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    {missingMandatoryCount > 0 || validationSummary.withErrors > 0 ? (
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    ) : validationSummary.withWarnings > 0 ? (
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Pre-Flight Validation Health Check</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                            missingMandatoryCount > 0 || validationSummary.withErrors > 0
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : validationSummary.withWarnings > 0
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {missingMandatoryCount > 0 || validationSummary.withErrors > 0
                            ? 'Issues Flagged'
                            : validationSummary.withWarnings > 0
                            ? 'Warnings Flagged'
                            : '100% Valid'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {missingMandatoryCount > 0
                          ? `${missingMandatoryCount} mandatory surveillance fields are missing from this CSV.`
                          : validationSummary.withErrors > 0
                          ? `${validationSummary.withErrors} preview rows contain critical errors or out-of-jurisdiction entries.`
                          : 'All mandatory fields mapped and preview rows satisfy standard ingestion criteria.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-500 text-[10px] block uppercase">Dataset Cleanliness</span>
                    <span
                      className={`text-lg font-extrabold ${
                        validationSummary.cleanPct >= 90
                          ? 'text-emerald-400'
                          : validationSummary.cleanPct >= 70
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {validationSummary.cleanPct}% Clean
                    </span>
                  </div>
                </div>

                {/* Scorecard Metric Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Preview Rows</span>
                    <span className="text-white font-bold text-sm">
                      {validationSummary.total} <span className="text-[10px] text-slate-500 font-normal">({totalRowCount} in file)</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Clean Rows</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {validationSummary.clean} <span className="text-[10px] text-slate-500 font-normal">({validationSummary.cleanPct}%)</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Format Warnings</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {validationSummary.withWarnings}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Critical Errors</span>
                    <span className={`font-bold text-sm ${validationSummary.withErrors > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {validationSummary.withErrors}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Mandatory Fields</span>
                    <span
                      className={`font-bold text-sm ${
                        missingMandatoryCount === 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {MANDATORY_SURVEILLANCE_FIELDS.length - missingMandatoryCount}/{MANDATORY_SURVEILLANCE_FIELDS.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* MANDATORY FIELDS INTEGRITY CHECKLIST */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Mandatory Surveillance Fields Checklist (PIDSR &amp; Argao Scope)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {missingMandatoryCount === 0 ? (
                      <span className="text-emerald-400 font-bold">✓ All Mandatory Fields Detected</span>
                    ) : (
                      <span className="text-rose-400 font-bold">✕ {missingMandatoryCount} Fields Missing</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                  {mandatoryFieldsStatus.map(field => (
                    <div
                      key={field.key}
                      className={`p-2.5 rounded-lg border transition-all ${
                        field.isPresent
                          ? 'bg-slate-900/60 border-emerald-500/30'
                          : 'bg-rose-950/20 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white font-sans text-xs">{field.label}</span>
                        {field.isPresent ? (
                          <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-400" title="Field detected">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Field missing in CSV">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {field.isPresent ? (
                        <div className="text-[10px] text-cyan-400 truncate">
                          Mapped: <span className="text-slate-300 font-bold">{field.mappedHeader}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-rose-300 font-sans">
                          Missing in CSV. Rule: {field.requiredRule}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* REAL-TIME ROW VALIDATION PREVIEW TABLE WITH CELL-LEVEL ERROR HIGHLIGHTING */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>Real-Time Row Validation Preview</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                      Cells with red or amber outlines indicate detected anomalies or formatting defects. Click row to inspect details.
                    </p>
                  </div>

                  {/* Filter View Selector */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-slate-500 text-[10px] mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      <span>Filter:</span>
                    </span>
                    <button
                      onClick={() => setFilterView('all')}
                      className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        filterView === 'all'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({validationSummary.total})
                    </button>
                    <button
                      onClick={() => setFilterView('issues')}
                      className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        filterView === 'issues'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800 font-bold'
                          : 'text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      Issues ({validationSummary.withWarnings + validationSummary.withErrors})
                    </button>
                    <button
                      onClick={() => setFilterView('errors')}
                      className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        filterView === 'errors'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800 font-bold'
                          : 'text-slate-400 hover:text-rose-300'
                      }`}
                    >
                      Errors ({validationSummary.withErrors})
                    </button>
                    <button
                      onClick={() => setFilterView('valid')}
                      className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        filterView === 'valid'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      Clean ({validationSummary.clean})
                    </button>
                  </div>
                </div>

                {/* Validation Table */}
                <div className="overflow-x-auto max-h-72 rounded-lg border border-slate-800">
                  <table className="w-full text-left text-[11px] font-mono whitespace-nowrap">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-2.5 w-10 text-center">Row</th>
                        <th className="py-2 px-3 w-28">Validation Status</th>
                        {previewHeaders.map(h => (
                          <th key={h} className="py-2 px-3 font-semibold text-slate-300">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={previewHeaders.length + 2} className="py-8 text-center text-slate-500 font-sans">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map(row => {
                          const isExpanded = expandedRows.has(row.rowNum);
                          return (
                            <React.Fragment key={row.rowNum}>
                              <tr
                                onClick={() => toggleRowExpanded(row.rowNum)}
                                className={`hover:bg-slate-900/60 transition-colors cursor-pointer ${
                                  row.status === 'error'
                                    ? 'bg-rose-950/15'
                                    : row.status === 'warning'
                                    ? 'bg-amber-950/10'
                                    : ''
                                }`}
                              >
                                <td className="py-2 px-2.5 text-center text-slate-500 font-mono text-[10px]">
                                  <div className="flex items-center justify-center gap-1">
                                    {isExpanded ? (
                                      <ChevronDown className="w-3 h-3 text-cyan-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-slate-600" />
                                    )}
                                    <span>#{row.rowNum}</span>
                                  </div>
                                </td>

                                <td className="py-2 px-3">
                                  {row.status === 'valid' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                                      <span>Valid</span>
                                    </span>
                                  ) : row.status === 'warning' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                                      <span>{row.warnings.length} Warning</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-max">
                                      <AlertCircle className="w-3 h-3 text-rose-400" />
                                      <span>{row.errors.length} Error</span>
                                    </span>
                                  )}
                                </td>

                                {previewHeaders.map(h => {
                                  const cellVal = row.data[h];
                                  const cellInspection = row.cellResults[h];
                                  const isCellError = cellInspection?.status === 'error';
                                  const isCellWarning = cellInspection?.status === 'warning';

                                  return (
                                    <td
                                      key={h}
                                      title={cellInspection?.message || String(cellVal ?? '')}
                                      className={`py-2 px-3 transition-colors ${
                                        isCellError
                                          ? 'bg-rose-950/40 text-rose-200 border-l border-r border-rose-500/50 font-bold'
                                          : isCellWarning
                                          ? 'bg-amber-950/30 text-amber-200 border-l border-r border-amber-500/40 font-medium'
                                          : 'text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        {isCellError && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        )}
                                        {isCellWarning && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                        )}
                                        <span className="truncate max-w-[180px]">
                                          {cellVal === undefined || cellVal === null || String(cellVal).trim() === '' ? (
                                            <span className="text-slate-600 italic">&lt;empty&gt;</span>
                                          ) : (
                                            String(cellVal)
                                          )}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>

                              {/* Expanded Row Diagnostic Drawer */}
                              {isExpanded && (
                                <tr className="bg-slate-900/90 text-xs font-sans">
                                  <td colSpan={previewHeaders.length + 2} className="p-3 border-l-2 border-cyan-500">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-xs font-mono">
                                        <span className="font-bold text-white flex items-center gap-2">
                                          <Info className="w-3.5 h-3.5 text-cyan-400" />
                                          <span>Row #{row.rowNum} Pre-Ingestion Diagnostic Assessment</span>
                                        </span>
                                        <span className="text-slate-400 text-[11px]">
                                          {row.errors.length} Errors &bull; {row.warnings.length} Warnings
                                        </span>
                                      </div>

                                      {row.errors.length > 0 && (
                                        <div className="space-y-1">
                                          <span className="text-rose-400 text-[11px] font-mono font-bold block uppercase">
                                            Critical Errors (Action Required / Rejection):
                                          </span>
                                          <ul className="list-disc list-inside space-y-0.5 text-rose-300 text-xs">
                                            {row.errors.map((err, i) => (
                                              <li key={i}>{err}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {row.warnings.length > 0 && (
                                        <div className="space-y-1">
                                          <span className="text-amber-400 text-[11px] font-mono font-bold block uppercase">
                                            Formatting Warnings (Auto-Cleaned upon ingestion):
                                          </span>
                                          <ul className="list-disc list-inside space-y-0.5 text-amber-300 text-xs">
                                            {row.warnings.map((warn, i) => (
                                              <li key={i}>{warn}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {row.errors.length === 0 && row.warnings.length === 0 && (
                                        <p className="text-emerald-400 text-xs">
                                          ✓ Row passed all structural and epidemiological validation rules.
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pre-Ingestion Gatekeeper Advisory Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-xs font-mono space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Automated Ingestion Protocol for Argao MESU:</span>
                </div>
                <p className="text-slate-400 font-sans text-xs leading-relaxed">
                  Upon clicking <strong>&quot;Process &amp; Ingest Dataset&quot;</strong>, the pipeline applies fuzzy column normalization, imputes missing ages via median, scrubs PII, derives morbidity weeks, and strictly enforces territorial scope — filtering cases from outside the Municipality of Argao into the statutory audit log.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {filename && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline truncate max-w-xs">
                Selected: <strong className="text-white">{filename}</strong>
              </span>
            )}
            <button
              onClick={handleCommitIngestion}
              disabled={!csvContent}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                Process &amp; Ingest Dataset ({totalRowCount} Records
                {parsedWorkbook && parsedWorkbook.sheets.length > 1
                  ? ` • ${parsedWorkbook.sheets[activeSheetIndex]?.name}`
                  : ''}
                )
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
