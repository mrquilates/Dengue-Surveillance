/**
 * Google Sheets Clipboard Parser & Column Mapping Utility
 * Parses tab-separated (TSV), comma-separated (CSV), semicolon-separated,
 * or HTML table clipboard payloads directly from Google Sheets into
 * validated PIDSR Dengue Surveillance line-list rows.
 */

import Papa from 'papaparse';
import {
  detectSchemaMapping,
  isArgaoJurisdiction,
  parseDateToISO,
} from './dataCleaner';
import { SurveillanceRecord } from '../types/surveillance';

export type DetectedDelimiter = 'tab' | 'comma' | 'semicolon';

export type CanonicalPidsrFieldKey =
  | '__ignore__'
  | 'epiId'
  | 'diseaseId'
  | 'age'
  | 'sex'
  | 'municipality'
  | 'barangay'
  | 'dateOnset'
  | 'morbidityWeek'
  | 'consulted'
  | 'admitted'
  | 'caseClassification'
  | 'clinicalClassification'
  | 'outcome'
  | 'psgcMunicipality'
  | 'psgcBarangay'
  | 'dateConsult'
  | 'dateAdmit'
  | 'nameOfDru';

export interface PidsrFieldOption {
  key: CanonicalPidsrFieldKey;
  label: string;
  csvHeader: string;
  mandatory?: boolean;
}

export const PIDSR_FIELD_OPTIONS: PidsrFieldOption[] = [
  { key: '__ignore__', label: 'Ignore Column', csvHeader: '' },
  { key: 'epiId', label: 'EPIID (Case ID)', csvHeader: 'EPIID', mandatory: true },
  { key: 'diseaseId', label: 'Disease ID', csvHeader: 'Disease ID' },
  { key: 'age', label: 'Age at Onset', csvHeader: 'Age at onset', mandatory: true },
  { key: 'sex', label: 'Sex (M/F)', csvHeader: 'Sex (M/F)', mandatory: true },
  { key: 'municipality', label: 'Municipality', csvHeader: 'Municipality (Current)' },
  { key: 'barangay', label: 'Barangay', csvHeader: 'Barangay (Current)', mandatory: true },
  { key: 'dateOnset', label: 'Date Onset', csvHeader: 'Date Onset of First Symptoms', mandatory: true },
  { key: 'morbidityWeek', label: 'Morbidity Week (MW)', csvHeader: 'MW (Morbidity Week)' },
  { key: 'consulted', label: 'Consulted (Y/N)', csvHeader: 'Consulted (Y/N)' },
  { key: 'admitted', label: 'Admitted (Y/N)', csvHeader: 'Admitted (Y/N)' },
  { key: 'caseClassification', label: 'Case Classification', csvHeader: 'Case Classification' },
  { key: 'clinicalClassification', label: 'Clinical Classification', csvHeader: 'Clinical Classification' },
  { key: 'outcome', label: 'Outcome', csvHeader: 'Outcome' },
  { key: 'psgcMunicipality', label: 'PSGC Municipality', csvHeader: 'PSGC_Municipality' },
  { key: 'psgcBarangay', label: 'PSGC Barangay', csvHeader: 'PSGC_Barangay' },
  { key: 'dateConsult', label: 'Date Consulted', csvHeader: 'Date Consulted' },
  { key: 'dateAdmit', label: 'Date Admitted', csvHeader: 'Date Admitted' },
  { key: 'nameOfDru', label: 'Reporting Facility (DRU)', csvHeader: 'NameOfDru' },
];

export interface ParsedPasteMatrix {
  delimiter: DetectedDelimiter;
  delimiterLabel: string;
  headerRowIndex: number;
  headers: string[];
  dataRows: string[][];
  suggestedMapping: Record<number, CanonicalPidsrFieldKey>;
  totalRawLines: number;
}

export interface RowCellCheck {
  status: 'valid' | 'warning' | 'error';
  message?: string;
}

export interface ValidatedPasteRow {
  rowIndex: number; // 1-based display index
  rawCells: string[];
  mappedValues: Record<string, string>;
  overallStatus: 'valid' | 'warning' | 'rejected';
  issues: string[];
  cellChecks: Record<string, RowCellCheck>;
}

export interface PasteValidationSummary {
  rows: ValidatedPasteRow[];
  totalCount: number;
  validCount: number;
  warningCount: number;
  rejectedCount: number;
  readyToConnectCount: number;
  missingRecommendedFields: PidsrFieldOption[];
}

