import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Flame,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  LocateFixed,
  Focus,
  RotateCcw,
  Users,
  Activity,
  CheckCircle2,
  Skull,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Calendar,
  Sliders,
  Sparkles,
  Clock,
  Eye,
  EyeOff,
  Palette,
  Filter,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  GeoMunicipalitySummary,
  GeoBarangaySummary,
  EpidemiologicalMetrics,
  SurveillanceRecord,
} from '../types/surveillance';

interface GeoSpatialAnalysisProps {
  municipalities: GeoMunicipalitySummary[];
  barangays: GeoBarangaySummary[];
  metrics?: EpidemiologicalMetrics;
  selectedMunicipality: string;
  selectedBarangay?: string;
  onSelectMunicipality: (muni: string) => void;
  onSelectBarangay: (brgy: string) => void;
  records?: SurveillanceRecord[];
}

// Coordinate anchors for realistic geographic cartography layout
const MUNI_COORDINATES: Record<string, { x: number; y: number; labelPos: { dx: number; dy: number } }> = {
  'Quezon City': { x: 380, y: 150, labelPos: { dx: 0, dy: -22 } },
  'Manila': { x: 260, y: 220, labelPos: { dx: -38, dy: 10 } },
  'Caloocan': { x: 310, y: 100, labelPos: { dx: -38, dy: -18 } },
  'Pasig': { x: 420, y: 240, labelPos: { dx: 38, dy: 5 } },
  'Taguig': { x: 390, y: 310, labelPos: { dx: 38, dy: 15 } },
  'Valenzuela': { x: 250, y: 120, labelPos: { dx: -38, dy: -12 } },
  'Marikina': { x: 460, y: 170, labelPos: { dx: 38, dy: -8 } },
  'Parañaque': { x: 300, y: 310, labelPos: { dx: -38, dy: 14 } },
  'Antipolo': { x: 520, y: 200, labelPos: { dx: 38, dy: -10 } },
  'Cainta': { x: 480, y: 220, labelPos: { dx: 38, dy: 8 } },
  'Argao': { x: 390, y: 280, labelPos: { dx: 38, dy: 14 } },
  'Cebu City': { x: 360, y: 220, labelPos: { dx: 0, dy: 18 } },
  'Davao City': { x: 380, y: 260, labelPos: { dx: 0, dy: 18 } },
  'Santa Rosa': { x: 370, y: 360, labelPos: { dx: -38, dy: 10 } },
  'Calamba': { x: 430, y: 400, labelPos: { dx: 38, dy: 15 } },
  'San Pedro': { x: 330, y: 340, labelPos: { dx: -38, dy: 0 } },
};

// Relative spatial offsets for barangays within municipalities
const BARANGAY_OFFSETS: Record<string, { dx: number; dy: number }> = {
  // Quezon City
  'Batasan Hills': { dx: -28, dy: -24 },
  'Commonwealth': { dx: 26, dy: -18 },
  'Payatas': { dx: 32, dy: 18 },
  'Holy Spirit': { dx: -24, dy: 24 },
  'Fairview': { dx: 2, dy: -42 },
  // Manila
  'Tondo 1': { dx: -28, dy: -16 },
  'Sampaloc': { dx: 20, dy: -12 },
  'Paco': { dx: 14, dy: 22 },
  'Malate': { dx: -18, dy: 26 },
  // Pasig
  'Pinagbuhatan': { dx: 24, dy: 18 },
  'Ugong': { dx: -18, dy: -22 },
  'Rosario': { dx: -24, dy: 12 },
  // Caloocan
  'Bagong Silang': { dx: 20, dy: -24 },
  'Camarin': { dx: -22, dy: 12 },
  'Deparo': { dx: 22, dy: 22 },
  // Taguig
  'Lower Bicutan': { dx: 20, dy: 18 },
  'Western Bicutan': { dx: -20, dy: 12 },
  'Signal Village': { dx: 0, dy: -24 },
  'Fort Bonifacio': { dx: -22, dy: -16 },
  // Marikina
  'Concepcion Uno': { dx: -18, dy: -18 },
  'Malanday': { dx: 18, dy: 16 },
  'Sto. Niño': { dx: -14, dy: 20 },
  'Barangka': { dx: 22, dy: -14 },
  // Valenzuela
  'Gen. T. de Leon': { dx: 20, dy: -18 },
  'Marulas': { dx: -18, dy: 16 },
  'Karuhatan': { dx: 18, dy: 18 },
  // Parañaque
  'San Dionisio': { dx: -20, dy: 16 },
  'Moonwalk': { dx: 20, dy: -16 },
  'BF Homes': { dx: 0, dy: 24 },
  // Antipolo
  'Dela Paz': { dx: -18, dy: 16 },
  'Mayamot': { dx: -22, dy: -20 },
  'Cupang': { dx: 24, dy: 12 },
  // Calamba
  'Pansol': { dx: -18, dy: 16 },
  'Bucal': { dx: 20, dy: -16 },
  'Canlubang': { dx: -22, dy: -18 },
  'Real': { dx: 18, dy: 18 },
  // Santa Rosa
  'Balibago': { dx: -18, dy: -16 },
  'Dila': { dx: 20, dy: 16 },
  'Tagapo': { dx: -20, dy: 18 },
  'Don Jose': { dx: 22, dy: -18 },
  // San Pedro
  'San Vicente': { dx: -18, dy: -16 },
  'Cuyab': { dx: 20, dy: 16 },
  'Landayan': { dx: 0, dy: 22 },
  // Cainta
  'San Andres': { dx: -18, dy: 16 },
  'San Juan': { dx: 20, dy: -16 },
  // Argao, Cebu (High-fidelity coordinates for Argao barangays)
  'Poblacion': { dx: 0, dy: 0 },
  'Balisong': { dx: 14, dy: 16 },
  'Taloot': { dx: 42, dy: 45 },
  'Bogo': { dx: -35, dy: -28 },
  'Bulasa': { dx: 48, dy: -32 },
  'Talaga': { dx: 32, dy: 24 },
  'Canbanua': { dx: 18, dy: -14 },
  'Lamacan': { dx: -32, dy: -12 },
  'Langtad': { dx: 38, dy: -22 },
  'Casay': { dx: 36, dy: 34 },
  'Colawin': { dx: -45, dy: 12 },
  'Alambijud': { dx: -38, dy: -38 },
  'Ubaub': { dx: -48, dy: -22 },
  'Binlod': { dx: 42, dy: -14 },
  'Tulic': { dx: 24, dy: -6 },
  'Panadtaran': { dx: -22, dy: 20 },
  'Jampang': { dx: -44, dy: -6 },
  'Mabasa': { dx: -28, dy: 34 },
  'Mandilikit': { dx: -16, dy: 38 },
  'Sumaguan': { dx: -55, dy: 2 },
  'Linut-od': { dx: -60, dy: -16 },
  'Butong': { dx: -50, dy: -32 },
  'Catang': { dx: -34, dy: -44 },
  'Concepcion': { dx: -18, dy: -38 },
  'Cansuje': { dx: -38, dy: 28 },
  'Anajao': { dx: -44, dy: 16 },
  'Apo': { dx: -55, dy: 22 },
  'Calagasan': { dx: -65, dy: 6 },
  'Capio-an': { dx: -58, dy: 28 },
  'Guiwanon': { dx: 28, dy: -12 },
  'Gutlang': { dx: -22, dy: -28 },
  'Jaguimit': { dx: -38, dy: -16 },
  'Lapay': { dx: -55, dy: -28 },
  'Lengigon': { dx: -28, dy: -20 },
  'Montañeza': { dx: -64, dy: -12 },
  'Panas': { dx: -44, dy: 38 },
  'Sua': { dx: -48, dy: 34 },
  'Tabunok': { dx: -60, dy: -6 },
  'Tiguib': { dx: -28, dy: 22 },
  'Tulang': { dx: -38, dy: 6 },
};

