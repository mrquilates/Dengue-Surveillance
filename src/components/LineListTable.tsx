import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Calendar,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Tag,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SurveillanceRecord } from '../types/surveillance';
import { triggerCSVDownload } from '../utils/sampleData';

interface LineListTableProps {
  records: SurveillanceRecord[];
  selectedDisease: string;
  onFilteredRecordsChange?: (filtered: SurveillanceRecord[]) => void;
}

export const LineListTable: React.FC<LineListTableProps> = ({
  records,
  selectedDisease,
  onFilteredRecordsChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMW, setSelectedMW] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'morbidityWeek' | 'dateOnset' | 'age' | 'epiId'>('morbidityWeek');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Extract distinct Morbidity Week integers and counts
  const mwDistribution = useMemo(() => {
    const counts: Record<number, number> = {};
    records.forEach(r => {
      counts[r.morbidityWeek] = (counts[r.morbidityWeek] || 0) + 1;
    });
    const weeks = Object.keys(counts)
      .map(k => parseInt(k, 10))
      .sort((a, b) => a - b);

    return weeks.map(week => ({
      week,
      count: counts[week],
      pct: ((counts[week] / records.length) * 100).toFixed(1),
    }));
  }, [records]);

  const availableMWs = useMemo(() => {
    return mwDistribution.map(d => d.week);
  }, [mwDistribution]);

  const latestMW = availableMWs.length > 0 ? Math.max(...availableMWs) : 1;
  const earliestMW = availableMWs.length > 0 ? Math.min(...availableMWs) : 1;

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedMW !== 'ALL' && r.morbidityWeek !== parseInt(selectedMW, 10)) {
        return false;
      }
      if (selectedClassification !== 'ALL' && r.caseClassification !== selectedClassification) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.epiId.toLowerCase().includes(q) ||
          r.municipality.toLowerCase().includes(q) ||
          r.barangay.toLowerCase().includes(q) ||
          (r.clinicalClassification && r.clinicalClassification.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [records, selectedMW, selectedClassification, searchQuery]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === null || valA === undefined) valA = 0;
      if (valB === null || valB === undefined) valB = 0;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredRecords, sortField, sortOrder]);

  useEffect(() => {
    onFilteredRecordsChange?.(sortedRecords);
  }, [sortedRecords, onFilteredRecordsChange]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleToggleSort = (field: 'morbidityWeek' | 'dateOnset' | 'age' | 'epiId') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportLineListCSV = () => {
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
      'MW (Morbidity Week)', // Standard integer column
      'Consulted (Y/N)',
      'Admitted (Y/N)',
      'Case Classification',
      'Clinical Classification',
      'Outcome',
    ];

    const rows = sortedRecords.map(r => [
      r.diseaseId,
      r.epiId,
      r.age !== null ? r.age : '',
      r.sex,
      r.psgcMunicipality || '',
      `"${r.municipality}"`,
      r.psgcBarangay || '',
      `"${r.barangay}"`,
      r.dateOnset,
      r.morbidityWeek, // Explicit Morbidity Week integer
      r.consulted,
      r.admitted,
      r.caseClassification,
      `"${r.clinicalClassification}"`,
      r.outcome,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    triggerCSVDownload(
      csvContent,
      `surveillance_linelist_${selectedDisease}_MW${selectedMW !== 'ALL' ? selectedMW : 'ALL'}_${Date.now()}.csv`
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3">
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Case Line-List Registry
                </h3>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  · MW {earliestMW} – MW {latestMW}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verified de-identified dengue surveillance records
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Morbidity Week Integer Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-semibold text-[11px]">Filter MW:</span>
            <select
              value={selectedMW}
              onChange={e => {
                setSelectedMW(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Morbidity Weeks</option>
              {availableMWs.map(week => (
                <option key={week} value={week} className="bg-slate-900 text-white">
                  MW {week} ({records.filter(r => r.morbidityWeek === week).length} cases)
                </option>
              ))}
            </select>
          </div>

          {/* Classification Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
            <select
              value={selectedClassification}
              onChange={e => {
                setSelectedClassification(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Classifications</option>
              <option value="Confirmed" className="bg-slate-900 text-white">Confirmed</option>
              <option value="Probable" className="bg-slate-900 text-white">Probable</option>
              <option value="Suspect" className="bg-slate-900 text-white">Suspect</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search EPIID, Brgy..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={exportLineListCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm cursor-pointer"
            title="Download Line-List CSV with MW Integer Column"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Line-List</span>
          </button>
        </div>
      </div>

      {/* Morbidity Week Integer Distribution Chips */}
      <div className="px-5 py-1.5 flex items-center gap-2 overflow-x-auto text-xs font-mono">
        <span className="text-slate-400 text-[11px] font-semibold shrink-0 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>MW Integer Distribution:</span>
        </span>
        <button
          onClick={() => setSelectedMW('ALL')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors shrink-0 ${
            selectedMW === 'ALL'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All ({records.length})
        </button>
        {mwDistribution.map(item => (
          <button
            key={item.week}
            onClick={() => setSelectedMW(String(item.week))}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors shrink-0 flex items-center gap-1.5 border ${
              selectedMW === String(item.week)
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                : item.week === latestMW
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <span className="font-bold">MW {item.week}</span>
            <span className="text-[10px] opacity-80">({item.count} cases • {item.pct}%)</span>
            {item.week === latestMW && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500 text-white font-sans uppercase">
                Apex
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="px-5">
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono whitespace-nowrap">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th
                  onClick={() => handleToggleSort('morbidityWeek')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors bg-slate-950/80"
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-300 font-bold">Morbidity Week (MW)</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('epiId')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>EPIID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('dateOnset')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date of Onset</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('age')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Age / Sex</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Location (Barangay, City)</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Clinical Subtype</th>
                <th className="py-3 px-3 text-center">Admitted</th>
                <th className="py-3 px-3">Outcome</th>
                <th className="py-3 px-3 text-center">Data Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No surveillance records matching the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-900/80 transition-colors">
                    {/* Morbidity Week Integer Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                          r.morbidityWeek === latestMW
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                            : 'bg-slate-900 text-slate-200 border-slate-700'
                        }`}
                        title={`Morbidity Week Integer: ${r.morbidityWeek} (Epidemiological Year: ${r.morbidityYear})`}
                      >
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>MW {r.morbidityWeek}</span>
                        {r.morbidityWeek === latestMW && (
                          <span className="text-[9px] text-amber-400 font-sans font-normal">• Latest</span>
                        )}
                      </span>
                    </td>

                    {/* EPIID */}
                    <td className="py-2.5 px-3 font-bold text-white">
                      {r.epiId}
                    </td>

                    {/* Onset Date */}
                    <td className="py-2.5 px-3 text-cyan-300 font-medium">
                      {r.dateOnset}
                    </td>

                    {/* Age / Sex */}
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-white font-bold">{r.age !== null ? r.age : '?'} yrs</span>
                      <span className="text-slate-400 ml-1.5 font-normal">[{r.sex}]</span>
                    </td>

                    {/* Location */}
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className="text-white font-semibold">{r.barangay}</span>
                      <span className="text-slate-500 text-[10px] block font-sans">{r.municipality}</span>
                    </td>

                    {/* Case Classification */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          r.caseClassification === 'Confirmed'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : r.caseClassification === 'Probable'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {r.caseClassification}
                      </span>
                    </td>

                    {/* Clinical Subtype */}
                    <td className="py-2.5 px-3 text-slate-300 max-w-[140px] truncate" title={r.clinicalClassification}>
                      {r.clinicalClassification}
                    </td>

                    {/* Admitted Status */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold ${
                          r.admitted === 'Y' ? 'text-purple-400' : 'text-slate-500'
                        }`}
                      >
                        {r.admitted === 'Y' ? 'YES' : 'NO'}
                      </span>
                    </td>

                    {/* Outcome */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          r.outcome === 'Died'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : r.outcome === 'Recovered'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {r.outcome}
                      </span>
                    </td>

                    {/* Integrity Validation */}
                    <td className="py-2.5 px-3 text-center">
                      {r.isValid && !r.isDuplicate ? (
                        <span title="Certified Valid Record">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 inline" />
                        </span>
                      ) : (
                        <span title="Contains Data Anomaly">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="font-mono">
          Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * pageSize, sortedRecords.length)}</strong> of{' '}
          <strong>{sortedRecords.length}</strong> surveillance records (Morbidity Week Filter: {selectedMW === 'ALL' ? 'All Weeks' : `MW ${selectedMW}`})
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-semibold text-white px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