export const SAMPLE_GOOGLE_SHEETS_TSV = [
  [
    'EPIID',
    'Disease ID',
    'Age at onset',
    'Sex (M/F)',
    'Municipality (Current)',
    'Barangay (Current)',
    'Date Onset of First Symptoms',
    'MW (Morbidity Week)',
    'Admitted (Y/N)',
    'Case Classification',
    'Clinical Classification',
    'Outcome',
  ].join('\t'),
  ['DEN-2026-GS01', 'DEN', '12', 'M', 'Argao, Cebu', 'Poblacion', '2026-10-12', '42', 'Y', 'Confirmed', 'Dengue with Warning Signs', 'Alive'].join('\t'),
  ['DEN-2026-GS02', 'DEN', '29', 'F', 'Argao', 'Talaga', '2026-10-14', '42', 'N', 'Probable', 'Dengue without Warning Signs', 'Recovered'].join('\t'),
  ['DEN-2026-GS03', 'DEN', '7', 'M', 'Argao, Cebu', 'Canbanua', '2026-10-18', '43', 'Y', 'Confirmed', 'Severe Dengue', 'Alive'].join('\t'),
  ['DEN-2026-GS04', 'DEN', '41', 'F', 'Argao', 'Bogo', '10/20/2026', '43', 'N', 'Suspect', 'Dengue without Warning Signs', 'Alive'].join('\t'),
  ['DEN-2026-GS05', 'DEN', '17', 'Female', 'Argao', 'Lamacan', '2026-10-22', '43', 'Y', 'Confirmed', 'Dengue with Warning Signs', 'Recovered'].join('\t'),
  ['DEN-2026-GS06', 'DEN', '34', 'M', 'Dalaguete, Cebu', 'Poblacion', '2026-10-23', '43', 'N', 'Probable', 'Dengue without Warning Signs', 'Alive'].join('\t'),
].join('\n');

/**
 * Extract plain TSV from Google Sheets HTML clipboard table if plain text is missing
 */
export function extractHtmlTableToTSV(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = Array.from(doc.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    const lines = rows
      .map(tr => {
        const cells = Array.from(tr.querySelectorAll('th, td'));
        return cells
          .map(cell => (cell.textContent || '').replace(/[\r\n\t]+/g, ' ').trim())
          .join('\t');
      })
      .filter(line => line.trim().length > 0);

    return lines.join('\n');
  } catch {
    return '';
  }
}

/**
 * Detect whether pasted text uses tab (Google Sheets), comma, or semicolon
 */
export function detectClipboardDelimiter(text: string): {
  delimiter: DetectedDelimiter;
  char: string;
  label: string;
} {
  const sampleLines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 8);

  let tabScore = 0;
  let commaScore = 0;
  let semiScore = 0;

  for (const line of sampleLines) {
    tabScore += (line.match(/\t/g) || []).length;
    commaScore += (line.match(/,/g) || []).length;
    semiScore += (line.match(/;/g) || []).length;
  }

  if (tabScore >= commaScore && tabScore >= semiScore && tabScore > 0) {
    return { delimiter: 'tab', char: '\t', label: 'Tab-Separated (Google Sheets TSV)' };
  }
  if (semiScore > commaScore && semiScore > 0) {
    return { delimiter: 'semicolon', char: ';', label: 'Semicolon-Delimited' };
  }
  if (commaScore > 0) {
    return { delimiter: 'comma', char: ',', label: 'Comma-Separated (CSV)' };
  }
  return { delimiter: 'tab', char: '\t', label: 'Tab-Separated (TSV)' };
}

function findPasteHeaderRowIndex(matrix: string[][]): number {
  const maxInspect = Math.min(10, matrix.length);
  let bestIdx = 0;
  let bestScore = -1;

  const keywords = [
    'epiid',
    'case',
    'id',
    'disease',
    'age',
    'sex',
    'morbidity',
    'week',
    'mw',
    'municipality',
    'barangay',
    'brgy',
    'onset',
    'consult',
    'admit',
    'classification',
    'outcome',
  ];

  for (let r = 0; r < maxInspect; r++) {
    const row = matrix[r];
    if (!row) continue;
    const nonEmpty = row.filter(c => String(c || '').trim().length > 0).length;
    if (nonEmpty < 2) continue;

    const joined = row.map(c => String(c || '').toLowerCase()).join(' ');
    let kwHits = 0;
    for (const kw of keywords) {
      if (joined.includes(kw)) kwHits++;
    }

    const score = nonEmpty + kwHits * 5;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = r;
    }
  }

  return bestIdx;
}

