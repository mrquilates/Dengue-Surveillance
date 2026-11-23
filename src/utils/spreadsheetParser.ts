/**
 * Spreadsheet Parser Utility
 * Supports ANY spreadsheet format:
 * - Microsoft Excel: .xlsx, .xls, .xlsm, .xlsb
 * - OpenDocument Spreadsheet: .ods, .fods
 * - Delimited text: .csv, .tsv, .tab, .txt
 * - Other formats: .prn, .dif, .slk, .xml
 * 
 * Includes intelligent header detection (skips report banners/titles),
 * Excel date serial conversion, multi-sheet inspection, and sanitization.
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  previewRows: Record<string, any>[];
  csv: string;
}

export interface ParsedSpreadsheetResult {
  fileName: string;
  fileSizeBytes: number;
  fileFormat: string;
  formatBadge: {
    label: string;
    color: string;
  };
  sheets: SheetInfo[];
  activeSheetIndex: number;
  activeSheet: SheetInfo;
  csvContent: string;
  headers: string[];
  totalRowCount: number;
}

// Supported file extension patterns
export const SUPPORTED_SPREADSHEET_EXTENSIONS = [
  '.csv',
  '.xlsx',
  '.xls',
  '.xlsm',
  '.xlsb',
  '.ods',
  '.tsv',
  '.tab',
  '.txt',
  '.dif',
  '.slk',
  '.prn',
];

export const ACCEPT_SPREADSHEET_MIME = [
  '.csv',
  '.xlsx',
  '.xls',
  '.xlsm',
  '.xlsb',
  '.ods',
  '.tsv',
  '.tab',
  '.txt',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'application/vnd.oasis.opendocument.spreadsheet',
  'text/csv',
  'text/tab-separated-values',
  'text/plain',
].join(',');

/**
 * Determine human-friendly format name & visual color badge from file extension
 */
export function getSpreadsheetFormatDetails(filename: string): { label: string; format: string; color: string } {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.xlsx':
      return { label: 'Excel (XLSX)', format: 'xlsx', color: 'emerald' };
    case '.xls':
      return { label: 'Excel 97-2004 (XLS)', format: 'xls', color: 'teal' };
    case '.xlsm':
      return { label: 'Excel Macro (XLSM)', format: 'xlsm', color: 'cyan' };
    case '.xlsb':
      return { label: 'Excel Binary (XLSB)', format: 'xlsb', color: 'indigo' };
    case '.ods':
      return { label: 'OpenDocument (ODS)', format: 'ods', color: 'purple' };
    case '.tsv':
    case '.tab':
      return { label: 'Tab Delimited (TSV)', format: 'tsv', color: 'blue' };
    case '.txt':
      return { label: 'Text Delimited (TXT)', format: 'txt', color: 'slate' };
    case '.dif':
      return { label: 'Data Interchange (DIF)', format: 'dif', color: 'amber' };
    case '.slk':
      return { label: 'Symbolic Link (SYLK)', format: 'slk', color: 'amber' };
    case '.csv':
    default:
      return { label: 'Delimited (CSV)', format: 'csv', color: 'cyan' };
  }
}

/**
 * Smart header detection:
 * Often governmental/hospital linelists have 1-4 lines of preamble/titles,
 * e.g., "Republic of the Philippines", "Department of Health", "PIDSR Linelist", etc.
 * This identifies the row index that represents the true column headers.
 */
function findHeaderRowIndex(rawMatrix: any[][]): number {
  if (!rawMatrix || rawMatrix.length === 0) return 0;

  let bestIndex = 0;
  let maxScore = -1;

  // Inspect up to first 12 rows
  const maxInspect = Math.min(12, rawMatrix.length);
  for (let r = 0; r < maxInspect; r++) {
    const row = rawMatrix[r];
    if (!Array.isArray(row)) continue;

    const nonBlankCount = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim().length > 0).length;
    if (nonBlankCount < 2) continue;

    // Check if contains typical surveillance header keywords
    let keywordMatches = 0;
    const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
    const surveillanceKeywords = [
      'epiid', 'case', 'id', 'disease', 'age', 'sex', 'morbidity', 'week',
      'municipality', 'barangay', 'onset', 'consult', 'admit', 'classification', 'outcome'
    ];
    for (const kw of surveillanceKeywords) {
      if (rowStr.includes(kw)) keywordMatches++;
    }

    const score = nonBlankCount + (keywordMatches * 5);
    if (score > maxScore) {
      maxScore = score;
      bestIndex = r;
    }
  }

  return bestIndex;
}

