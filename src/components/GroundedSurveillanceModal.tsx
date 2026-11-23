import React, { useState } from 'react';
import {
  MapPin,
  Globe,
  Search,
  Sparkles,
  RefreshCw,
  X,
  ExternalLink,
  ShieldAlert,
  Building2,
  Navigation,
} from 'lucide-react';

interface GroundedSurveillanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroundedSurveillanceModal: React.FC<GroundedSurveillanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'maps' | 'search'>('maps');
  const [mapsQuery, setMapsQuery] = useState(
    'Locate Isidro Kintanar Memorial Hospital and Argao Rural Health Units. What are their addresses and emergency access routes in Argao, Cebu?'
  );
  const [searchQuery, setSearchQuery] = useState(
    'DOH Region VII Central Visayas Dengue surveillance circular and circulating serotypes 2026'
  );

  const [mapsResponse, setMapsResponse] = useState<any>(null);
  const [searchResponse, setSearchResponse] = useState<any>(null);
  const [isLoadingMaps, setIsLoadingMaps] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  const handleQueryMaps = async () => {
    setIsLoadingMaps(true);
    try {
      const res = await fetch('/api/grounding/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mapsQuery }),
      });
      const data = await res.json();
      setMapsResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMaps(false);
    }
  };

  const handleQuerySearch = async () => {
    setIsLoadingSearch(true);
    try {
      const res = await fetch('/api/grounding/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Google Maps &amp; Search Grounding Center
                </h3>
                <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  gemini-3.8-flash Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live Google Maps facility geocoding and real-time Google Search public health surveillance wire
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 px-5 pt-3 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => {
              setActiveTab('maps');
              if (!mapsResponse) handleQueryMaps();
            }}
            className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'maps'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Google Maps Grounding (Hospitals &amp; Terrain)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('search');
              if (!searchResponse) handleQuerySearch();
            }}
            className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4 text-blue-400" />
            <span>Google Search Grounding (DOH Bulletins &amp; Climate)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'maps' ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Navigation className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={mapsQuery}
                    onChange={e => setMapsQuery(e.target.value)}
                    placeholder="Query Google Maps data for Argao health facilities..."
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
                <button
                  onClick={handleQueryMaps}
                  disabled={isLoadingMaps}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMaps ? 'animate-spin' : ''}`} />
                  <span>Execute Maps Grounding</span>
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">Quick queries:</span>
                {[
                  'Isidro Kintanar Memorial Hospital location & bed capacity',
                  'Argao RHU 1 and RHU 2 road distance',
                  'Nearest tertiary hospital from Argao (Carcar Provincial / VSMMC)',
                ].map(chip => (
                  <button
                    key={chip}
                    onClick={() => {
                      setMapsQuery(chip);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Response Panel */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px]">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Google Maps Grounding Output</span>
                  </span>
                  <span className="text-slate-500">{mapsResponse?.source || 'Grounded Gemini 3.8 Flash'}</span>
                </div>

                <div className="whitespace-pre-line leading-relaxed text-slate-300">
                  {mapsResponse?.text || (isLoadingMaps ? 'Querying Google Maps engine...' : 'Press "Execute Maps Grounding" to query real-time geographic data.')}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Query Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search DOH circulars, Dengue serotypes, PAGASA weather..."
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
                <button
                  onClick={handleQuerySearch}
                  disabled={isLoadingSearch}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSearch ? 'animate-spin' : ''}`} />
                  <span>Execute Search Grounding</span>
                </button>
              </div>

              {/* Quick Query Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">Quick queries:</span>
                {[
                  'DOH Central Visayas Dengue advisories 2026',
                  'Dengue serotype DENV-2 Cosmopolitan prevalence Philippines',
                  'PAGASA Southern Cebu rainfall outlook current month',
                ].map(chip => (
                  <button
                    key={chip}
                    onClick={() => {
                      setSearchQuery(chip);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Response Panel */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px]">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Google Search Grounded Surveillance Brief</span>
                  </span>
                  <span className="text-slate-500">{searchResponse?.source || 'Grounded Gemini 3.8 Flash'}</span>
                </div>

                <div className="whitespace-pre-line leading-relaxed text-slate-300">
                  {searchResponse?.text || (isLoadingSearch ? 'Querying Google Search grounding wire...' : 'Press "Execute Search Grounding" to retrieve up-to-date surveillance circulars.')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div>Grounding models: gemini-3.8-flash with googleMaps and googleSearch tools</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