/**
 * Parse raw pasted spreadsheet text into headers, data rows, and suggested PIDSR column mappings
 */
export function parseClipboardSheetText(
  rawText: string,
  hasHeaderRow = true
): ParsedPasteMatrix | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const { delimiter, char, label } = detectClipboardDelimiter(trimmed);
  const parsed = Papa.parse<string[]>(trimmed, {
    delimiter: char,
    skipEmptyLines: true,
  });

  const rawMatrix: string[][] = (parsed.data || [])
    .map(row => (Array.isArray(row) ? row.map(c => String(c ?? '').trim()) : []))
    .filter(row => row.some(cell => cell.length > 0));

  if (rawMatrix.length === 0) return null;

  // Normalize column count to max width across rows
  const maxCols = rawMatrix.reduce((max, r) => Math.max(max, r.length), 0);
  if (maxCols === 0) return null;

  const paddedMatrix = rawMatrix.map(r => {
    const copy = [...r];
    while (copy.length < maxCols) copy.push('');
    return copy;
  });

  // Trim completely empty trailing columns
  let lastUsedCol = maxCols - 1;
  while (lastUsedCol > 0) {
    const hasAny = paddedMatrix.some(row => row[lastUsedCol]?.trim().length > 0);
    if (hasAny) break;
    lastUsedCol--;
  }
  const colCount = lastUsedCol + 1;
  const cleanMatrix = paddedMatrix.map(row => row.slice(0, colCount));

  let headerRowIndex = 0;
  let headers: string[] = [];
  let dataRows: string[][] = [];

  if (hasHeaderRow) {
    headerRowIndex = findPasteHeaderRowIndex(cleanMatrix);
    headers = cleanMatrix[headerRowIndex].map((h, idx) => h || `Column ${idx + 1}`);
    dataRows = cleanMatrix.slice(headerRowIndex + 1);
  } else {
    headers = Array.from({ length: colCount }, (_, idx) => `Column ${idx + 1}`);
    dataRows = cleanMatrix;
  }

  // Suggest PIDSR column mapping via existing schema detector
  const suggestedMapping: Record<number, CanonicalPidsrFieldKey> = {};
  const usedTargets = new Set<CanonicalPidsrFieldKey>();

  if (hasHeaderRow) {
    const { mapping } = detectSchemaMapping(headers);
    headers.forEach((headerName, colIdx) => {
      const matchedEntry = Object.entries(mapping).find(([, rawH]) => rawH === headerName);
      if (matchedEntry) {
        const targetKey = matchedEntry[0] as CanonicalPidsrFieldKey;
        const validOption = PIDSR_FIELD_OPTIONS.some(opt => opt.key === targetKey);
        if (validOption && !usedTargets.has(targetKey)) {
          suggestedMapping[colIdx] = targetKey;
          usedTargets.add(targetKey);
          return;
        }
      }
      suggestedMapping[colIdx] = '__ignore__';
    });
  } else {
    // Positional fallback if user pasted headerless rows in standard order
    const defaultOrder: CanonicalPidsrFieldKey[] = [
      'epiId',
      'diseaseId',
      'age',
      'sex',
      'municipality',
      'barangay',
      'dateOnset',
      'morbidityWeek',
      'admitted',
      'caseClassification',
      'clinicalClassification',
      'outcome',
    ];
    for (let i = 0; i < colCount; i++) {
      suggestedMapping[i] = defaultOrder[i] || '__ignore__';
    }
  }

  return {
    delimiter,
    delimiterLabel: label,
    headerRowIndex,
    headers,
    dataRows,
    suggestedMapping,
    totalRawLines: cleanMatrix.length,
  };
}

/**
 * Evaluate each pasted row against surveillance validation rules
 */
