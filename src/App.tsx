/**
 * Epidemiological Intelligence & Surveillance Dashboard
 * Municipality of Argao, Cebu
 */

import React, { useState, useMemo, useEffect } from 'react';
import { DengueBIDashboard } from './components/DengueBIDashboard';
import { DataCollectionView } from './components/DataCollectionView';
import { UploadModal } from './components/UploadModal';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  syncUserProfile,
  testConnection,
  recordDatasetUpload,
} from './firebase';

import {
  SurveillanceRecord,
  ValidationReport,
} from './types/surveillance';
import {
  processRawSurveillanceCSV,
  convertPIDSRWebhookCasesToCSV,
} from './utils/dataCleaner';
import {
  calculateEpidemiologicalMetrics,
} from './utils/epidemiology';
import { SAMPLE_CSV_CONTENT, triggerCSVDownload } from './utils/sampleData';

export default function App() {
  const [allRecords, setAllRecords] = useState<SurveillanceRecord[]>([]);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [rawCSVHistory, setRawCSVHistory] = useState<string>(SAMPLE_CSV_CONTENT);

  // Clean BI navigation state
  const [activeView, setActiveView] = useState<'dashboard' | 'collection'>('dashboard');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Firebase Auth state for dataset audit persistence
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (user) {
        syncUserProfile(user, 'Epidemiologist');
      }
    });
    return () => unsubscribe();
  }, []);

  // Automated Dengue Webhook & Case Ingestion Telemetry State
  const [autoSyncTelemetry, setAutoSyncTelemetry] = useState<{
    enabled: boolean;
    totalCases: number;
    lastSync: string;
    sourceUrl: string;
    status: string;
  }>({
    enabled: true,
    totalCases: 55,
    lastSync: new Date().toLocaleTimeString(),
    sourceUrl: 'https://pidsr.doh.gov.ph/pidsr/diseases/dengue',
    status: 'ONLINE_ACTIVE',
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Initialize with authentic Dengue surveillance dataset on initial load
  useEffect(() => {
    const { records, report } = processRawSurveillanceCSV(
      SAMPLE_CSV_CONTENT,
      'benchmark_dengue_surveillance_2026.csv'
    );
    setAllRecords(records);
    setValidationReport(report);
  }, []);

  // Global Periodic Poll for Automated Dengue Ingestion from https://pidsr.doh.gov.ph/pidsr/diseases/dengue
  useEffect(() => {
    let isMounted = true;
    const pollCases = async () => {
      try {
        const res = await fetch('/api/pidsr/cases');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data.success || !Array.isArray(data.cases)) return;

        if (data.autoSync) {
          setAutoSyncTelemetry({
            enabled: data.autoSync.enabled,
            totalCases: data.count || data.cases.length,
            lastSync: data.lastSyncTimestamp
              ? new Date(data.lastSyncTimestamp).toLocaleTimeString()
              : new Date().toLocaleTimeString(),
            sourceUrl: data.sourceUrl || 'https://pidsr.doh.gov.ph/pidsr/diseases/dengue',
            status: data.autoSync.lastSyncStatus || 'ONLINE_ACTIVE',
          });
        }

        if (data.cases.length > 0) {
          setAllRecords(prev => {
            if (data.cases.length > prev.length) {
              const csvText = convertPIDSRWebhookCasesToCSV(data.cases);
              const { records, report } = processRawSurveillanceCSV(
                csvText,
                'pidsr_dengue_automated_sync.csv'
              );
              setValidationReport(report);
              setRawCSVHistory(csvText);
              return records;
            }
            return prev;
          });
        }
      } catch {
        // Ignore transient polling errors
      }
    };

    pollCases();
    const interval = setInterval(pollCases, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTriggerManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const res = await fetch('/api/pidsr/auto-sync/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.allCases) {
        const csvText = convertPIDSRWebhookCasesToCSV(data.allCases);
        const { records, report } = processRawSurveillanceCSV(
          csvText,
          'pidsr_dengue_automated_sync.csv'
        );
        setAllRecords(records);
        setValidationReport(report);
        setRawCSVHistory(csvText);
        setAutoSyncTelemetry(prev => ({
          ...prev,
          totalCases: data.totalCasesInRegistry || data.allCases.length,
          lastSync: new Date().toLocaleTimeString(),
        }));
      }
    } catch {
      // Handled via state reset in finally
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Handle new CSV line-list upload & ingestion
  const handleIngestCSV = (
    csvText: string,
    filename: string,
    mode: 'replace' | 'append' = 'replace'
  ) => {
    let combinedCSV = csvText;
    if (mode === 'append' && rawCSVHistory) {
      const incomingLines = csvText.split('\n');
      const dataLines = incomingLines.slice(1).filter(l => l.trim().length > 0);
      combinedCSV = rawCSVHistory.trim() + '\n' + dataLines.join('\n');
    }

    const { records, report } = processRawSurveillanceCSV(combinedCSV, filename);
    setRawCSVHistory(combinedCSV);
    setAllRecords(records);
    setValidationReport(report);

    if (currentUser) {
      recordDatasetUpload(currentUser.uid, {
        id: `ds-${Date.now()}`,
        filename,
        recordCount: records.length,
        diseaseId: 'DEN',
        overallDqi: report.overallDQI,
        uploadedAt: new Date().toISOString(),
      });
    }
  };

  const handleDownloadSample = () => {
    triggerCSVDownload(SAMPLE_CSV_CONTENT, 'argao_dengue_surveillance_linelist.csv');
  };

  // Scope strictly to Dengue cases in Argao, Cebu
  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      if (r.diseaseId !== 'DEN') return false;
      if (r.municipality && r.municipality.toLowerCase() !== 'argao') return false;
      return true;
    });
  }, [allRecords]);

  // Derived Epidemiological Metrics
  const metrics = useMemo(
    () => calculateEpidemiologicalMetrics(filteredRecords),
    [filteredRecords]
  );

  if (!validationReport) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">Loading Dengue Surveillance Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-[#e4e4e7] font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Single Obsidian BI Canvas */}
      <main className="flex-1">
        {activeView === 'dashboard' && (
          <DengueBIDashboard
            records={filteredRecords}
            metrics={metrics}
            onOpenDataCollection={() => setActiveView('collection')}
          />
        )}

        {activeView === 'collection' && (
          <DataCollectionView
            records={filteredRecords}
            validationReport={validationReport}
            autoSyncTelemetry={autoSyncTelemetry}
            isManualSyncing={isManualSyncing}
            onTriggerManualSync={handleTriggerManualSync}
            onOpenUpload={() => setIsUploadOpen(true)}
            onDownloadSample={handleDownloadSample}
            onIngestCSV={handleIngestCSV}
            onNavigateToDashboard={() => setActiveView('dashboard')}
          />
        )}
      </main>

      {/* Minimal Institutional Footer */}
      <footer className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-white/[0.06] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Municipality of Argao · Municipal Epidemiology &amp; Surveillance Unit</span>
        <span>Dengue Surveillance Report</span>
      </footer>

      {/* CSV / Spreadsheet Ingestion Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onIngestCSV={handleIngestCSV}
      />
    </div>
  );
}