/**
 * Convert a single worksheet to structured SheetInfo (clean CSV and preview rows)
 */
function convertWorksheetToSheetInfo(sheetName: string, worksheet: XLSX.WorkSheet): SheetInfo {
  // Convert worksheet to raw 2D array
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (!rawMatrix || rawMatrix.length === 0) {
    return {
      name: sheetName,
      rowCount: 0,
      columnCount: 0,
      headers: [],
      previewRows: [],
      csv: '',
    };
  }

  // Detect header row index (smart preamble skip)
  const headerIdx = findHeaderRowIndex(rawMatrix);
  const rawHeaders = (rawMatrix[headerIdx] || []).map((h: any, idx: number) => {
    const str = String(h ?? '').trim();
    return str || `Column_${idx + 1}`;
  });

  // Filter out completely blank trailing columns
  let lastNonEmptyCol = rawHeaders.length - 1;
  while (lastNonEmptyCol >= 0 && rawHeaders[lastNonEmptyCol].startsWith('Column_')) {
    // Check if any data row has content in this column
    const hasData = rawMatrix.slice(headerIdx + 1).some(row => row && row[lastNonEmptyCol] !== '' && row[lastNonEmptyCol] !== undefined);
    if (hasData) break;
    lastNonEmptyCol--;
  }
  const headers = rawHeaders.slice(0, Math.max(1, lastNonEmptyCol + 1));

  // Extract data rows
  const dataRowsMatrix = rawMatrix.slice(headerIdx + 1);
  const objects: Record<string, any>[] = [];

  for (const row of dataRowsMatrix) {
    if (!row || !Array.isArray(row)) continue;
    const isBlank = row.every(c => c === '' || c === undefined || c === null);
    if (isBlank) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((h: string, colIdx: number) => {
      let val = row[colIdx];
      if (val === undefined || val === null) val = '';
      rowObj[h] = typeof val === 'string' ? val.trim() : String(val);
    });
    objects.push(rowObj);
  }

  // Generate standardized clean CSV representation
  const cleanCsv = Papa.unparse({
    fields: headers,
    data: objects.map(obj => headers.map(h => obj[h] ?? '')),
  });

  return {
    name: sheetName,
    rowCount: objects.length,
    columnCount: headers.length,
    headers,
    previewRows: objects.slice(0, 30),
    csv: cleanCsv,
  };
}

/**
 * Main parser function: parses ANY spreadsheet file buffer or string
 */
export async function parseAnySpreadsheet(file: File): Promise<ParsedSpreadsheetResult> {
  const fileName = file.name;
  const fileSizeBytes = file.size;
  const formatInfo = getSpreadsheetFormatDetails(fileName);
  const isPlainCsvOrTsv =
    fileName.toLowerCase().endsWith('.csv') ||
    fileName.toLowerCase().endsWith('.tsv') ||
    fileName.toLowerCase().endsWith('.txt');

  const arrayBuffer = await file.arrayBuffer();

  // If plain CSV/TSV, try fast PapaParse first, fallback to XLSX
  if (isPlainCsvOrTsv) {
    try {
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(arrayBuffer);

      // Check if valid text
      if (text.includes('\n') || text.includes(',')) {
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: h => h.trim(),
        });

        if (parsed.meta.fields && parsed.meta.fields.length > 0) {
          const headers = parsed.meta.fields;
          const rows = parsed.data as Record<string, any>[];
          const sheetInfo: SheetInfo = {
            name: 'Sheet1',
            rowCount: rows.length,
            columnCount: headers.length,
            headers,
            previewRows: rows.slice(0, 30),
            csv: text,
          };

          return {
            fileName,
            fileSizeBytes,
            fileFormat: formatInfo.label,
            formatBadge: {
              label: formatInfo.label,
              color: formatInfo.color,
            },
            sheets: [sheetInfo],
            activeSheetIndex: 0,
            activeSheet: sheetInfo,
            csvContent: text,
            headers,
            totalRowCount: rows.length,
          };
        }
      }
    } catch {
      // Fall through to SheetJS
    }
  }

  // Parse workbook using SheetJS (handles .xlsx, .xls, .xlsm, .xlsb, .ods, .dif, etc.)
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: true,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('The spreadsheet contains no readable worksheets.');
  }

  const sheets: SheetInfo[] = [];
  for (const sName of sheetNames) {
    const ws = workbook.Sheets[sName];
    if (ws) {
      sheets.push(convertWorksheetToSheetInfo(sName, ws));
    }
  }

  // Pick first sheet that has rows or headers; fallback to index 0
  let activeIdx = sheets.findIndex(s => s.rowCount > 0 && s.headers.length > 0);
  if (activeIdx === -1) activeIdx = 0;

  const activeSheet = sheets[activeIdx] || {
    name: sheetNames[0],
    rowCount: 0,
    columnCount: 0,
    headers: [],
    previewRows: [],
    csv: '',
  };

  return {
    fileName,
    fileSizeBytes,
    fileFormat: formatInfo.label,
    formatBadge: {
      label: formatInfo.label,
      color: formatInfo.color,
    },
    sheets,
    activeSheetIndex: activeIdx,
    activeSheet,
    csvContent: activeSheet.csv,
    headers: activeSheet.headers,
    totalRowCount: activeSheet.rowCount,
  };
}