export const GeoSpatialAnalysis: React.FC<GeoSpatialAnalysisProps> = ({
  municipalities,
  barangays,
  metrics,
  selectedMunicipality,
  selectedBarangay,
  onSelectMunicipality,
  onSelectBarangay,
  records,
}) => {
  const [activeTab, setActiveTab] = useState<'municipalities' | 'barangays'>('municipalities');
  const [hoveredMuni, setHoveredMuni] = useState<GeoMunicipalitySummary | null>(null);
  const [hoveredBrgy, setHoveredBrgy] = useState<GeoBarangaySummary | null>(null);
  const [autoZoomEnabled, setAutoZoomEnabled] = useState(true);

  // Interactive Heat Map Layer State
  const [heatMapActive, setHeatMapActive] = useState<boolean>(true);
  const [heatMapMode, setHeatMapMode] = useState<'hybrid' | 'heatOnly' | 'choropleth'>('hybrid');
  const [heatMapMetric, setHeatMapMetric] = useState<'cases' | 'incidence' | 'hotspotsOnly'>('cases');
  const [heatRadius, setHeatRadius] = useState<number>(26);
  const [heatOpacity, setHeatOpacity] = useState<number>(0.85);
  const [heatPalette, setHeatPalette] = useState<'thermal' | 'biohazard' | 'spectral'>('thermal');
  const [minCasesFilter, setMinCasesFilter] = useState<number>(1);
  const [showClusterEpicenters, setShowClusterEpicenters] = useState<boolean>(true);
  const [showClusterLabels, setShowClusterLabels] = useState<boolean>(true);
  const [showHeatSettings, setShowHeatSettings] = useState<boolean>(false);
  const [hoveredClusterPoint, setHoveredClusterPoint] = useState<(GeoBarangaySummary & {
    x: number;
    y: number;
    rank: number;
    densityTier: 'hyper' | 'high' | 'moderate' | 'low' | 'zero';
    weight: number;
  }) | null>(null);

  // Distinct Morbidity Weeks present in surveillance dataset
  const distinctMWs = useMemo(() => {
    if (!records || records.length === 0) return [28, 29, 30, 31, 32, 33, 34];
    const set = new Set<number>();
    records.forEach(r => {
      if (r.morbidityWeek && r.morbidityWeek >= 1 && r.morbidityWeek <= 53) {
        set.add(r.morbidityWeek);
      }
    });
    const arr = Array.from(set).sort((a, b) => a - b);
    return arr.length > 0 ? arr : [28, 29, 30, 31, 32, 33, 34];
  }, [records]);

  const minMW = distinctMWs[0] ?? 28;
  const maxMW = distinctMWs[distinctMWs.length - 1] ?? 34;

  const [selectedStartMW, setSelectedStartMW] = useState<number>(minMW);
  const [selectedEndMW, setSelectedEndMW] = useState<number>(maxMW);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentReplayIndex, setCurrentReplayIndex] = useState<number>(0);

  // Synchronize when dataset updates
  useEffect(() => {
    if (distinctMWs.length > 0) {
      setSelectedStartMW(distinctMWs[0]);
      setSelectedEndMW(distinctMWs[distinctMWs.length - 1]);
    }
  }, [distinctMWs]);

  // Replay Animation Loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentReplayIndex(prevIdx => {
        return (prevIdx + 1) % distinctMWs.length;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, distinctMWs.length]);

  const activeReplayMW = isPlaying ? distinctMWs[currentReplayIndex] : null;

  // Case counts by Morbidity Week for mini histogram
  const mwCaseCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    distinctMWs.forEach(w => {
      counts[w] = 0;
    });
    if (records) {
      records.forEach(r => {
        if (!r.isDuplicate && counts[r.morbidityWeek] !== undefined) {
          counts[r.morbidityWeek]++;
        }
      });
    }
    const maxCount = Math.max(...Object.values(counts), 1);
    return { counts, maxCount };
  }, [records, distinctMWs]);

  // Sliced surveillance records based on active temporal window
  const effectiveRecords = useMemo(() => {
    if (!records || records.length === 0) return null;
    const activeStart = activeReplayMW !== null ? activeReplayMW : selectedStartMW;
    const activeEnd = activeReplayMW !== null ? activeReplayMW : selectedEndMW;

    return records.filter(r => {
      if (r.isDuplicate) return false;
      const week = r.morbidityWeek;
      if (week < activeStart || week > activeEnd) return false;
      if (startDate && r.dateOnset < startDate) return false;
      if (endDate && r.dateOnset > endDate) return false;
      return true;
    });
  }, [records, activeReplayMW, selectedStartMW, selectedEndMW, startDate, endDate]);

  // Dynamically recomputed barangay metrics
  const effectiveBarangays = useMemo(() => {
    if (!effectiveRecords) return barangays;
    const countMap = new Map<string, number>();
    const deathMap = new Map<string, number>();

    effectiveRecords.forEach(r => {
      const b = r.barangay;
      countMap.set(b, (countMap.get(b) || 0) + 1);
      if (r.outcome === 'Died') {
        deathMap.set(b, (deathMap.get(b) || 0) + 1);
      }
    });

    return barangays.map(orig => {
      const cases = countMap.get(orig.name) || 0;
      const deaths = deathMap.get(orig.name) || 0;
      const population = orig.population || 2500;
      const incidencePer100k = Math.round((cases / population) * 100000);
      let hotspotType: GeoBarangaySummary['hotspotType'] = 'Controlled';
      if (cases >= 8) hotspotType = 'Persistent';
      else if (cases >= 3) hotspotType = 'Emerging';
      else if (cases > 0) hotspotType = 'Sporadic';

      return {
        ...orig,
        cases,
        deaths,
        incidencePer100k,
        hotspotType,
        isHotspot: cases >= 3,
      };
    });
  }, [effectiveRecords, barangays]);

  // Dynamically recomputed municipal metrics
  const effectiveMunicipalities = useMemo(() => {
    if (!effectiveRecords) return municipalities;
    const countMap = new Map<string, number>();
    const deathMap = new Map<string, number>();

    effectiveRecords.forEach(r => {
      const m = r.municipality;
      countMap.set(m, (countMap.get(m) || 0) + 1);
      if (r.outcome === 'Died') {
        deathMap.set(m, (deathMap.get(m) || 0) + 1);
      }
    });

    return municipalities.map(orig => {
      const cases = countMap.get(orig.name) || 0;
      const deaths = deathMap.get(orig.name) || 0;
      const population = orig.population || 78000;
      const incidencePer100k = Math.round((cases / population) * 100000);
      let status: 'Epidemic' | 'Alert' | 'Normal' = 'Normal';
      if (cases >= 30) status = 'Epidemic';
      else if (cases >= 10) status = 'Alert';

      return {
        ...orig,
        cases,
        deaths,
        incidencePer100k,
        status,
      };
    });
  }, [effectiveRecords, municipalities]);

  // Case Status counts (Total, Active, Recovered, Died)
  const totalCasesCount = effectiveRecords ? effectiveRecords.length : (metrics?.totalCases ?? municipalities.reduce((acc, m) => acc + m.cases, 0));
  const diedCasesCount = effectiveRecords ? effectiveRecords.filter(r => r.outcome === 'Died').length : (metrics?.deaths ?? municipalities.reduce((acc, m) => acc + m.deaths, 0));
  const recoveredCasesCount = effectiveRecords ? effectiveRecords.filter(r => r.outcome === 'Recovered' || r.outcome === 'Alive').length : (metrics?.recoveries ?? Math.max(0, totalCasesCount - diedCasesCount));
  const activeCasesCount = Math.max(0, totalCasesCount - diedCasesCount - recoveredCasesCount);

  // Default Full Catchment Center and Dimensions
  const defaultBounds = {
    minX: 150,
    minY: 50,
    width: 450,
    height: 400,
    zoom: 1.0,
  };

  // Dynamic ViewBox State for Zoom to Area
  const [viewBox, setViewBox] = useState(defaultBounds);

  // AUTOMATIC ZOOM TO AREA LOGIC
  // When selectedMunicipality or selectedBarangay changes in filter state,
  // re-center and zoom the map to that geographic polygon/cluster
  useEffect(() => {
    if (!autoZoomEnabled) return;

    if (!selectedMunicipality) {
      // Reset to whole catchment overview
      setViewBox(defaultBounds);
      return;
    }

    const muniCoords = MUNI_COORDINATES[selectedMunicipality] || { x: 360, y: 220 };

    if (selectedBarangay) {
      // Zoom high-magnification into specific barangay
      const bOffset = BARANGAY_OFFSETS[selectedBarangay] || { dx: 0, dy: 0 };
      const targetX = muniCoords.x + bOffset.dx;
      const targetY = muniCoords.y + bOffset.dy;

      const targetZoom = 2.4;
      const w = 450 / targetZoom;
      const h = 400 / targetZoom;

      setViewBox({
        minX: targetX - w / 2,
        minY: targetY - h / 2,
        width: w,
        height: h,
        zoom: targetZoom,
      });
    } else {
      // Zoom into municipality cluster
      const targetZoom = 1.8;
      const w = 450 / targetZoom;
      const h = 400 / targetZoom;

      setViewBox({
        minX: muniCoords.x - w / 2,
        minY: muniCoords.y - h / 2,
        width: w,
        height: h,
        zoom: targetZoom,
      });
    }
  }, [selectedMunicipality, selectedBarangay, autoZoomEnabled]);

  // Top rankings (dynamically synchronized with temporal window)
  const top10Barangays = useMemo(() => {
    return [...effectiveBarangays].sort((a, b) => b.cases - a.cases).slice(0, 10);
  }, [effectiveBarangays]);

  // Barangays in the selected municipality for sub-cluster plotting
  const activeMunicipalityBarangays = useMemo(() => {
    if (!selectedMunicipality) return [];
    return effectiveBarangays.filter(
      b => b.municipality.toLowerCase() === selectedMunicipality.toLowerCase()
    );
  }, [effectiveBarangays, selectedMunicipality]);

  const maxCasesMuni = Math.max(...effectiveMunicipalities.map(m => m.cases), 1);

  // Geographic anchor lookup for barangays
  const getBarangayCoords = (b: GeoBarangaySummary) => {
    const mCoords = MUNI_COORDINATES[b.municipality] || { x: 360, y: 220, labelPos: { dx: 0, dy: 15 } };
    const specificOffset = BARANGAY_OFFSETS[b.name];
    if (specificOffset) {
      return { x: mCoords.x + specificOffset.dx, y: mCoords.y + specificOffset.dy };
    }
    // Algorithmic deterministic spatial offset based on string hash
    let hash = 0;
    for (let i = 0; i < b.name.length; i++) {
      hash = (hash << 5) - hash + b.name.charCodeAt(i);
      hash |= 0;
    }
    const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
    const dist = 14 + (Math.abs(hash >> 3) % 26);
    return {
      x: mCoords.x + Math.cos(angle) * dist,
      y: mCoords.y + Math.sin(angle) * dist,
    };
  };

  // Maximum barangay case count in the active surveillance window
  const maxBrgyCases = useMemo(() => {
    return Math.max(...effectiveBarangays.map(b => b.cases), 1);
  }, [effectiveBarangays]);

  // Compute normalized heat points for all barangays based on case count by barangay
  const allHeatPoints = useMemo(() => {
    const sorted = [...effectiveBarangays].sort((a, b) => b.cases - a.cases);
    return sorted.map((b, idx) => {
      const coords = getBarangayCoords(b);
      const weight = heatMapMetric === 'incidence'
        ? Math.min(1, b.incidencePer100k / 150)
        : (b.cases / maxBrgyCases);

      let densityTier: 'hyper' | 'high' | 'moderate' | 'low' | 'zero' = 'zero';
      if (b.cases >= 15) densityTier = 'hyper';
      else if (b.cases >= 8) densityTier = 'high';
      else if (b.cases >= 3) densityTier = 'moderate';
      else if (b.cases > 0) densityTier = 'low';

      return {
        ...b,
        x: coords.x,
        y: coords.y,
        weight,
        rank: idx + 1,
        densityTier,
      };
    });
  }, [effectiveBarangays, maxBrgyCases, heatMapMetric]);

  // Filtered heat points for map display
  const activeHeatPoints = useMemo(() => {
    return allHeatPoints.filter(p => {
      if (p.cases < minCasesFilter) return false;
      if (heatMapMetric === 'hotspotsOnly' && p.cases < 3) return false;
      return true;
    });
  }, [allHeatPoints, minCasesFilter, heatMapMetric]);

  // Top high-density clusters across barangays
  const topHighDensityClusters = useMemo(() => {
    return allHeatPoints.filter(p => p.cases >= 3).slice(0, 7);
  }, [allHeatPoints]);

  const highDensityClustersCount = useMemo(() => {
    return allHeatPoints.filter(p => p.cases >= 3).length;
  }, [allHeatPoints]);

  // Temporal Replay and Filter Helpers
  const handleStepMW = (delta: number) => {
    if (isPlaying) setIsPlaying(false);
    const curr = selectedStartMW;
    const currIdx = distinctMWs.indexOf(curr);
    if (currIdx === -1) return;
    const nextIdx = Math.max(0, Math.min(distinctMWs.length - 1, currIdx + delta));
    const nextMW = distinctMWs[nextIdx];
    setSelectedStartMW(nextMW);
    setSelectedEndMW(nextMW);
  };

  const handleResetMWFilter = () => {
    if (isPlaying) setIsPlaying(false);
    setSelectedStartMW(minMW);
    setSelectedEndMW(maxMW);
    setStartDate('');
    setEndDate('');
  };

  // Manual Zoom controls
  const handleManualZoom = (delta: number) => {
    setViewBox(prev => {
      const newZoom = Math.max(0.8, Math.min(3.0, prev.zoom + delta));
      const w = 450 / newZoom;
      const h = 400 / newZoom;
      const centerX = prev.minX + prev.width / 2;
      const centerY = prev.minY + prev.height / 2;
      return {
        minX: centerX - w / 2,
        minY: centerY - h / 2,
        width: w,
        height: h,
        zoom: newZoom,
      };
    });
  };

  const handleResetView = () => {
    setViewBox(defaultBounds);
    onSelectMunicipality('');
    onSelectBarangay('');
  };

  const handleRecenterOnSelected = () => {
    if (!selectedMunicipality) {
      handleResetView();
      return;
    }
    const muniCoords = MUNI_COORDINATES[selectedMunicipality] || { x: 360, y: 220 };
    const bOffset = selectedBarangay ? (BARANGAY_OFFSETS[selectedBarangay] || { dx: 0, dy: 0 }) : { dx: 0, dy: 0 };
    const targetX = muniCoords.x + bOffset.dx;
    const targetY = muniCoords.y + bOffset.dy;
    const targetZoom = selectedBarangay ? 2.4 : 1.8;
    const w = 450 / targetZoom;
    const h = 400 / targetZoom;

    setViewBox({
      minX: targetX - w / 2,
      minY: targetY - h / 2,
      width: w,
      height: h,
      zoom: targetZoom,
    });
  };

  const isZoomedIn = selectedMunicipality !== '' || viewBox.zoom > 1.05;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      {/* Header & Spatial Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Spatial Surveillance & Hotspot Clustering
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              GIS Intelligence
            </span>
          </div>

          {/* Drill-down Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
            <button
              onClick={handleResetView}
              className="hover:text-cyan-400 transition-colors"
            >
              Philippines
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <button
              onClick={handleResetView}
              className="hover:text-cyan-400 transition-colors"
            >
              {selectedMunicipality === 'Argao' || selectedMunicipality === 'Cebu City'
                ? 'Central Visayas (Region VII) / Cebu'
                : 'NCR & Regional Catchment'}
            </button>
            {selectedMunicipality && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <button
                  onClick={() => onSelectBarangay('')}
                  className="text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800 hover:bg-cyan-900"
                >
                  {selectedMunicipality}
                </button>
              </>
            )}
            {selectedBarangay && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                  {selectedBarangay}
                </span>
              </>
            )}
            {isZoomedIn && (
              <button
                onClick={handleResetView}
                className="text-[10px] text-slate-500 hover:text-rose-400 ml-1.5 font-sans"
              >
                (Reset View)
              </button>
            )}
          </div>
        </div>

        {/* View Toggle & Auto-Zoom Control */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Zoom to Area Toggle Button */}
          <button
            onClick={() => setAutoZoomEnabled(!autoZoomEnabled)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border font-mono transition-colors ${
              autoZoomEnabled
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Automatically re-center and zoom map when a municipality or barangay is selected from filters"
          >
            <Focus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Auto-Zoom: {autoZoomEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Table View Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('municipalities')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'municipalities'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Municipalities ({effectiveMunicipalities.length})
            </button>
            <button
              onClick={() => setActiveTab('barangays')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'barangays'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Barangays ({effectiveBarangays.length})
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Morbidity Week (MW) Range Slider & Date-Picker Control Bar */}
      <div className="mb-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Morbidity Week (MW) Replay Engine &amp; Temporal Filter
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                  {isPlaying ? 'REPLAYING WAVE' : 'INTERACTIVE SLIDER'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Filter spatial cluster dispersion across Argao barangays week-by-week or replay the epidemic transmission wave.
              </p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleStepMW(-1)}
              disabled={isPlaying}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer transition-colors"
              title="Step Previous Week"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Replay Progression</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleStepMW(1)}
              disabled={isPlaying}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer transition-colors"
              title="Step Next Week"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetMWFilter}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              All Weeks
            </button>
          </div>
        </div>

        {/* MW Histogram Track & Range Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Active Morbidity Week:{' '}
                <strong className="text-amber-300 font-bold">
                  MW {isPlaying ? distinctMWs[currentReplayIndex] : selectedStartMW}
                </strong>{' '}
                {selectedStartMW !== selectedEndMW && !isPlaying ? (
                  <>
                    to <strong className="text-amber-300 font-bold">MW {selectedEndMW}</strong>
                  </>
                ) : null}
              </span>
            </span>
            <span className="text-cyan-400 font-semibold">
              {totalCasesCount} Cases in Window ({distinctMWs.length} surveillance weeks)
            </span>
          </div>

          {/* Mini-Histogram Bars above Track */}
          <div className="grid grid-cols-7 sm:grid-cols-7 gap-1.5 h-10 items-end px-2 bg-slate-900/60 rounded-lg py-1 border border-slate-800/60">
            {distinctMWs.map(w => {
              const count = mwCaseCounts.counts[w] || 0;
              const heightPct = Math.max(12, Math.round((count / mwCaseCounts.maxCount) * 100));
              const isSelected = isPlaying
                ? distinctMWs[currentReplayIndex] === w
                : w >= selectedStartMW && w <= selectedEndMW;

              return (
                <div
                  key={w}
                  onClick={() => {
                    if (isPlaying) setIsPlaying(false);
                    setSelectedStartMW(w);
                    setSelectedEndMW(w);
                  }}
                  className={`flex flex-col items-center justify-end h-full cursor-pointer group transition-all`}
                  title={`MW ${w}: ${count} cases`}
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      isSelected
                        ? 'bg-amber-400 group-hover:bg-amber-300 shadow-md shadow-amber-500/30'
                        : 'bg-slate-700/80 group-hover:bg-slate-600'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-mono mt-0.5 ${
                      isSelected ? 'text-amber-300 font-bold' : 'text-slate-500'
                    }`}
                  >
                    W{w}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dual range slider controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 shrink-0">Start Week:</span>
              <input
                type="range"
                min={minMW}
                max={maxMW}
                value={selectedStartMW}
                disabled={isPlaying}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setSelectedStartMW(val);
                  if (val > selectedEndMW) setSelectedEndMW(val);
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-amber-300 w-8">W{selectedStartMW}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 shrink-0">End Week:</span>
              <input
                type="range"
                min={minMW}
                max={maxMW}
                value={selectedEndMW}
                disabled={isPlaying}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setSelectedEndMW(val);
                  if (val < selectedStartMW) setSelectedStartMW(val);
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-amber-300 w-8">W{selectedEndMW}</span>
            </div>
          </div>
        </div>

        {/* Date-Picker Range Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Calendar Date Range:</span>
            </span>

            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-[11px] text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-[11px] text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900 cursor-pointer transition-colors"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Quick Filter:</span>
            <button
              onClick={() => {
                if (isPlaying) setIsPlaying(false);
                setSelectedStartMW(33);
                setSelectedEndMW(34);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Surge Apex (MW 33–34)
            </button>
            <button
              onClick={() => {
                if (isPlaying) setIsPlaying(false);
                setSelectedStartMW(minMW);
                setSelectedEndMW(30);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Early Wave (MW {minMW}–30)
            </button>
          </div>
        </div>
      </div>

      {/* Surveillance Case Status Strip: Total Cases, Active Cases, Recovered Cases, Died */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2.5 px-3 py-1 border-r border-slate-800/80">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Total Cases</span>
            <span className="font-extrabold text-white text-sm sm:text-base font-mono">{totalCasesCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1 border-r border-slate-800/80">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Active Cases</span>
            <span className="font-extrabold text-amber-400 text-sm sm:text-base font-mono">{activeCasesCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1 border-r border-slate-800/80">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Recovered Cases</span>
            <span className="font-extrabold text-emerald-400 text-sm sm:text-base font-mono">{recoveredCasesCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <Skull className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Died</span>
            <span className="font-extrabold text-rose-400 text-sm sm:text-base font-mono">{diedCasesCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Interactive Tactical SVG Map (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/80 rounded-xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-[11px] text-slate-300">
                {selectedBarangay
                  ? `FOCUS: ${selectedBarangay.toUpperCase()} (${selectedMunicipality.toUpperCase()})`
                  : selectedMunicipality
                  ? `FOCUS: ${selectedMunicipality.toUpperCase()} (${viewBox.zoom.toFixed(1)}x ZOOM)`
                  : 'EPIDEMIOLOGICAL RISK CHOROPLETH (FULL CATCHMENT)'}
              </span>
            </div>

            {/* Map Controls */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {/* Recenter button */}
              <button
                onClick={handleRecenterOnSelected}
                className="hover:text-cyan-400 p-0.5 text-slate-400"
                title="Recenter on Selected Area"
              >
                <LocateFixed className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleManualZoom(0.25)}
                className="hover:text-cyan-400 p-0.5 text-slate-400"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleManualZoom(-0.25)}
                className="hover:text-cyan-400 p-0.5 text-slate-400"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="hover:text-cyan-400 p-0.5 text-slate-400"
                title="Reset to Full Overview"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Heat Map Layer Controls Toolbar */}
          <div className="mb-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              {/* Primary Heat Map Toggle */}
              <button
                onClick={() => setHeatMapActive(!heatMapActive)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                  heatMapActive
                    ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Toggle interactive density heat map layer"
              >
                <Flame className={`w-3.5 h-3.5 ${heatMapActive ? 'text-rose-400 fill-rose-500/40 animate-pulse' : 'text-slate-400'}`} />
                <span>Heat Map Layer:</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${heatMapActive ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {heatMapActive ? 'ACTIVE' : 'OFF'}
                </span>
              </button>

              {/* Display Mode Pill */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => {
                    setHeatMapActive(true);
                    setHeatMapMode('hybrid');
                  }}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    heatMapMode === 'hybrid' && heatMapActive
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Show both thermal heat map and centroid markers"
                >
                  Hybrid
                </button>
                <button
                  onClick={() => {
                    setHeatMapActive(true);
                    setHeatMapMode('heatOnly');
                  }}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    heatMapMode === 'heatOnly' && heatMapActive
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Heat map density field only (dimmed centroid nodes)"
                >
                  Heat Only
                </button>
                <button
                  onClick={() => setHeatMapMode('choropleth')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    heatMapMode === 'choropleth' || !heatMapActive
                      ? 'bg-slate-800 text-slate-200 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Classic centroid markers only"
                >
                  Nodes
                </button>
              </div>

              {/* Weight Metric Selector */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500 hidden sm:inline">Weight:</span>
                <button
                  onClick={() =>
                    setHeatMapMetric(m =>
                      m === 'cases' ? 'incidence' : m === 'incidence' ? 'hotspotsOnly' : 'cases'
                    )
                  }
                  className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Toggle weighting metric for heat map calculation"
                >
                  <Layers className="w-3 h-3 text-amber-400" />
                  <span>
                    {heatMapMetric === 'cases'
                      ? 'Case Count by Barangay'
                      : heatMapMetric === 'incidence'
                      ? 'Attack Rate / 100k'
                      : 'Persistent Hotspots'}
                  </span>
                </button>
              </div>
            </div>

            {/* Tuning Drawer Toggle & Cluster Count Badge */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                <span>{highDensityClustersCount} Active Clusters</span>
              </span>

              <button
                onClick={() => setShowHeatSettings(!showHeatSettings)}
                className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                  showHeatSettings
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Fine-tune heat map bandwidth, opacity, threshold, and palette"
              >
                <Sliders className="w-3 h-3" />
                <span className="text-[11px]">Tuning</span>
                {showHeatSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Fine-Tuning Drawer */}
          {showHeatSettings && (
            <div className="mb-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Kernel Radius Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Kernel Bandwidth:</span>
                    <strong className="text-amber-300">{heatRadius}px</strong>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={48}
                    value={heatRadius}
                    onChange={e => setHeatRadius(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Layer Opacity Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Layer Opacity:</span>
                    <strong className="text-cyan-300">{Math.round(heatOpacity * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={Math.round(heatOpacity * 100)}
                    onChange={e => setHeatOpacity(parseInt(e.target.value, 10) / 100)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Min Cases Filter Threshold */}
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400">Min Case Filter:</div>
                  <div className="flex items-center gap-1">
                    {[1, 3, 5, 8].map(threshold => (
                      <button
                        key={threshold}
                        onClick={() => setMinCasesFilter(threshold)}
                        className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors ${
                          minCasesFilter === threshold
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        ≥{threshold}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette Selector */}
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400">Palette:</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHeatPalette('thermal')}
                      className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                        heatPalette === 'thermal'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Thermal
                    </button>
                    <button
                      onClick={() => setHeatPalette('biohazard')}
                      className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                        heatPalette === 'biohazard'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Biohazard
                    </button>
                    <button
                      onClick={() => setHeatPalette('spectral')}
                      className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                        heatPalette === 'spectral'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Spectral
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Layer Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showClusterEpicenters}
                      onChange={e => setShowClusterEpicenters(e.target.checked)}
                      className="accent-rose-500 cursor-pointer"
                    />
                    <span>Highlight Epicenter Nodes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showClusterLabels}
                      onChange={e => setShowClusterLabels(e.target.checked)}
                      className="accent-cyan-500 cursor-pointer"
                    />
                    <span>Display Case Badges</span>
                  </label>
                </div>
                <span className="text-slate-500 text-[10px]">
                  Visualizing high-density clusters dynamically weighted by case count by barangay
                </span>
              </div>
            </div>
          )}

          {/* High-Density Clusters Quick Navigation Strip */}
          {heatMapActive && topHighDensityClusters.length > 0 && (
            <div className="mb-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none">
              <span className="text-rose-400 font-bold shrink-0 flex items-center gap-1 pr-1 border-r border-slate-800">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Clusters (by Cases):</span>
                <span className="sm:hidden">Clusters:</span>
              </span>
              {topHighDensityClusters.map(p => {
                const isSelected =
                  selectedBarangay?.toLowerCase() === p.name.toLowerCase() &&
                  selectedMunicipality?.toLowerCase() === p.municipality.toLowerCase();

                return (
                  <button
                    key={`cluster-chip-${p.municipality}-${p.name}`}
                    onClick={() => {
                      onSelectMunicipality(p.municipality);
                      onSelectBarangay(isSelected ? '' : p.name);
                    }}
                    className={`shrink-0 px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-400 font-bold shadow-sm shadow-rose-500/30'
                        : p.cases >= 15
                        ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-200 border-rose-800/80 font-bold'
                        : p.cases >= 8
                        ? 'bg-amber-950/60 hover:bg-amber-900 text-amber-200 border-amber-800/80'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title={`${p.name} (${p.municipality}): ${p.cases} cases — Click to focus`}
                  >
                    <span>{p.name}</span>
                    <span className="font-extrabold text-cyan-300 font-mono">({p.cases})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Area Banner when Zoomed */}
          {selectedMunicipality && (
            <div className="mb-2 p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-between text-xs font-mono animate-in fade-in">
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="text-cyan-300">
                  Target Centered: <strong>{selectedMunicipality}</strong>
                  {selectedBarangay && <span> › <strong>{selectedBarangay}</strong></span>}
                </span>
              </div>
              <button
                onClick={handleResetView}
                className="text-[10px] text-cyan-400 hover:text-white underline flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset View</span>
              </button>
            </div>
          )}

          <div className="relative w-full h-80 sm:h-96 flex items-center justify-center overflow-hidden">
            <svg
              viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
              className="w-full h-full select-none transition-all duration-500 ease-out"
            >
              <defs>
                {/* Heat Map Kernel Blur Filter */}
                <filter id="heatKernelBlur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation={heatRadius / 3.2} result="blur" />
                </filter>

                {/* Thermal Multi-Tier Radial Gradients */}
                <radialGradient id="heatGradHyper" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#ea580c" stopOpacity="0.75" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heatGradHigh" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.9" />
                  <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.6" />
                  <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heatGradMod" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#ca8a04" stopOpacity="0.45" />
                  <stop offset="85%" stopColor="#0284c7" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heatGradLow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.75" />
                  <stop offset="55%" stopColor="#0284c7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </radialGradient>

                {/* Biohazard Palette */}
                <radialGradient id="heatGradBiohazard" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#ea580c" stopOpacity="0.7" />
                  <stop offset="70%" stopColor="#c026d3" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#c026d3" stopOpacity="0" />
                </radialGradient>

                {/* Spectral Palette */}
                <radialGradient id="heatGradSpectral" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#14b8a6" stopOpacity="0.6" />
                  <stop offset="75%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="alertGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="targetReticle" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                  <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Administrative Catchment Polygons / Visual Bounds */}
              <path
                d="M 220 80 L 340 70 L 460 110 L 550 170 L 560 260 L 480 340 L 450 430 L 360 410 L 300 370 L 220 280 L 210 180 Z"
                fill="rgba(15, 23, 42, 0.6)"
                stroke="#334155"
                strokeWidth={1.5 / viewBox.zoom}
                strokeDasharray="6 4"
              />

              {/* Transmission corridors */}
              <line x1="380" y1="150" x2="260" y2="220" stroke="rgba(6, 182, 212, 0.2)" strokeWidth={2 / viewBox.zoom} strokeDasharray="3 3" />
              <line x1="380" y1="150" x2="420" y2="240" stroke="rgba(6, 182, 212, 0.2)" strokeWidth={2 / viewBox.zoom} strokeDasharray="3 3" />
              <line x1="380" y1="150" x2="310" y2="100" stroke="rgba(6, 182, 212, 0.2)" strokeWidth={2 / viewBox.zoom} strokeDasharray="3 3" />
              <line x1="420" y1="240" x2="390" y2="310" stroke="rgba(6, 182, 212, 0.2)" strokeWidth={2 / viewBox.zoom} strokeDasharray="3 3" />
              <line x1="420" y1="240" x2="520" y2="200" stroke="rgba(6, 182, 212, 0.2)" strokeWidth={2 / viewBox.zoom} strokeDasharray="3 3" />

              {/* ========================================================================= */}
              {/* INTERACTIVE HEAT MAP LAYER: KERNEL DENSITY OVER BARANGAY CASE COUNTS       */}
              {/* ========================================================================= */}
              {heatMapActive && heatMapMode !== 'choropleth' && (
                <g id="interactive-heat-map-layer" opacity={heatOpacity} className="transition-opacity duration-300">
                  {/* Continuous Thermal Diffusion Field */}
                  <g filter="url(#heatKernelBlur)">
                    {activeHeatPoints.map(p => {
                      if (p.cases === 0) return null;
                      // Radius expands with case count
                      const kernelR = Math.max(
                        heatRadius * 0.7,
                        Math.min(heatRadius * 2.8, heatRadius * (0.75 + p.weight * 1.6))
                      );

                      const gradId =
                        heatPalette === 'biohazard'
                          ? 'heatGradBiohazard'
                          : heatPalette === 'spectral'
                          ? 'heatGradSpectral'
                          : p.densityTier === 'hyper'
                          ? 'heatGradHyper'
                          : p.densityTier === 'high'
                          ? 'heatGradHigh'
                          : p.densityTier === 'moderate'
                          ? 'heatGradMod'
                          : 'heatGradLow';

                      return (
                        <circle
                          key={`heat-kernel-${p.municipality}-${p.name}`}
                          cx={p.x}
                          cy={p.y}
                          r={kernelR}
                          fill={`url(#${gradId})`}
                          opacity={0.7 + p.weight * 0.3}
                        />
                      );
                    })}
                  </g>

                  {/* Radiating Isobar Radar Rings on Peak Density Clusters */}
                  {activeHeatPoints
                    .filter(p => p.cases >= 5)
                    .map(p => {
                      const isCritical = p.cases >= 12;
                      return (
                        <g key={`heat-pulse-${p.municipality}-${p.name}`}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={14 + p.weight * 18}
                            fill="none"
                            stroke={isCritical ? '#f43f5e' : '#f59e0b'}
                            strokeWidth={1.2 / viewBox.zoom}
                            strokeDasharray="3 3"
                            opacity={0.65}
                            className="animate-ping"
                            style={{
                              transformOrigin: `${p.x}px ${p.y}px`,
                              animationDuration: isCritical ? '2s' : '3.5s',
                            }}
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={9 + p.weight * 12}
                            fill="none"
                            stroke={isCritical ? '#fb7185' : '#fcd34d'}
                            strokeWidth={1 / viewBox.zoom}
                            opacity={0.85}
                          />
                        </g>
                      );
                    })}

                  {/* Interactive Cluster Epicenter Nodes with Click-to-Zoom */}
                  {showClusterEpicenters &&
                    activeHeatPoints.map(p => {
                      if (p.cases === 0) return null;
                      const isHovered =
                        hoveredClusterPoint?.name === p.name &&
                        hoveredClusterPoint?.municipality === p.municipality;
                      const isSelected =
                        selectedBarangay?.toLowerCase() === p.name.toLowerCase() &&
                        selectedMunicipality?.toLowerCase() === p.municipality.toLowerCase();

                      const epicenterRadius = Math.max(3, Math.min(8, 3 + p.weight * 5));

                      const pinColor =
                        p.densityTier === 'hyper'
                          ? '#f43f5e'
                          : p.densityTier === 'high'
                          ? '#ea580c'
                          : p.densityTier === 'moderate'
                          ? '#eab308'
                          : '#06b6d4';

                      return (
                        <g
                          key={`heat-epicenter-${p.municipality}-${p.name}`}
                          className="cursor-pointer group"
                          onClick={() => {
                            onSelectMunicipality(p.municipality);
                            onSelectBarangay(isSelected ? '' : p.name);
                          }}
                          onMouseEnter={() => setHoveredClusterPoint(p)}
                          onMouseLeave={() => setHoveredClusterPoint(null)}
                        >
                          {/* Highlight Halo when hovered or selected */}
                          {(isHovered || isSelected) && (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={epicenterRadius * 2.4}
                              fill="rgba(244, 63, 94, 0.25)"
                              stroke="#f43f5e"
                              strokeWidth={1.5 / viewBox.zoom}
                              className="animate-pulse"
                            />
                          )}

                          {/* Epicenter Core Dot */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={epicenterRadius}
                            fill={pinColor}
                            stroke="#ffffff"
                            strokeWidth={1.2 / viewBox.zoom}
                            className="transition-transform group-hover:scale-125"
                          />

                          {/* Cluster Case Badge */}
                          {showClusterLabels &&
                            (p.cases >= 4 || isHovered || isSelected || viewBox.zoom > 1.6) && (
                              <g pointerEvents="none">
                                <rect
                                  x={p.x - 14 / viewBox.zoom}
                                  y={p.y - epicenterRadius - 13 / viewBox.zoom}
                                  width={28 / viewBox.zoom}
                                  height={11 / viewBox.zoom}
                                  rx={3 / viewBox.zoom}
                                  fill="rgba(15, 23, 42, 0.9)"
                                  stroke={p.cases >= 8 ? '#f43f5e' : '#38bdf8'}
                                  strokeWidth={0.75 / viewBox.zoom}
                                />
                                <text
                                  x={p.x}
                                  y={p.y - epicenterRadius - 5 / viewBox.zoom}
                                  fill="#ffffff"
                                  fontSize={Math.max(6, 7.5 / Math.sqrt(viewBox.zoom))}
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  textAnchor="middle"
                                >
                                  {p.cases}
                                </text>
                              </g>
                            )}
                        </g>
                      );
                    })}
                </g>
              )}

              {/* Municipalities Centroid Nodes */}
              {effectiveMunicipalities.map(muni => {
                const coords = MUNI_COORDINATES[muni.name] || { x: 360, y: 220, labelPos: { dx: 0, dy: 15 } };
                const isSelected = selectedMunicipality.toLowerCase() === muni.name.toLowerCase();
                const baseRadius = Math.max(12, Math.min(32, 10 + (muni.cases / maxCasesMuni) * 22));
                // scale radius relative to zoom so nodes stay proportional
                const radius = isSelected ? baseRadius * 1.1 : baseRadius;

                const fillColor =
                  muni.status === 'Epidemic'
                    ? '#f43f5e'
                    : muni.status === 'Alert'
                    ? '#f59e0b'
                    : '#06b6d4';

                return (
                  <g
                    key={muni.name}
                    className="cursor-pointer transition-all duration-200"
                    opacity={heatMapMode === 'heatOnly' && heatMapActive ? (isSelected ? 0.9 : 0.25) : 1}
                    onClick={() => {
                      onSelectMunicipality(isSelected ? '' : muni.name);
                      onSelectBarangay('');
                    }}
                    onMouseEnter={() => setHoveredMuni(muni)}
                    onMouseLeave={() => setHoveredMuni(null)}
                  >
                    {/* Hotspot Outer Halo Ring if Epidemic / Alert */}
                    {muni.status === 'Epidemic' && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={radius * 1.8}
                        fill="url(#hotspotGlow)"
                        className="animate-pulse"
                      />
                    )}
                    {muni.status === 'Alert' && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={radius * 1.5}
                        fill="url(#alertGlow)"
                      />
                    )}

                    {/* Target Crosshair & Radar Halo if Selected */}
                    {isSelected && (
                      <g>
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={radius * 2.2}
                          fill="url(#targetReticle)"
                        />
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={radius * 2.4}
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth={1.5 / viewBox.zoom}
                          strokeDasharray="4 3"
                          className="animate-spin"
                          style={{ transformOrigin: `${coords.x}px ${coords.y}px`, animationDuration: '8s' }}
                        />
                      </g>
                    )}

                    {/* Main Centroid Node */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={radius}
                      fill={fillColor}
                      fillOpacity={isSelected ? 0.95 : 0.75}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={(isSelected ? 2.5 : 1.5) / viewBox.zoom}
                    />

                    {/* Case Count Label inside node */}
                    <text
                      x={coords.x}
                      y={coords.y + 4 / viewBox.zoom}
                      fill="#ffffff"
                      fontSize={Math.max(8, 10 / Math.sqrt(viewBox.zoom))}
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {muni.cases}
                    </text>

                    {/* Municipality Name Label */}
                    <text
                      x={coords.x + coords.labelPos.dx / viewBox.zoom}
                      y={coords.y + coords.labelPos.dy / viewBox.zoom}
                      fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                      fontSize={Math.max(8, 11 / Math.sqrt(viewBox.zoom))}
                      fontWeight={isSelected ? 'bold' : '600'}
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      className="drop-shadow"
                    >
                      {muni.name}
                    </text>
                  </g>
                );
              })}

              {/* SATELLITE BARANGAY CLUSTERS (Rendered when Zoomed into a Municipality) */}
              {selectedMunicipality &&
                activeMunicipalityBarangays.map(b => {
                  const mCoords = MUNI_COORDINATES[selectedMunicipality] || { x: 360, y: 220 };
                  const offset = BARANGAY_OFFSETS[b.name] || {
                    dx: (Math.sin(b.cases) * 30),
                    dy: (Math.cos(b.cases) * 30),
                  };
                  const bx = mCoords.x + offset.dx;
                  const by = mCoords.y + offset.dy;

                  const isBarangaySelected = selectedBarangay?.toLowerCase() === b.name.toLowerCase();
                  const brgyRadius = Math.max(5, Math.min(10, 4 + (b.cases / 15) * 6));

                  const bColor =
                    b.hotspotType === 'Persistent'
                      ? '#f43f5e'
                      : b.hotspotType === 'Emerging'
                      ? '#f59e0b'
                      : '#10b981';

                  return (
                    <g
                      key={`brgy-${b.name}`}
                      className="cursor-pointer"
                      onClick={() => onSelectBarangay(isBarangaySelected ? '' : b.name)}
                      onMouseEnter={() => setHoveredBrgy(b)}
                      onMouseLeave={() => setHoveredBrgy(null)}
                    >
                      {/* Connecting stem to municipality centroid */}
                      <line
                        x1={mCoords.x}
                        y1={mCoords.y}
                        x2={bx}
                        y2={by}
                        stroke="#0ea5e9"
                        strokeWidth={1 / viewBox.zoom}
                        strokeDasharray="2 2"
                        opacity={0.6}
                      />

                      {/* Radar Target if selected */}
                      {isBarangaySelected && (
                        <circle
                          cx={bx}
                          cy={by}
                          r={brgyRadius * 2.2}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth={1.5 / viewBox.zoom}
                          className="animate-ping"
                        />
                      )}

                      {/* Barangay Marker Circle */}
                      <circle
                        cx={bx}
                        cy={by}
                        r={brgyRadius}
                        fill={bColor}
                        stroke={isBarangaySelected ? '#ffffff' : '#0f172a'}
                        strokeWidth={1.5 / viewBox.zoom}
                      />

                      {/* Barangay Name Label */}
                      <text
                        x={bx}
                        y={by - brgyRadius - 3 / viewBox.zoom}
                        fill={isBarangaySelected ? '#38bdf8' : '#cbd5e1'}
                        fontSize={Math.max(6, 8.5 / Math.sqrt(viewBox.zoom))}
                        fontWeight={isBarangaySelected ? 'bold' : '600'}
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        className="drop-shadow"
                      >
                        {b.name} ({b.cases})
                      </text>
                    </g>
                  );
                })}
            </svg>

            {/* Hover Floating Inspection Box for Municipality */}
            {hoveredMuni && !hoveredBrgy && (
              <div
                className="absolute top-3 left-3 z-30 p-3 rounded-lg bg-slate-950/95 border border-slate-700 shadow-2xl text-xs backdrop-blur-md pointer-events-none animate-in fade-in"
                style={{ width: '220px' }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                  <span className="font-bold text-white text-sm">{hoveredMuni.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      hoveredMuni.status === 'Epidemic'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : hoveredMuni.status === 'Alert'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {hoveredMuni.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Cumulative Cases:</span>
                    <span className="font-bold text-white">{hoveredMuni.cases}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>% Contribution:</span>
                    <span className="text-cyan-400 font-bold">{hoveredMuni.pctContribution}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Attack Rate / 100k:</span>
                    <span className="text-amber-400 font-bold">{hoveredMuni.incidencePer100k}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Deaths / CFR:</span>
                    <span className="text-rose-400 font-bold">
                      {hoveredMuni.deaths} ({hoveredMuni.cfr}%)
                    </span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>Epicenter Barangay: </span>
                    <strong className="text-slate-200">{hoveredMuni.topBarangay}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Hover Floating Box for Barangay */}
            {hoveredBrgy && (
              <div
                className="absolute top-3 right-3 z-30 p-3 rounded-lg bg-slate-950/95 border border-cyan-500/40 shadow-2xl text-xs backdrop-blur-md pointer-events-none animate-in fade-in"
                style={{ width: '220px' }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                  <span className="font-bold text-white text-sm">{hoveredBrgy.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      hoveredBrgy.hotspotType === 'Persistent'
                        ? 'bg-rose-500/20 text-rose-300'
                        : hoveredBrgy.hotspotType === 'Emerging'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {hoveredBrgy.hotspotType.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Municipality:</span>
                    <span className="text-white font-bold">{hoveredBrgy.municipality}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cases:</span>
                    <span className="text-cyan-400 font-bold">{hoveredBrgy.cases}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Attack Rate / 100k:</span>
                    <span className="text-amber-400 font-bold">{hoveredBrgy.incidencePer100k}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Deaths:</span>
                    <span className="text-rose-400 font-bold">{hoveredBrgy.deaths}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hover Floating HUD Box for High-Density Heat Cluster */}
            {hoveredClusterPoint && !hoveredBrgy && !hoveredMuni && (
              <div
                className="absolute top-3 right-3 z-40 p-3.5 rounded-xl bg-slate-950/95 border border-rose-500/50 shadow-2xl text-xs backdrop-blur-md pointer-events-none animate-in fade-in"
                style={{ width: '250px' }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400 fill-rose-500/30" />
                    <span className="font-bold text-white text-sm">{hoveredClusterPoint.name}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                      hoveredClusterPoint.densityTier === 'hyper'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : hoveredClusterPoint.densityTier === 'high'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {hoveredClusterPoint.densityTier} Cluster
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Municipality:</span>
                    <span className="text-white font-bold">{hoveredClusterPoint.municipality}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Case Count (Barangay):</span>
                    <span className="text-rose-400 font-extrabold text-xs">
                      {hoveredClusterPoint.cases} cases
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cluster Rank:</span>
                    <span className="text-amber-300 font-bold">
                      #{hoveredClusterPoint.rank} in Catchment
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Attack Rate / 100k:</span>
                    <span className="text-cyan-400 font-bold">{hoveredClusterPoint.incidencePer100k}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Status:</span>
                    <span className="text-slate-200">{hoveredClusterPoint.hotspotType}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Deaths:</span>
                    <span className="text-rose-400 font-bold">{hoveredClusterPoint.deaths}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 font-sans flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-cyan-400" />
                    <span>Click cluster to focus &amp; zoom</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map & Heat Map Legend */}
          <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px]">
            {/* Heat Map Continuous Thermal Gradient Bar (When Heat Map is Active) */}
            {heatMapActive && (
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-mono text-[10px] text-slate-300 uppercase font-bold tracking-wider">
                    Barangay Case Density Scale:
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="font-mono text-[10px] text-slate-400">1 case</span>
                  {/* Multi-stop gradient indicator bar */}
                  <div
                    className="h-2.5 w-36 sm:w-48 rounded-full border border-slate-700 shadow-inner"
                    style={{
                      background:
                        heatPalette === 'biohazard'
                          ? 'linear-gradient(to right, #0284c7, #facc15, #ea580c, #c026d3)'
                          : heatPalette === 'spectral'
                          ? 'linear-gradient(to right, #6366f1, #14b8a6, #f59e0b, #f43f5e)'
                          : 'linear-gradient(to right, #06b6d4, #eab308, #ea580c, #f43f5e)',
                    }}
                  />
                  <span className="font-mono text-[10px] text-rose-400 font-bold">15+ cases</span>
                </div>

                <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="text-amber-300 font-bold">{highDensityClustersCount}</span>
                  <span>clusters detected (weighted by case count by barangay)</span>
                </div>
              </div>
            )}

            {/* Categorical Status Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-rose-400 font-medium">Epidemic (&gt;40/100k)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-amber-400 font-medium">Alert (20–40/100k)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-cyan-400 font-medium">Controlled (&lt;20/100k)</span>
                </div>
              </div>
              <span className="text-slate-500 text-[10px]">
                {autoZoomEnabled
                  ? 'Auto-Zoom active: Click node or cluster to zoom'
                  : 'Click node or cluster to select area'}
              </span>
            </div>
          </div>
        </div>

        {/* Spatial Analytics Leaderboard Table (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                {activeTab === 'municipalities' ? 'Municipality Surveillance Table' : 'Top 10 Transmission Hotspots'}
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeTab === 'municipalities' ? `${effectiveMunicipalities.length} Areas` : `${effectiveBarangays.length} Catchments`}
              </span>
            </div>

            {/* List Table */}
            <div className="overflow-y-auto max-h-80 space-y-2 pr-1">
              {activeTab === 'municipalities' ? (
                effectiveMunicipalities.map((m, idx) => {
                  const isSelected = selectedMunicipality.toLowerCase() === m.name.toLowerCase();
                  return (
                    <div
                      key={m.name}
                      onClick={() => {
                        onSelectMunicipality(isSelected ? '' : m.name);
                        onSelectBarangay('');
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                          <span className="font-bold text-white">{m.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              m.status === 'Epidemic'
                                ? 'bg-rose-500/20 text-rose-300'
                                : m.status === 'Alert'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-cyan-400">{m.cases} cases</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Share: {m.pctContribution}%</span>
                        <span>Attack Rate: {m.incidencePer100k}/100k</span>
                        <span>CFR: {m.cfr}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                top10Barangays.map((b, idx) => {
                  const isSelected =
                    selectedBarangay?.toLowerCase() === b.name.toLowerCase() &&
                    selectedMunicipality?.toLowerCase() === b.municipality.toLowerCase();

                  return (
                    <div
                      key={`${b.municipality}-${b.name}`}
                      onClick={() => {
                        onSelectMunicipality(b.municipality);
                        onSelectBarangay(b.name);
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                          <span className="font-bold text-white">{b.name}</span>
                          <span className="text-[10px] text-slate-400">({b.municipality})</span>
                        </div>
                        <span className="font-mono font-bold text-cyan-400">{b.cases} cases</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          {b.hotspotType === 'Persistent' && (
                            <span className="text-rose-400 font-bold bg-rose-500/20 px-1.5 py-0.2 rounded">
                              PERSISTENT (≥3 wks)
                            </span>
                          )}
                          {b.hotspotType === 'Emerging' && (
                            <span className="text-amber-400 font-bold bg-amber-500/20 px-1.5 py-0.2 rounded">
                              EMERGING
                            </span>
                          )}
                          {b.hotspotType === 'Controlled' && (
                            <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">
                              CONTROLLED
                            </span>
                          )}
                        </span>
                        <span>Incidence: {b.incidencePer100k}/100k</span>
                        <span>Deaths: {b.deaths}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Spatial Scan Metric: Attack Rate & Hotspot Persistence</span>
            <span
              className="text-cyan-400 font-semibold cursor-pointer hover:underline"
              onClick={handleResetView}
            >
              Reset to Full Overview
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
