import React from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { FilterState, SurveillanceRecord } from '../types/surveillance';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  allRecords: SurveillanceRecord[];
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  allRecords,
  onReset,
}) => {
  // Extract unique municipalities and barangays
  const municipalities = Array.from(new Set(allRecords.map(r => r.municipality).filter(Boolean))).sort();
  const barangays = Array.from(
    new Set(
      allRecords
        .filter(r => !filters.municipality || r.municipality === filters.municipality)
        .map(r => r.barangay)
        .filter(Boolean)
    )
  ).sort();

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Filters:</span>
        </div>

        {/* Municipality */}
        <select
          value={filters.municipality}
          onChange={e => setFilters(prev => ({ ...prev, municipality: e.target.value, barangay: '' }))}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Municipalities</option>
          {municipalities.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Barangay */}
        <select
          value={filters.barangay}
          onChange={e => setFilters(prev => ({ ...prev, barangay: e.target.value }))}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Barangays</option>
          {barangays.map(b => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Classification */}
        <select
          value={filters.caseClassification}
          onChange={e => setFilters(prev => ({ ...prev, caseClassification: e.target.value }))}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Classifications</option>
          <option value="Confirmed">Confirmed Only</option>
          <option value="Probable">Probable Only</option>
          <option value="Suspect">Suspect Only</option>
        </select>

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search EPI ID, patient age, barangay..."
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
