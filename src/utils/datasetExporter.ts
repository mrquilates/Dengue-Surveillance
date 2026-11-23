import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SurveillanceRecord } from '../types/surveillance';
import { triggerCSVDownload } from './sampleData';

interface ExportRow {
  'Disease ID': string;
  'EPIID': string;
  'Age at Onset': number | '';
  'Age Group': string;
  'Sex': string;
  'PSGC Municipality': string;
  'Municipality': string;
  'PSGC Barangay': string;
  'Barangay': string;
  'Date of Onset': string;
  'Morbidity Week (MW)': number;
  'Morbidity Year': number;
  'Date Consulted': string;
  'Consulted (Y/N)': string;
  'Admitted (Y/N)': string;
  'Case Classification': string;
  'Clinical Classification': string;
  'Outcome': string;
  'Lab Result': string;
}

function formatExportRows(records: SurveillanceRecord[]): ExportRow[] {
  return records.map(r => ({
    'Disease ID': r.diseaseId || 'DEN',
    'EPIID': r.epiId,
    'Age at Onset': r.age !== null ? r.age : '',
    'Age Group': r.ageGroup,
    'Sex': r.sex,
    'PSGC Municipality': r.psgcMunicipality || '072205000',
    'Municipality': r.municipality || 'Argao',
    'PSGC Barangay': r.psgcBarangay || '',
    'Barangay': r.barangay,
    'Date of Onset': r.dateOnset,
    'Morbidity Week (MW)': r.morbidityWeek,
    'Morbidity Year': r.morbidityYear || 2026,
    'Date Consulted': r.dateConsult || '',
    'Consulted (Y/N)': r.consulted,
    'Admitted (Y/N)': r.admitted,
    'Case Classification': r.caseClassification,
    'Clinical Classification': r.clinicalClassification,
    'Outcome': r.outcome,
    'Lab Result': r.labResult || '',
  }));
}

function buildDatedFilename(extension: 'csv' | 'xlsx'): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  return `argao_dengue_surveillance_${dateStamp}.${extension}`;
}

export function exportSurveillanceCSV(records: SurveillanceRecord[]): string {
  const rows = formatExportRows(records);
  const csvContent = Papa.unparse(rows, { quotes: false });
  const filename = buildDatedFilename('csv');
  triggerCSVDownload(csvContent, filename);
  return filename;
}

export function exportSurveillanceExcel(records: SurveillanceRecord[]): string {
  const rows = formatExportRows(records);
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Filtered Dengue Case Line-List
  const lineListSheet = XLSX.utils.json_to_sheet(rows);
  lineListSheet['!cols'] = [
    { wch: 11 }, // Disease ID
    { wch: 16 }, // EPIID
    { wch: 13 }, // Age at Onset
    { wch: 11 }, // Age Group
    { wch: 10 }, // Sex
    { wch: 18 }, // PSGC Municipality
    { wch: 15 }, // Municipality
    { wch: 16 }, // PSGC Barangay
    { wch: 20 }, // Barangay
    { wch: 14 }, // Date of Onset
    { wch: 18 }, // Morbidity Week
    { wch: 14 }, // Morbidity Year
    { wch: 14 }, // Date Consulted
    { wch: 15 }, // Consulted
    { wch: 15 }, // Admitted
    { wch: 19 }, // Case Classification
    { wch: 28 }, // Clinical Classification
    { wch: 12 }, // Outcome
    { wch: 16 }, // Lab Result
  ];
  XLSX.utils.book_append_sheet(workbook, lineListSheet, 'Line_List');

  // Sheet 2: Offline Reporting Metadata Summary
  const deaths = records.filter(r => r.outcome === 'Died').length;
  const admitted = records.filter(r => r.admitted === 'Y').length;
  const cfr = records.length > 0 ? ((deaths / records.length) * 100).toFixed(2) : '0.00';
  const hospRate = records.length > 0 ? ((admitted / records.length) * 100).toFixed(1) : '0.0';

  const summaryRows = [
    { Metric: 'Surveillance Jurisdiction', Value: 'Municipality of Argao, Cebu (PSGC 072205000)' },
    { Metric: 'Disease Scope', Value: 'Dengue (DEN) · DOH PIDSR Standard' },
    { Metric: 'Exported Timestamp', Value: new Date().toLocaleString() },
    { Metric: 'Exported Filtered Records', Value: records.length },
    { Metric: 'Admitted Cases (%)', Value: `${admitted} (${hospRate}%)` },
    { Metric: 'Total Deaths / CFR (%)', Value: `${deaths} (${cfr}%)` },
    { Metric: 'Privacy Compliance', Value: 'RA 10173 Data Privacy Act Compliant (PII Stripped)' },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Export_Summary');

  const filename = buildDatedFilename('xlsx');
  XLSX.writeFile(workbook, filename);
  return filename;
}
