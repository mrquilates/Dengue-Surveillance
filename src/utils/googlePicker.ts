/**
 * Google Picker API Integration Utility
 * Opens the native Google Picker UI dialog allowing users to browse and pick
 * Google Spreadsheets, CSV files, and surveillance dataset documents directly from Google Drive.
 */

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let isGapiLoaded = false;
let isPickerLoaded = false;

/**
 * Loads the Google API client library script dynamically
 */
export function loadGooglePickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isPickerLoaded && window.google?.picker) {
      resolve();
      return;
    }

    // Check if script is already injected
    const existingScript = document.getElementById('google-api-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-api-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isGapiLoaded = true;
        if (window.gapi) {
          window.gapi.load('picker', () => {
            isPickerLoaded = true;
            resolve();
          });
        } else {
          reject(new Error('Failed to initialize Google API client'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.body.appendChild(script);
    } else if (window.gapi) {
      window.gapi.load('picker', () => {
        isPickerLoaded = true;
        resolve();
      });
    } else {
      existingScript.addEventListener('load', () => {
        if (window.gapi) {
          window.gapi.load('picker', () => {
            isPickerLoaded = true;
            resolve();
          });
        }
      });
    }
  });
}

export interface PickedGoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
  description?: string;
}

export interface OpenPickerOptions {
  accessToken: string;
  onFilePicked: (file: PickedGoogleDriveFile) => void;
  onCancel?: () => void;
  viewType?: 'spreadsheets' | 'allDocs';
}

/**
 * Opens Google Picker dialog using the client-side Google Picker Builder pattern
 */
export async function openGooglePicker({
  accessToken,
  onFilePicked,
  onCancel,
  viewType = 'spreadsheets',
}: OpenPickerOptions): Promise<void> {
  if (!accessToken) {
    throw new Error('Access token is required to open Google Picker');
  }

  await loadGooglePickerApi();

  if (!window.google?.picker) {
    throw new Error('Google Picker library is not ready');
  }

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  const docsView = new window.google.picker.DocsView(
    viewType === 'spreadsheets'
      ? window.google.picker.ViewId.SPREADSHEETS
      : window.google.picker.ViewId.DOCS
  );

  // Configure view settings
  docsView.setIncludeFolders(true);
  docsView.setSelectFolderEnabled(false);
  if (viewType === 'spreadsheets') {
    docsView.setMimeTypes('application/vnd.google-apps.spreadsheet,text/csv');
  }

  const pickerBuilder = new window.google.picker.PickerBuilder()
    .addView(docsView)
    .setOAuthToken(accessToken)
    .setOrigin(pickerOrigin)
    .setTitle('Select Disease Surveillance Dataset or Spreadsheet')
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const pickedDoc = data.docs?.[0];
        if (pickedDoc) {
          onFilePicked({
            id: pickedDoc.id,
            name: pickedDoc.name,
            mimeType: pickedDoc.mimeType,
            url: pickedDoc.url,
            description: pickedDoc.description,
          });
        }
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (onCancel) onCancel();
      }
    });

  const picker = pickerBuilder.build();
  picker.setVisible(true);
}