export function validateMappedPasteRows(
  dataRows: string[][],
  columnMapping: Record<number, CanonicalPidsrFieldKey>,
  existingRecords: SurveillanceRecord[] = []
): PasteValidationSummary {
  const existingEpiIds = new Set(
    existingRecords
      .map(r => (r.epiId || '').trim().toUpperCase())
      .filter(Boolean)
  );
  const seenInPaste = new Set<string>();

  // Reverse lookup: CanonicalPidsrFieldKey -> column index
  const fieldToColIdx: Partial<Record<CanonicalPidsrFieldKey, number>> = {};
  Object.entries(columnMapping).forEach(([colIdxStr, fieldKey]) => {
    if (fieldKey !== '__ignore__' && fieldToColIdx[fieldKey] === undefined) {
      fieldToColIdx[fieldKey] = Number(colIdxStr);
    }
  });

  const missingRecommendedFields = PIDSR_FIELD_OPTIONS.filter(
    opt => opt.mandatory && fieldToColIdx[opt.key] === undefined
  );

  const getVal = (row: string[], key: CanonicalPidsrFieldKey): string => {
    const idx = fieldToColIdx[key];
    if (idx === undefined) return '';
    return (row[idx] ?? '').trim();
  };

  let validCount = 0;
  let warningCount = 0;
  let rejectedCount = 0;

  const rows: ValidatedPasteRow[] = dataRows.map((rawCells, idx) => {
    const issues: string[] = [];
    const cellChecks: Record<string, RowCellCheck> = {};

    const epiId = getVal(rawCells, 'epiId');
    const diseaseId = getVal(rawCells, 'diseaseId') || 'DEN';
    const ageRaw = getVal(rawCells, 'age');
    const sexRaw = getVal(rawCells, 'sex');
    const municipality = getVal(rawCells, 'municipality');
    const psgcMuni = getVal(rawCells, 'psgcMunicipality');
    const barangay = getVal(rawCells, 'barangay');
    const dateOnsetRaw = getVal(rawCells, 'dateOnset');
    const mwRaw = getVal(rawCells, 'morbidityWeek');
    const classification = getVal(rawCells, 'caseClassification');
    const outcome = getVal(rawCells, 'outcome');

    let isRejected = false;
    let hasWarning = false;

    // 1. Disease ID check
    const normDisease = diseaseId.toUpperCase();
    if (normDisease !== 'DEN' && !normDisease.includes('DENGUE')) {
      isRejected = true;
      issues.push(`Non-Dengue disease code ("${diseaseId}")`);
      cellChecks.diseaseId = { status: 'error', message: `Expected DEN, found "${diseaseId}"` };
    } else {
      cellChecks.diseaseId = { status: 'valid' };
    }

    // 2. Municipality / Territorial Check (Argao, Cebu)
    if (fieldToColIdx.municipality !== undefined || fieldToColIdx.psgcMunicipality !== undefined) {
      if (municipality || psgcMuni) {
        if (!isArgaoJurisdiction(municipality, psgcMuni)) {
          isRejected = true;
          issues.push(`Outside Argao jurisdiction ("${municipality || psgcMuni}")`);
          cellChecks.municipality = {
            status: 'error',
            message: `Outside Argao, Cebu (RA 11332 territorial filter)`,
          };
        } else {
          cellChecks.municipality = { status: 'valid' };
        }
      } else {
        hasWarning = true;
        issues.push('Empty municipality (will default to Argao)');
        cellChecks.municipality = { status: 'warning', message: 'Empty — defaults to Argao' };
      }
    }

    // 3. EPIID Check
    if (fieldToColIdx.epiId !== undefined) {
      if (!epiId) {
        hasWarning = true;
        issues.push('Missing EPIID (auto-ID will be generated)');
        cellChecks.epiId = { status: 'warning', message: 'Missing — will auto-generate' };
      } else {
        const upperId = epiId.toUpperCase();
        if (existingEpiIds.has(upperId) || seenInPaste.has(upperId)) {
          hasWarning = true;
          issues.push(`Duplicate EPIID "${epiId}" (flagged on deduplication)`);
          cellChecks.epiId = { status: 'warning', message: 'Duplicate EPIID detected' };
        } else {
          cellChecks.epiId = { status: 'valid' };
        }
        seenInPaste.add(upperId);
      }
    }

    // 4. Age Check
    if (fieldToColIdx.age !== undefined) {
      if (!ageRaw) {
        hasWarning = true;
        issues.push('Missing Age');
        cellChecks.age = { status: 'warning', message: 'Missing age' };
      } else {
        const num = Number(ageRaw.replace(/[^\d.]/g, ''));
        if (isNaN(num) || num < 0 || num > 120) {
          hasWarning = true;
          issues.push(`Invalid Age "${ageRaw}"`);
          cellChecks.age = { status: 'warning', message: `Out of bounds (0–120)` };
        } else {
          cellChecks.age = { status: 'valid' };
        }
      }
    }

    // 5. Sex Check
    if (fieldToColIdx.sex !== undefined) {
      const s = sexRaw.toUpperCase();
      if (!['M', 'F', 'MALE', 'FEMALE', '1', '2'].includes(s)) {
        hasWarning = true;
        issues.push(`Unrecognized Sex "${sexRaw || 'Empty'}"`);
        cellChecks.sex = { status: 'warning', message: 'Expected M or F' };
      } else {
        cellChecks.sex = { status: 'valid' };
      }
    }

    // 6. Barangay Check
    if (fieldToColIdx.barangay !== undefined) {
      if (!barangay) {
        hasWarning = true;
        issues.push('Missing Barangay (will default to Poblacion)');
        cellChecks.barangay = { status: 'warning', message: 'Empty — defaults to Poblacion' };
      } else {
        cellChecks.barangay = { status: 'valid' };
      }
    }

    // 7. Onset Date Check
    if (fieldToColIdx.dateOnset !== undefined) {
      const parsedDate = parseDateToISO(dateOnsetRaw);
      if (!parsedDate.iso) {
        hasWarning = true;
        issues.push(parsedDate.error || 'Invalid Date Onset');
        cellChecks.dateOnset = { status: 'warning', message: parsedDate.error || 'Invalid date' };
      } else {
        cellChecks.dateOnset = { status: 'valid' };
      }
    }

    // 8. Morbidity Week Check
    if (fieldToColIdx.morbidityWeek !== undefined && mwRaw) {
      const match = mwRaw.match(/\d{1,2}/);
      const mwNum = match ? parseInt(match[0], 10) : NaN;
      if (isNaN(mwNum) || mwNum < 1 || mwNum > 53) {
        hasWarning = true;
        issues.push(`Invalid MW "${mwRaw}"`);
        cellChecks.morbidityWeek = { status: 'warning', message: 'Expected 1–53' };
      } else {
        cellChecks.morbidityWeek = { status: 'valid' };
      }
    }

    const overallStatus: 'valid' | 'warning' | 'rejected' = isRejected
      ? 'rejected'
      : hasWarning
      ? 'warning'
      : 'valid';

    if (overallStatus === 'rejected') rejectedCount++;
    else if (overallStatus === 'warning') warningCount++;
    else validCount++;

    return {
      rowIndex: idx + 1,
      rawCells,
      mappedValues: {
        epiId,
        diseaseId: normDisease.includes('DENGUE') ? 'DEN' : normDisease,
        age: ageRaw,
        sex: sexRaw,
        municipality: municipality || 'Argao',
        barangay,
        dateOnset: dateOnsetRaw,
        morbidityWeek: mwRaw,
        caseClassification: classification,
        outcome,
      },
      overallStatus,
      issues,
      cellChecks,
    };
  });

  return {
    rows,
    totalCount: rows.length,
    validCount,
    warningCount,
    rejectedCount,
    readyToConnectCount: validCount + warningCount,
    missingRecommendedFields,
  };
}