/**
 * Creates an authentic multi-sheet sample Excel file (.xlsx) in memory
 * for testing multi-sheet ingestion and preamble title skipping.
 */
export function createSampleMultiSheetExcelFile(): File {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Linelist with authentic DOH report header banner
  const sheet1Data = [
    ['Republic of the Philippines', '', '', '', '', '', '', '', '', ''],
    ['Department of Health - Epidemiology Bureau (CHD VII)', '', '', '', '', '', '', '', '', ''],
    ['PIDSR Dengue Surveillance Linelist - Argao, Cebu (2026)', '', '', '', '', '', '', '', '', ''],
    [], // intentional blank row before columns
    [
      'EPIID',
      'Disease ID',
      'Age at onset',
      'Sex (M/F)',
      'Municipality (Current)',
      'Barangay (Current)',
      'Date Onset of First Symptoms',
      'MW (Morbidity Week)',
      'Case Classification',
      'Outcome',
    ],
    ['DEN-2026-X01', 'DEN', 14, 'M', 'Argao, Cebu', 'Poblacion', '2026-08-10', 32, 'Confirmed', 'Recovered'],
    ['DEN-2026-X02', 'DEN', 27, 'F', 'Argao, Cebu', 'Talaga', '2026-08-12', 32, 'Probable', 'Alive'],
    ['DEN-2026-X03', 'DEN', 6, 'M', 'Argao, Cebu', 'Canbanua', '2026-08-14', 33, 'Confirmed', 'Recovered'],
    ['DEN-2026-X04', 'DEN', 42, 'F', 'Argao, Cebu', 'Bogo', '2026-08-15', 33, 'Suspect', 'Alive'],
    ['DEN-2026-X05', 'DEN', 19, 'F', 'Argao, Cebu', 'Lamacan', '2026-08-18', 33, 'Confirmed', 'Alive'],
    ['DEN-2026-X06', 'DEN', 33, 'M', 'Argao, Cebu', 'Ubaub', '2026-08-20', 34, 'Confirmed', 'Alive'],
    ['DEN-2026-X07', 'DEN', 8, 'F', 'Argao, Cebu', 'Poblacion', '2026-08-21', 34, 'Probable', 'Recovered'],
    ['DEN-2026-X08', 'DEN', 55, 'M', 'Argao, Cebu', 'Bugas', '2026-08-22', 34, 'Confirmed', 'Alive'],
    ['DEN-2026-X09', 'DEN', 11, 'M', 'Argao, Cebu', 'Canbanua', '2026-08-23', 34, 'Confirmed', 'Alive'],
    ['DEN-2026-X10', 'DEN', 24, 'F', 'Argao, Cebu', 'Alambijud', '2026-08-24', 34, 'Suspect', 'Alive'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'PIDSR_LineList');

  // Sheet 2: Morbidity Summary Stats
  const sheet2Data = [
    ['Morbidity Week', 'Municipality', 'Total Cases', 'Confirmed', 'Probable', 'Suspect'],
    [32, 'Argao, Cebu', 2, 1, 1, 0],
    [33, 'Argao, Cebu', 3, 2, 0, 1],
    [34, 'Argao, Cebu', 5, 3, 1, 1],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Morbidity_Summary');

  // Sheet 3: Catchment Reference
  const sheet3Data = [
    ['PSGC_Barangay', 'Barangay Name', 'Catchment Sector', 'Health Station'],
    ['072205001', 'Poblacion', 'Urban Core', 'RHU 1 - Poblacion'],
    ['072205002', 'Talaga', 'Coastal Zone', 'Talaga BHS'],
    ['072205003', 'Canbanua', 'Upland Sector', 'Canbanua BHS'],
    ['072205004', 'Bogo', 'Agricultural Corridor', 'Bogo BHS'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Catchment_Reference');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return new File([blob], 'doh_pidsr_surveillance_argao_multisheet.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
