/**
 * Google Sheets and Google Drive Synchronization Utility
 * Enables real-time synchronization, importing, and exporting of epidemiological line-list datasets
 * directly from authenticated user Google Sheets and Drive files.
 */

import Papa from 'papaparse';
import { SurveillanceRecord } from '../types/surveillance';
import { getCachedAccessToken } from '../firebase';

export interface GoogleDriveSpreadsheet {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface GoogleSpreadsheetMetadata {
  id: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }>;
}

/**
 * Lists the authenticated user's Google Sheets from Google Drive
 */
export async function fetchUserSpreadsheets(
  token?: string | null
): Promise<GoogleDriveSpreadsheet[]> {
  const accessToken = token || getCachedAccessToken();
  if (!accessToken) {
    throw new Error('Google Workspace authentication required. Please sign in with Google.');
  }

  const queryParams = new URLSearchParams({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id, name, modifiedTime, webViewLink, iconLink)',
    orderBy: 'modifiedTime desc',
    pageSize: '25',
  });

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to fetch Google Spreadsheets (${response.status})`
    );
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetches sheet tabs and metadata for a specific spreadsheet
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  token?: string | null
): Promise<GoogleSpreadsheetMetadata> {
  const accessToken = token || getCachedAccessToken();
  if (!accessToken) {
    throw new Error('Google Workspace authentication required.');
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to fetch spreadsheet structure (${response.status})`
    );
  }

  const data = await response.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

/**
 * Fetches data rows from a specific Google Sheet tab and converts them to formatted CSV text
 * for ingestion into the surveillance line-list pipeline.
 */
export async function fetchGoogleSheetAsCSV(
  spreadsheetId: string,
  sheetName?: string,
  token?: string | null
): Promise<{ csvText: string; rowCount: number; sheetTitle: string }> {
  const accessToken = token || getCachedAccessToken();
  if (!accessToken) {
    throw new Error('Google Workspace authentication required.');
  }

  let targetSheetName = sheetName;

  // If no sheet name specified, retrieve the first available sheet tab
  if (!targetSheetName) {
    const metadata = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
    if (!metadata.sheets || metadata.sheets.length === 0) {
      throw new Error('Spreadsheet has no valid sheets.');
    }
    targetSheetName = metadata.sheets[0].title;
  }

  const encodedRange = encodeURIComponent(targetSheetName);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to fetch sheet data rows (${response.status})`
    );
  }

  const data = await response.json();
  const rows: any[][] = data.values || [];

  if (rows.length === 0) {
    throw new Error(`The selected sheet tab "${targetSheetName}" is empty.`);
  }

  // Convert 2D matrix of values to standardized CSV text
  const csvText = Papa.unparse(rows, {
    quotes: true,
    newline: '\n',
  });

  return {
    csvText,
    rowCount: Math.max(0, rows.length - 1),
    sheetTitle: targetSheetName,
  };
}

/**
 * Export current surveillance dataset to a new Google Sheet in the user's Drive
 */
export async function exportLineListToGoogleSheet(
  title: string,
  records: SurveillanceRecord[],
  token?: string | null
): Promise<{ spreadsheetId: string; webViewLink: string }> {
  const accessToken = token || getCachedAccessToken();
  if (!accessToken) {
    throw new Error('Google Workspace authentication required.');
  }

  // Prepare standard epidemiological CSV rows
  const headers = [
    'Disease ID',
    'EPIID',
    'Age at onset',
    'Sex (M/F)',
    'PSGC_Municipality',
    'Municipality (Current)',
    'PSGC_Barangay',
    'Barangay (Current)',
    'Date Onset of First Symptoms',
    'MW (Morbidity Week)',
    'Consulted (Y/N)',
    'Admitted (Y/N)',
    'Case Classification',
    'Clinical Classification',
    'Outcome',
  ];

  const rows = records.map(r => [
    r.diseaseId,
    r.epiId,
    r.age,
    r.sex,
    r.psgcMunicipality,
    r.municipality,
    r.psgcBarangay,
    r.barangay,
    r.dateOnset,
    r.morbidityWeek,
    r.consulted,
    r.admitted,
    r.caseClassification,
    r.clinicalClassification,
    r.outcome,
  ]);

  const requestBody = {
    properties: {
      title: `${title} - Surveillance Sync (${new Date().toLocaleDateString('en-CA')})`,
    },
    sheets: [
      {
        properties: {
          title: 'Epidemiological Line List',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headers.map(h => ({
                  userEnteredValue: { stringValue: h },
                })),
              },
              ...rows.map(row => ({
                values: row.map(val => ({
                  userEnteredValue:
                    typeof val === 'number'
                      ? { numberValue: val }
                      : { stringValue: String(val ?? '') },
                })),
              })),
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to create Google Sheet (${response.status})`
    );
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    webViewLink: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}