/**
 * Serialize mapped paste rows into canonical PIDSR CSV text for processRawSurveillanceCSV
 */
export function buildCanonicalCSVFromMappedPaste(
  dataRows: string[][],
  columnMapping: Record<number, CanonicalPidsrFieldKey>,
  validatedRows: ValidatedPasteRow[]
): string {
  const activeFieldOptions = PIDSR_FIELD_OPTIONS.filter(opt => opt.key !== '__ignore__');

  // Map canonical key -> source column index
  const fieldToColIdx: Partial<Record<CanonicalPidsrFieldKey, number>> = {};
  Object.entries(columnMapping).forEach(([colIdxStr, fieldKey]) => {
    if (fieldKey !== '__ignore__' && fieldToColIdx[fieldKey] === undefined) {
      fieldToColIdx[fieldKey] = Number(colIdxStr);
    }
  });

  // Always include Disease ID & Municipality so Argao Dengue scope holds even if omitted in paste
  const exportFields = activeFieldOptions.filter(
    opt =>
      fieldToColIdx[opt.key] !== undefined ||
      opt.key === 'diseaseId' ||
      opt.key === 'municipality'
  );

  const headers = exportFields.map(opt => opt.csvHeader);

  const rowsToExport = dataRows
    .filter((_, idx) => validatedRows[idx]?.overallStatus !== 'rejected')
    .map(rawRow => {
      return exportFields.map(opt => {
        const colIdx = fieldToColIdx[opt.key];
        const rawVal = colIdx !== undefined ? (rawRow[colIdx] ?? '').trim() : '';

        if (opt.key === 'diseaseId') {
          if (!rawVal || rawVal.toUpperCase().includes('DENGUE')) return 'DEN';
          return rawVal.toUpperCase();
        }
        if (opt.key === 'municipality') {
          return rawVal || 'Argao, Cebu';
        }
        return rawVal;
      });
    });

  return Papa.unparse({
    fields: headers,
    data: rowsToExport,
  });
}
