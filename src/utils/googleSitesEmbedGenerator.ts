import { EpidemiologicalMetrics, SurveillanceRecord } from '../types/surveillance';
import {
  ARGAO_AGE_SEX_POPULATION_2026,
  ARGAO_FEMALE_POPULATION_2026,
  ARGAO_MALE_POPULATION_2026,
  ARGAO_TOTAL_POPULATION_2026,
  BarangayRiskLevel,
  calculateBarangayHeatmapPareto,
  calculateClinicalSeverityBreakdown,
  calculateFullYearEpiChannel,
  classifyBarangayRiskLevel,
  getDetailedAgeBracket,
} from './epidemiology';

export const POP_2026_STORAGE_KEY = 'argao_barangay_population_2026';

export function readPersistedBarangayPopulations(): Record<string, string> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }
  try {
    const saved = localStorage.getItem(POP_2026_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as Record<string, string>;
    const cleaned: Record<string, string> = {};
    Object.entries(parsed).forEach(([k, v]) => {
      if (typeof v === 'string' && v.trim() !== '') cleaned[k] = v.trim();
    });
    return cleaned;
  } catch {
    return {};
  }
}

export interface GoogleSitesEmbedBundle {
  html: string;
  byteSize: number;
  totalCases: number;
  coverageRange: string;
  asOfDate: string;
  barangayCount: number;
  riskCounts: Record<BarangayRiskLevel, number>;
}

const DENGUE_CASE_DEFINITIONS = [
  {
    title: 'Suspected Dengue',
    criteria:
      'Acute febrile illness (2–7 days) with at least two symptoms: headache, retro-orbital pain, myalgia, arthralgia, rash, hemorrhagic signs, or leukopenia.',
  },
  {
    title: 'Without Warning',
    criteria:
      'Probable or confirmed dengue with acute fever and systemic manifestations without abdominal pain, persistent vomiting, bleeding, or plasma leakage.',
  },
  {
    title: 'With Warning',
    criteria:
      'Abdominal tenderness, persistent vomiting, fluid accumulation, mucosal bleeding, lethargy, hepatomegaly >2 cm, or rising hematocrit.',
  },
  {
    title: 'Severe Dengue',
    criteria:
      'Severe plasma leakage leading to shock or respiratory distress, severe hemorrhage, or severe organ impairment.',
  },
];

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function formatCoverageRange(activeRecords: SurveillanceRecord[]): string {
  const validDates = activeRecords
    .map(r => r.dateOnset)
    .filter(Boolean)
    .sort();
  if (validDates.length === 0) return 'Jan 1 – Nov 21, 2026';

  const start = new Date(`${validDates[0]}T00:00:00`);
  const end = new Date(`${validDates[validDates.length - 1]}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Jan 1 – Nov 21, 2026';
  }
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

export function buildGoogleSitesEmbedHTML(
  records: SurveillanceRecord[],
  metrics: EpidemiologicalMetrics,
  populationOverrides?: Record<string, string>,
  lastYearSamePeriodCases = 48
): GoogleSitesEmbedBundle {
  const activeRecords = records.filter(r => !r.isDuplicate);
  const overrides = populationOverrides ?? readPersistedBarangayPopulations();

  const asOfDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const coverageRange = formatCoverageRange(activeRecords);
  const maxEpiWeek = Math.max(46, metrics.latestMorbidityWeek || 46);

  // 1. Barangay Heatmap & Risk Classification (merged with persisted 2026 population overrides)
  const { rows: baseBarangayRows, windowWeeks, totalYtdCases } =
    calculateBarangayHeatmapPareto(activeRecords);

  const riskCounts: Record<BarangayRiskLevel, number> = {
    Critical: 0,
    High: 0,
    Moderate: 0,
    Low: 0,
    'No Case': 0,
  };

  let totalPopulation2026 = 0;
  const barangayRows = baseBarangayRows.map(row => {
    const rawOverride = overrides[row.name];
    const pop =
      rawOverride !== undefined && rawOverride !== ''
        ? parseInt(rawOverride, 10)
        : row.population;
    const validPop = !isNaN(pop) && pop > 0 ? pop : 0;
    totalPopulation2026 += validPop;
    const attackRate = validPop > 0 ? (row.ytdCases / validPop) * 1000 : null;
    const riskLevel = classifyBarangayRiskLevel(
      row.ytdCases,
      attackRate,
      row.isVitalFew80
    );
    riskCounts[riskLevel] += 1;

    return {
      rank: row.rank,
      name: row.name,
      sevenWeekCounts: row.sevenWeekCounts,
      sevenWeekLabels: row.sevenWeekLabels,
      ytdCases: row.ytdCases,
      population: validPop,
      attackRate,
      riskLevel,
      cumulativeParetoPct: row.cumulativeParetoPct,
      isVitalFew80: row.isVitalFew80,
    };
  });

  const municipalPopDenominator =
    totalPopulation2026 > 0
      ? totalPopulation2026
      : metrics.totalPopulation || ARGAO_TOTAL_POPULATION_2026;
  const municipalAttackRate =
    municipalPopDenominator > 0
      ? (totalYtdCases / municipalPopDenominator) * 1000
      : 0;

  // 2. KPI Computations
  const totalCases = metrics.totalCases;
  const aliveCount = Math.max(0, totalCases - metrics.deaths);
  const alivePct = totalCases > 0 ? (aliveCount / totalCases) * 100 : 100;
  const deathSharePct = totalCases > 0 ? (metrics.deaths / totalCases) * 100 : 0;
  const yoyDiff = totalCases - lastYearSamePeriodCases;
  const yoyPct =
    lastYearSamePeriodCases > 0
      ? Math.round((yoyDiff / lastYearSamePeriodCases) * 1000) / 10
      : 0;
  const cfr = metrics.cfr;
  const nationalThreshold = 1.0;
  const isCfrExceeded = cfr >= nationalThreshold;

  const meanConsultDelay = metrics.onsetToConsultationDaysMean;
  const medianConsultDelay = metrics.onsetToConsultationDaysMedian;
  const earlyConsultPct = metrics.earlyConsultationRatePct ?? 0;
  const delayedConsultPct = metrics.delayedConsultationRatePct ?? 0;
  const delayEvaluatedCount = metrics.consultDelayEvaluatedCount ?? 0;
  const isDelayOptimal = meanConsultDelay <= 2.0;
  const isDelayElevated = meanConsultDelay > 3.0;

  const hospitalizationRate = metrics.hospitalizationRate;
  const hospitalizedCount = metrics.hospitalizedCount;
  const outpatientCount =
    metrics.outpatientCount ?? Math.max(0, totalCases - hospitalizedCount);
  const meanAdmitDelay = metrics.onsetToAdmissionDaysMean;

  // 3. Epidemic Curve (MW 1..maxEpiWeek)
  const channelData = calculateFullYearEpiChannel(activeRecords, maxEpiWeek);
  const yMax = Math.ceil(Math.max(...channelData.map(d => d.cases), 1) * 1.18);
  const svgW = 920;
  const svgH = 290;
  const pad = { top: 22, right: 16, bottom: 48, left: 34 };
  const innerW = svgW - pad.left - pad.right;
  const innerH = svgH - pad.top - pad.bottom;
  const slotW = innerW / channelData.length;
  const getY = (val: number) => pad.top + innerH - (val / yMax) * innerH;

  const epiTicksSvg = [0, Math.round(yMax / 2), yMax]
    .map(tickVal => {
      const y = getY(tickVal);
      return `<g>
        <line x1="${pad.left - 4}" y1="${y.toFixed(1)}" x2="${pad.left}" y2="${y.toFixed(1)}" stroke="#475569" stroke-width="1" />
        <text x="${pad.left - 7}" y="${(y + 3).toFixed(1)}" fill="#94a3b8" font-size="10" font-family="'JetBrains Mono', ui-monospace, monospace" text-anchor="end">${tickVal}</text>
      </g>`;
    })
    .join('\n');

  const epiBarsSvg = channelData
    .map((d, idx) => {
      const x = pad.left + idx * slotW;
      const barH = (d.cases / yMax) * innerH;
      const y = pad.top + innerH - barH;
      const center = x + slotW / 2;
      const barMarkup =
        d.cases > 0
          ? `<rect class="epi-bar" data-mw="${d.mw}" data-cases="${d.cases}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${slotW.toFixed(2)}" height="${barH.toFixed(2)}" fill="#1e3a8a" stroke="#0b0c0e" stroke-width="0.4" />
             <text x="${center.toFixed(2)}" y="${(y - 4).toFixed(2)}" fill="#e2e8f0" font-size="8.5" font-family="'JetBrains Mono', ui-monospace, monospace" font-weight="600" text-anchor="middle">${d.cases}</text>`
          : `<rect class="epi-bar-hit" data-mw="${d.mw}" data-cases="0" x="${x.toFixed(2)}" y="${pad.top}" width="${slotW.toFixed(2)}" height="${innerH}" fill="transparent" />`;

      const monthMarkup = d.monthLabel
        ? `<text x="${center.toFixed(2)}" y="${(pad.top + innerH + 30).toFixed(1)}" fill="#cbd5e1" font-size="9" font-family="'DM Sans', system-ui, sans-serif" font-weight="600" text-anchor="start">${escapeHtml(d.monthLabel)}</text>`
        : '';

      return `<g class="epi-col" data-mw="${d.mw}" data-cases="${d.cases}">
        <title>MW ${d.mw}: ${d.cases} case(s)</title>
        ${barMarkup}
        <text x="${center.toFixed(2)}" y="${(pad.top + innerH + 14).toFixed(1)}" fill="#94a3b8" font-size="8" font-family="'JetBrains Mono', ui-monospace, monospace" text-anchor="middle" font-weight="500">${d.mw}</text>
        ${monthMarkup}
      </g>`;
    })
    .join('\n');

  // 4. Case Pyramid (16 five-year demographic cohorts, top-to-bottom 70+ down to <1)
  const countsByBracket: Record<string, { male: number; female: number }> = {};
  activeRecords.forEach(r => {
    const bracket = getDetailedAgeBracket(r.age, r.ageGroup);
    if (!countsByBracket[bracket]) {
      countsByBracket[bracket] = { male: 0, female: 0 };
    }
    if (r.sex === 'M' || r.sex === 'Male') {
      countsByBracket[bracket].male += 1;
    } else if (r.sex === 'F' || r.sex === 'Female') {
      countsByBracket[bracket].female += 1;
    }
  });

  const pyramidRows = [...ARGAO_AGE_SEX_POPULATION_2026]
    .reverse()
    .map(demo => {
      const male = countsByBracket[demo.cohort]?.male || 0;
      const female = countsByBracket[demo.cohort]?.female || 0;
      const maleRate = demo.male > 0 ? (male / demo.male) * 1000 : 0;
      const femaleRate = demo.female > 0 ? (female / demo.female) * 1000 : 0;
      return {
        cohort: demo.cohort,
        label: demo.label,
        male,
        female,
        malePop: demo.male,
        femalePop: demo.female,
        totalPop: demo.total,
        popPct: demo.pct,
        maleRate,
        femaleRate,
      };
    });

  const totalMale = pyramidRows.reduce((acc, r) => acc + r.male, 0);
  const totalFemale = pyramidRows.reduce((acc, r) => acc + r.female, 0);
  const grandTotalDemo = totalMale + totalFemale || 1;
  const overallMaleRate = (totalMale / ARGAO_MALE_POPULATION_2026) * 1000;
  const overallFemaleRate = (totalFemale / ARGAO_FEMALE_POPULATION_2026) * 1000;

  // 5. Clinical & Case Classification
  const severity = calculateClinicalSeverityBreakdown(activeRecords);
  const radius = 44;
  const semiCircumference = Math.PI * radius;
  const clampedHospPct = Math.max(0, Math.min(100, severity.hospitalizationRatePct));
  const strokeDashoffset = semiCircumference * (1 - clampedHospPct / 100);
  const warningPlusSeverePct = (
    severity.withWarningSigns.pct + severity.severeDengue.pct
  ).toFixed(1);

  const clinicalRows = [
    {
      label: 'Without Warning Signs',
      count: severity.withoutWarningSigns.count,
      pct: severity.withoutWarningSigns.pct,
      color: '#2563eb',
      textColor: '#93c5fd',
    },
    {
      label: 'With Warning Signs',
      count: severity.withWarningSigns.count,
      pct: severity.withWarningSigns.pct,
      color: '#eab308',
      textColor: '#fde047',
    },
    {
      label: 'Severe Dengue',
      count: severity.severeDengue.count,
      pct: severity.severeDengue.pct,
      color: '#dc2626',
      textColor: '#fca5a5',
    },
  ];

  const caseClassRows = [
    {
      label: 'Confirmed',
      count: severity.confirmed.count,
      pct: severity.confirmed.pct,
      color: '#10b981',
      textColor: '#6ee7b7',
    },
    {
      label: 'Probable',
      count: severity.probable.count,
      pct: severity.probable.pct,
      color: '#f59e0b',
      textColor: '#fcd34d',
    },
    {
      label: 'Suspect',
      count: severity.suspect.count,
      pct: severity.suspect.pct,
      color: '#64748b',
      textColor: '#cbd5e1',
    },
  ];

  // Pre-render initial Barangay table rows (all 45 serialized for vanilla JS toggle)
  const riskClassMap: Record<BarangayRiskLevel, string> = {
    Critical: 'risk-critical',
    High: 'risk-high',
    Moderate: 'risk-moderate',
    Low: 'risk-low',
    'No Case': 'risk-nocase',
  };

  const barangayRowsHtml = barangayRows
    .map((row, idx) => {
      const hiddenAttr = idx >= 12 ? ' data-extra-brgy="1" style="display:none"' : '';
      const heatCells = row.sevenWeekCounts
        .map((count, wIdx) => {
          const cls =
            count === 0
              ? 'heat-0'
              : count === 1
              ? 'heat-1'
              : count === 2
              ? 'heat-2'
              : 'heat-3';
          return `<div class="heat-cell ${cls}" title="${escapeHtml(row.name)} · MW ${row.sevenWeekLabels[wIdx]}: ${count}">${count > 0 ? count : ''}</div>`;
        })
        .join('');

      const riskTooltip =
        row.riskLevel === 'No Case'
          ? `${row.name}: 0 cases reported`
          : `${row.name}: ${row.riskLevel} · AR ${row.attackRate !== null ? row.attackRate.toFixed(2) : '—'}/1,000 (${row.isVitalFew80 ? 'Pareto 80% Vital Few' : 'Outside Pareto 80%'})`;

      return `<tr class="brgy-row"${hiddenAttr}>
        <td class="td-rank">${row.rank}</td>
        <td class="td-name">${escapeHtml(row.name)}</td>
        <td class="td-heat"><div class="heat-grid">${heatCells}</div></td>
        <td class="td-cases">${row.ytdCases.toLocaleString()}</td>
        <td class="td-pop">${row.population > 0 ? row.population.toLocaleString() : '—'}</td>
        <td class="td-ar">${row.attackRate !== null ? row.attackRate.toFixed(2) : '—'}</td>
        <td class="td-risk ${riskClassMap[row.riskLevel]}" title="${escapeHtml(riskTooltip)}">${escapeHtml(row.riskLevel)}</td>
        <td class="td-pareto">
          <div class="pareto-wrap">
            <div class="pareto-track"><div class="pareto-fill ${row.isVitalFew80 ? 'pareto-vital' : 'pareto-tail'}" style="width:${Math.min(100, row.cumulativeParetoPct).toFixed(1)}%"></div></div>
            <span class="${row.isVitalFew80 ? 'pareto-text-vital' : 'pareto-text-tail'}">${row.cumulativeParetoPct.toFixed(1)}%</span>
          </div>
        </td>
      </tr>`;
    })
    .join('\n');

  const kpiYoyColor =
    yoyDiff > 0 ? '#fbbf24' : yoyDiff < 0 ? '#34d399' : '#94a3b8';
  const kpiDelayColor = isDelayElevated
    ? '#f87171'
    : isDelayOptimal
    ? '#34d399'
    : '#fbbf24';
  const kpiDelaySubColor = isDelayElevated
    ? '#fca5a5'
    : isDelayOptimal
    ? '#6ee7b7'
    : '#fcd34d';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dengue Surveillance Dashboard — Municipality of Argao, Cebu</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-canvas: #0b0c0e;
      --bg-card: #111318;
      --bg-surface: #171a21;
      --border-hairline: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.12);
      --text-primary: #ffffff;
      --text-body: #e4e4e7;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-display: 'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    *, *::before, *::after { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-canvas);
      color: var(--text-body);
      font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.5;
    }

    .tabular { font-variant-numeric: tabular-nums; }
    .mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

    .container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px 20px 28px;
    }

    /* Header */
    .header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-hairline);
      margin-bottom: 22px;
    }
    .header h1 {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(22px, 2.5vw, 30px);
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .header-sub {
      margin: 5px 0 0;
      font-size: 14px;
      color: #cbd5e1;
    }
    .header-meta {
      text-align: right;
      font-size: 12px;
      color: var(--text-muted);
    }
    .header-meta-title {
      font-weight: 600;
      color: #93c5fd;
      font-size: 13px;
      margin-bottom: 3px;
    }

    /* 6-Card KPI Grid (3x2 on desktop) */
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    @media (min-width: 640px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .kpi-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
    }
    .kpi-value-row {
      margin-top: 10px;
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
    }
    .kpi-value {
      font-family: var(--font-mono);
      font-size: clamp(28px, 3vw, 36px);
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.1;
      color: var(--text-primary);
    }
    .kpi-delta {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 600;
    }
    .kpi-sub {
      margin-top: 8px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Case Definitions */
    .defs-band {
      border-top: 1px solid var(--border-hairline);
      border-bottom: 1px solid var(--border-hairline);
      padding: 16px 0;
      margin-bottom: 22px;
    }
    .defs-heading {
      margin: 0 0 12px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: #e2e8f0;
    }
    .defs-grid {
      display: grid;
      grid-template-columns: 1fr;
    }
    @media (min-width: 768px) {
      .defs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      .defs-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    .def-col {
      padding: 8px 0;
      border-top: 1px solid var(--border-hairline);
    }
    .def-col:first-child { border-top: none; }
    @media (min-width: 1024px) {
      .def-col {
        border-top: none;
        border-left: 1px solid var(--border-hairline);
        padding: 0 18px;
      }
      .def-col:first-child { border-left: none; padding-left: 0; }
      .def-col:last-child { padding-right: 0; }
    }
    .def-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    .def-text {
      margin: 0;
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.55;
    }

    /* Bento 2x2 Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      align-items: stretch;
    }
    @media (min-width: 1200px) {
      .bento-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    .panel {
      background: var(--bg-card);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }
    .panel-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-hairline);
    }
    .panel-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }
    .panel-subtitle {
      margin: 3px 0 0;
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Interactive Controls */
    .btn-toggle {
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      border-radius: 8px;
      padding: 6px 12px;
      color: #e2e8f0;
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s ease;
    }
    .btn-toggle:hover { background: #1e293b; }

    .seg-group {
      display: inline-flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 8px;
      padding: 2px;
      font-family: var(--font-mono);
      font-size: 11px;
    }
    .seg-btn {
      background: transparent;
      border: none;
      border-radius: 6px;
      padding: 4px 10px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .seg-btn:hover { color: #e2e8f0; }
    .seg-btn.active {
      background: #2563eb;
      color: #ffffff;
      font-weight: 600;
    }

    /* Epi Curve SVG */
    .epi-legend {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .epi-swatch {
      width: 12px;
      height: 12px;
      background: #1e3a8a;
      border: 1px solid rgba(59, 130, 246, 0.6);
      display: inline-block;
    }
    .epi-hover-readout {
      font-family: var(--font-mono);
      font-size: 11px;
      color: #93c5fd;
      min-height: 16px;
      margin-top: 8px;
    }
    .svg-scroll {
      margin-top: 6px;
      width: 100%;
      overflow-x: auto;
      flex: 1;
      display: flex;
      align-items: center;
    }
    .svg-scroll svg {
      width: 100%;
      min-width: 620px;
      height: auto;
      display: block;
    }
    .epi-col:hover .epi-bar { fill: #2563eb; }

    /* Barangay Heatmap Table */
    .heat-legend {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
    }
    .heat-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .heat-box {
      width: 10px;
      height: 10px;
      display: inline-block;
    }
    .table-scroll {
      margin-top: 10px;
      overflow-x: auto;
      overflow-y: auto;
      max-height: 365px;
      flex: 1;
    }
    table.heatmap {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 12px;
    }
    table.heatmap thead th {
      position: sticky;
      top: 0;
      z-index: 5;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-strong);
      padding: 8px 6px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      white-space: nowrap;
    }
    table.heatmap thead th.right { text-align: right; }
    table.heatmap thead th.center { text-align: center; }
    table.heatmap tbody tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      height: 36px;
      transition: background 0.12s ease;
    }
    table.heatmap tbody tr:hover { background: rgba(255, 255, 255, 0.03); }
    table.heatmap td {
      padding: 5px 6px;
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .td-rank { color: var(--text-dim); font-size: 11px; width: 28px; }
    .td-name { font-family: var(--font-sans) !important; font-weight: 500; color: #f1f5f9; }
    .td-cases { text-align: right; font-weight: 700; color: #ffffff; }
    .td-pop { text-align: right; color: #cbd5e1; }
    .td-ar { text-align: right; color: #cbd5e1; }
    .td-risk { font-family: var(--font-sans) !important; font-size: 11px; }
    .risk-critical { color: #f87171; font-weight: 600; }
    .risk-high { color: #fbbf24; font-weight: 600; }
    .risk-moderate { color: #60a5fa; font-weight: 500; }
    .risk-low { color: #cbd5e1; font-weight: 500; }
    .risk-nocase { color: #64748b; font-weight: 500; }

    .heat-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      width: 140px;
      margin: 0 auto;
    }
    .heat-cell {
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      border-radius: 2px;
    }
    .heat-0 { background: #161922; color: #475569; }
    .heat-1 { background: rgba(30, 58, 138, 0.8); color: #dbeafe; }
    .heat-2 { background: rgba(217, 119, 6, 0.8); color: #fffbeb; }
    .heat-3 { background: #dc2626; color: #ffffff; font-weight: 700; }

    .pareto-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }
    .pareto-track {
      width: 48px;
      height: 6px;
      background: #1e293b;
      border-radius: 999px;
      overflow: hidden;
    }
    .pareto-fill { height: 100%; }
    .pareto-vital { background: #3b82f6; }
    .pareto-tail { background: #475569; }
    .pareto-text-vital { color: #93c5fd; font-weight: 600; }
    .pareto-text-tail { color: var(--text-muted); }

    /* Case Pyramid */
    .pyramid-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      padding-top: 10px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: #cbd5e1;
    }
    .pyr-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .pyr-axis {
      display: flex;
      align-items: center;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      padding: 10px 0 4px;
    }
    .pyr-axis-left { flex: 1; text-align: right; padding-right: 8px; }
    .pyr-axis-mid { width: 56px; text-align: center; font-weight: 600; color: #cbd5e1; }
    .pyr-axis-right { flex: 1; text-align: left; padding-left: 8px; }

    .pyr-rows {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .pyr-row {
      display: flex;
      align-items: center;
      height: 21px;
      border-radius: 2px;
      transition: background 0.1s ease;
    }
    .pyr-row:hover { background: rgba(255, 255, 255, 0.04); }
    .pyr-side-left {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 100%;
    }
    .pyr-side-right {
      flex: 1;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      height: 100%;
    }
    .pyr-age {
      width: 56px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      color: #e2e8f0;
      flex-shrink: 0;
    }
    .pyr-bar-male {
      height: 100%;
      background: #2563eb;
      border-bottom: 1px solid rgba(11, 12, 14, 0.7);
      transition: width 0.2s ease;
    }
    .pyr-bar-female {
      height: 100%;
      background: #dc2626;
      border-bottom: 1px solid rgba(11, 12, 14, 0.7);
      transition: width 0.2s ease;
    }
    .pyr-val-m {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      color: #93c5fd;
      padding-right: 6px;
    }
    .pyr-val-f {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      color: #fca5a5;
      padding-left: 6px;
    }
    .pyr-hover-readout {
      margin-top: 8px;
      min-height: 16px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Severity Risk Card */
    .gauge-band {
      padding: 16px 0;
      border-bottom: 1px solid var(--border-hairline);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }
    .gauge-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .gauge-svg-wrap {
      position: relative;
      width: 96px;
      height: 56px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      flex-shrink: 0;
    }
    .gauge-pct {
      position: absolute;
      bottom: 0;
      font-family: var(--font-mono);
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }
    .spec-section {
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .spec-section + .spec-section {
      margin-top: 16px;
      border-top: 1px solid var(--border-hairline);
    }
    .spec-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .spec-head h4 {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .spec-head span {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
    }
    .stacked-bar {
      width: 100%;
      height: 10px;
      border-radius: 3px;
      overflow: hidden;
      display: flex;
      background: var(--bg-surface);
    }
    .bar-row-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .bar-track {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      background: var(--bg-surface);
    }

    /* Footer */
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      color: var(--text-dim);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Executive Header -->
    <header class="header">
      <div>
        <h1>Dengue Surveillance Dashboard</h1>
        <p class="header-sub">Municipality of Argao, Cebu as of ${escapeHtml(asOfDate)}</p>
      </div>
      <div class="header-meta">
        <div class="header-meta-title">Public &amp; LGU Read-Only Report</div>
        <div class="mono">${escapeHtml(coverageRange)} · MW 1–${maxEpiWeek}</div>
      </div>
    </header>

    <!-- 6 Equal Executive KPI Cards -->
    <section class="kpi-grid" aria-label="Executive Epidemiological KPIs">
      <div class="kpi-card">
        <div class="kpi-label">Total Cases</div>
        <div class="kpi-value-row">
          <span class="kpi-value">${totalCases.toLocaleString()}</span>
          <span class="kpi-delta" style="color:${kpiYoyColor}">${yoyDiff > 0 ? `+${yoyPct}%` : `${yoyPct}%`}</span>
        </div>
        <div class="kpi-sub">vs. ${lastYearSamePeriodCases.toLocaleString()} last year · AR ${((totalCases / (municipalPopDenominator || 79064)) * 1000).toFixed(2)}/1,000</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Total Alive</div>
        <div class="kpi-value-row">
          <span class="kpi-value" style="color:#34d399">${aliveCount.toLocaleString()}</span>
          <span class="kpi-delta" style="color:#6ee7b7">${alivePct.toFixed(1)}%</span>
        </div>
        <div class="kpi-sub">${alivePct.toFixed(1)}% of total cases</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Total Deaths</div>
        <div class="kpi-value-row">
          <span class="kpi-value" style="color:${metrics.deaths > 0 ? '#f87171' : '#f1f5f9'}">${metrics.deaths.toLocaleString()}</span>
          <span class="kpi-delta" style="color:${metrics.deaths > 0 ? '#fca5a5' : '#94a3b8'}">${deathSharePct.toFixed(1)}%</span>
        </div>
        <div class="kpi-sub">${deathSharePct.toFixed(1)}% share</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Case Fatality Rate</div>
        <div class="kpi-value-row">
          <span class="kpi-value" style="color:${isCfrExceeded ? '#f87171' : '#34d399'}">${cfr.toFixed(2)}%</span>
          <span style="font-size:12px;font-weight:500;color:${isCfrExceeded ? '#fca5a5' : '#6ee7b7'}">${isCfrExceeded ? 'Above Benchmark' : 'Within Benchmark'}</span>
        </div>
        <div class="kpi-sub">vs. &lt;${nationalThreshold.toFixed(0)}% National Standard</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Health-Seeking Delay</div>
        <div class="kpi-value-row">
          <span class="kpi-value" style="color:${kpiDelayColor}">${meanConsultDelay.toFixed(1)}d</span>
          <span class="kpi-delta" style="color:${kpiDelaySubColor}">${earlyConsultPct.toFixed(1)}% within &le;2d</span>
        </div>
        <div class="kpi-sub">Median ${medianConsultDelay.toFixed(1)}d · ${delayedConsultPct.toFixed(1)}% delayed &gt;3d · n=${delayEvaluatedCount.toLocaleString()}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Hospitalization Rate</div>
        <div class="kpi-value-row">
          <span class="kpi-value" style="color:${hospitalizationRate >= 60 ? '#fbbf24' : '#60a5fa'}">${hospitalizationRate.toFixed(1)}%</span>
          <span class="kpi-delta" style="color:#93c5fd">${hospitalizedCount.toLocaleString()} admitted</span>
        </div>
        <div class="kpi-sub">${outpatientCount.toLocaleString()} outpatient · Mean ${meanAdmitDelay.toFixed(1)}d to admit</div>
      </div>
    </section>

    <!-- Dengue Standard Case Definitions -->
    <section class="defs-band" aria-label="Dengue Standard Case Definitions">
      <h2 class="defs-heading">Dengue Standard Case Definitions</h2>
      <div class="defs-grid">
        ${DENGUE_CASE_DEFINITIONS.map(
          d => `<div class="def-col">
            <div class="def-title">${escapeHtml(d.title)}</div>
            <p class="def-text">${escapeHtml(d.criteria)}</p>
          </div>`
        ).join('\n')}
      </div>
    </section>

    <!-- 2x2 BI Visualization Bento Grid -->
    <main class="bento-grid">
      <!-- 1. Epidemic Curve -->
      <section class="panel" aria-label="Epidemic Curve">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Epidemic Curve</h3>
            <p class="panel-subtitle mono">Weekly cases by onset of symptoms · ${escapeHtml(coverageRange)}</p>
          </div>
          <div class="epi-legend">
            <span class="epi-swatch"></span>
            <span>Cases</span>
          </div>
        </div>
        <div id="epi-readout" class="epi-hover-readout">Hover any week bar to inspect weekly onset counts (MW 1–${maxEpiWeek})</div>
        <div class="svg-scroll">
          <svg viewBox="0 0 ${svgW} ${svgH}" role="img" aria-label="Weekly dengue epidemic curve from Morbidity Week 1 to ${maxEpiWeek}">
            <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + innerH}" stroke="#334155" stroke-width="1" />
            ${epiTicksSvg}
            ${epiBarsSvg}
            <line x1="${pad.left}" y1="${pad.top + innerH}" x2="${svgW - pad.right}" y2="${pad.top + innerH}" stroke="#475569" stroke-width="1.2" />
            <text x="${(pad.left + innerW / 2).toFixed(1)}" y="${svgH - 3}" fill="#94a3b8" font-size="10" font-family="'DM Sans', system-ui, sans-serif" font-weight="700" text-anchor="middle">Morbidity Week (MW 1 – ${maxEpiWeek})</text>
          </svg>
        </div>
      </section>

      <!-- 2. Barangay Heatmap -->
      <section class="panel" aria-label="Barangay Heatmap">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Barangay Heatmap</h3>
            <p class="panel-subtitle mono">Pop. ${municipalPopDenominator.toLocaleString()} · Municipal AR ${municipalAttackRate.toFixed(2)}/1,000</p>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="heat-legend" aria-hidden="true">
              <span class="heat-legend-item"><span class="heat-box heat-0" style="border:1px solid rgba(255,255,255,0.1)"></span>0</span>
              <span class="heat-legend-item"><span class="heat-box heat-1"></span>1</span>
              <span class="heat-legend-item"><span class="heat-box heat-2"></span>2</span>
              <span class="heat-legend-item"><span class="heat-box heat-3"></span>3+</span>
            </div>
            <button type="button" id="brgy-toggle-btn" class="btn-toggle" aria-expanded="false">All ${barangayRows.length}</button>
          </div>
        </div>
        <div class="table-scroll">
          <table class="heatmap">
            <thead>
              <tr>
                <th>#</th>
                <th>Barangay</th>
                <th class="center">MW ${windowWeeks[0]}–${windowWeeks[windowWeeks.length - 1]}</th>
                <th class="right">Total Cases</th>
                <th class="right">Population 2026</th>
                <th class="right">Attack Rate / 1,000</th>
                <th>Level of Risk</th>
                <th class="right">Pareto</th>
              </tr>
            </thead>
            <tbody>
              ${barangayRowsHtml}
            </tbody>
          </table>
        </div>
      </section>

      <!-- 3. Case Pyramid -->
      <section class="panel" aria-label="Case Pyramid">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Case Pyramid</h3>
            <p id="pyr-subtitle" class="panel-subtitle mono">By 5-year age group &amp; sex · 2026 Pop. ${ARGAO_TOTAL_POPULATION_2026.toLocaleString()}</p>
          </div>
          <div class="seg-group" role="tablist" aria-label="Case pyramid display metric">
            <button type="button" class="seg-btn active" id="pyr-btn-cases" data-mode="cases">Cases</button>
            <button type="button" class="seg-btn" id="pyr-btn-rate" data-mode="rate">Rate / 1,000</button>
          </div>
        </div>

        <div class="pyramid-legend">
          <span class="pyr-legend-item">
            <span style="width:10px;height:10px;background:#2563eb;display:inline-block"></span>
            <span>Male ${totalMale} (${Math.round((totalMale / grandTotalDemo) * 100)}%) · Pop ${ARGAO_MALE_POPULATION_2026.toLocaleString()} · AR ${overallMaleRate.toFixed(2)}</span>
          </span>
          <span class="pyr-legend-item">
            <span style="width:10px;height:10px;background:#dc2626;display:inline-block"></span>
            <span>Female ${totalFemale} (${Math.round((totalFemale / grandTotalDemo) * 100)}%) · Pop ${ARGAO_FEMALE_POPULATION_2026.toLocaleString()} · AR ${overallFemaleRate.toFixed(2)}</span>
          </span>
        </div>

        <div class="pyr-axis">
          <div id="pyr-axis-left" class="pyr-axis-left">Male</div>
          <div class="pyr-axis-mid">Age</div>
          <div id="pyr-axis-right" class="pyr-axis-right">Female</div>
        </div>

        <div id="pyr-rows" class="pyr-rows"></div>
        <div id="pyr-readout" class="pyr-hover-readout">Hover any age cohort to inspect 2026 population &amp; sex-specific attack rates</div>
      </section>

      <!-- 4. Clinical & Case Classification -->
      <section class="panel" aria-label="Clinical and Case Classification">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Clinical &amp; Case Classification</h3>
            <p class="panel-subtitle">Severity spectrum, hospitalization &amp; PIDSR case classification</p>
          </div>
          <div style="text-align:right;" class="mono">
            <div style="font-size:12px;color:var(--text-muted);">Classified</div>
            <div style="font-size:14px;font-weight:700;color:#ffffff;">${severity.totalClassified.toLocaleString()}</div>
          </div>
        </div>

        <div class="gauge-band">
          <div class="gauge-left">
            <div class="gauge-svg-wrap">
              <svg viewBox="0 0 110 62" style="width:100%;height:100%;overflow:visible;" role="img" aria-label="Hospitalization Rate ${severity.hospitalizationRatePct.toFixed(1)}%">
                <path d="M 11 54 A 44 44 0 0 1 99 54" fill="none" stroke="#1e293b" stroke-width="10" stroke-linecap="round" />
                <path d="M 11 54 A 44 44 0 0 1 99 54" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round" stroke-dasharray="${semiCircumference.toFixed(2)}" stroke-dashoffset="${strokeDashoffset.toFixed(2)}" />
              </svg>
              <span class="gauge-pct">${severity.hospitalizationRatePct.toFixed(1)}%</span>
            </div>
            <div>
              <div style="font-size:12px;font-weight:600;color:#ffffff;">Hospitalization Rate (%)</div>
              <div class="mono" style="font-size:12px;color:var(--text-muted);margin-top:4px;">${severity.hospitalizedCount} admitted · ${severity.outpatientCount} outpatient</div>
            </div>
          </div>
          <div class="mono" style="font-size:12px;color:var(--text-muted);text-align:right;">
            <div>Warning + Severe</div>
            <div style="font-size:16px;font-weight:700;color:#fcd34d;margin-top:2px;">${warningPlusSeverePct}%</div>
          </div>
        </div>

        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
          <div class="spec-section">
            <div class="spec-head">
              <h4>Clinical Classification</h4>
              <span>DOH Severity Spectrum</span>
            </div>
            <div class="stacked-bar">
              ${clinicalRows.map(item => `<div style="width:${item.pct}%;background:${item.color};height:100%"></div>`).join('')}
            </div>
            ${clinicalRows
              .map(
                item => `<div>
                  <div class="bar-row-head">
                    <span style="color:#e2e8f0;font-weight:500;">${escapeHtml(item.label)}</span>
                    <span class="mono"><strong style="color:${item.textColor};">${item.count.toLocaleString()}</strong> <span style="color:var(--text-muted);font-size:11px;">(${item.pct.toFixed(1)}%)</span></span>
                  </div>
                  <div class="bar-track"><div style="width:${item.pct}%;background:${item.color};height:100%"></div></div>
                </div>`
              )
              .join('')}
          </div>

          <div class="spec-section">
            <div class="spec-head">
              <h4>Case Classification</h4>
              <span style="color:#6ee7b7;">${severity.confirmed.pct.toFixed(1)}% lab confirmed</span>
            </div>
            <div class="stacked-bar">
              ${caseClassRows.map(item => `<div style="width:${item.pct}%;background:${item.color};height:100%"></div>`).join('')}
            </div>
            ${caseClassRows
              .map(
                item => `<div>
                  <div class="bar-row-head">
                    <span style="color:#e2e8f0;font-weight:500;">${escapeHtml(item.label)}</span>
                    <span class="mono"><strong style="color:${item.textColor};">${item.count.toLocaleString()}</strong> <span style="color:var(--text-muted);font-size:11px;">(${item.pct.toFixed(1)}%)</span></span>
                  </div>
                  <div class="bar-track"><div style="width:${item.pct}%;background:${item.color};height:100%"></div></div>
                </div>`
              )
              .join('')}
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <span>Municipality of Argao · Municipal Epidemiology &amp; Surveillance Unit</span>
      <span>Dengue Surveillance Report · Anonymized Public Aggregate (RA 10173 Compliant)</span>
    </footer>
  </div>

  <script>
    (function() {
      var PYRAMID_DATA = ${safeJsonForScript(pyramidRows)};
      var TOTAL_POP = ${ARGAO_TOTAL_POPULATION_2026};
      var TOTAL_BRGY = ${barangayRows.length};
      var pyrMode = 'cases';

      // 1. Barangay Top 12 / All 45 toggle
      var brgyBtn = document.getElementById('brgy-toggle-btn');
      var showAllBrgy = false;
      if (brgyBtn) {
        brgyBtn.addEventListener('click', function() {
          showAllBrgy = !showAllBrgy;
          var extraRows = document.querySelectorAll('tr[data-extra-brgy="1"]');
          for (var i = 0; i < extraRows.length; i++) {
            extraRows[i].style.display = showAllBrgy ? '' : 'none';
          }
          brgyBtn.textContent = showAllBrgy ? 'Top 12' : 'All ' + TOTAL_BRGY;
          brgyBtn.setAttribute('aria-expanded', showAllBrgy ? 'true' : 'false');
        });
      }

      // 2. Epidemic Curve Hover Telemetry
      var epiReadout = document.getElementById('epi-readout');
      var epiCols = document.querySelectorAll('.epi-col');
      for (var c = 0; c < epiCols.length; c++) {
        (function(col) {
          col.addEventListener('mouseenter', function() {
            if (!epiReadout) return;
            var mw = col.getAttribute('data-mw');
            var cases = col.getAttribute('data-cases');
            epiReadout.textContent = 'Morbidity Week ' + mw + ': ' + cases + ' reported dengue case' + (cases === '1' ? '' : 's');
          });
        })(epiCols[c]);
      }

      // 3. Age-Sex Pyramid Render & Mode Toggle
      var pyrContainer = document.getElementById('pyr-rows');
      var pyrSubtitle = document.getElementById('pyr-subtitle');
      var pyrAxisL = document.getElementById('pyr-axis-left');
      var pyrAxisR = document.getElementById('pyr-axis-right');
      var pyrReadout = document.getElementById('pyr-readout');
      var btnCases = document.getElementById('pyr-btn-cases');
      var btnRate = document.getElementById('pyr-btn-rate');

      function renderPyramid() {
        if (!pyrContainer) return;
        var maxSide = pyrMode === 'rate' ? 0.1 : 1;
        for (var i = 0; i < PYRAMID_DATA.length; i++) {
          var row = PYRAMID_DATA[i];
          var mVal = pyrMode === 'rate' ? row.maleRate : row.male;
          var fVal = pyrMode === 'rate' ? row.femaleRate : row.female;
          if (mVal > maxSide) maxSide = mVal;
          if (fVal > maxSide) maxSide = fVal;
        }

        var html = '';
        for (var j = 0; j < PYRAMID_DATA.length; j++) {
          var r = PYRAMID_DATA[j];
          var mMetric = pyrMode === 'rate' ? r.maleRate : r.male;
          var fMetric = pyrMode === 'rate' ? r.femaleRate : r.female;
          var mPct = (mMetric / maxSide) * 82;
          var fPct = (fMetric / maxSide) * 82;
          var mLabel = mMetric > 0 ? '<span class="pyr-val-m">' + (pyrMode === 'rate' ? r.maleRate.toFixed(1) : r.male) + '</span>' : '';
          var fLabel = fMetric > 0 ? '<span class="pyr-val-f">' + (pyrMode === 'rate' ? r.femaleRate.toFixed(1) : r.female) + '</span>' : '';
          var tip = r.label + ' (Pop ' + r.totalPop.toLocaleString() + ' / ' + r.popPct.toFixed(2) + '%): Male ' + r.male + ' of ' + r.malePop.toLocaleString() + ' (' + r.maleRate.toFixed(2) + '/1k) · Female ' + r.female + ' of ' + r.femalePop.toLocaleString() + ' (' + r.femaleRate.toFixed(2) + '/1k)';

          html += '<div class="pyr-row" data-pyr-idx="' + j + '" title="' + tip.replace(/"/g, '&quot;') + '">' +
            '<div class="pyr-side-left">' + mLabel + '<div class="pyr-bar-male" style="width:' + mPct.toFixed(2) + '%"></div></div>' +
            '<div class="pyr-age">' + r.cohort + '</div>' +
            '<div class="pyr-side-right"><div class="pyr-bar-female" style="width:' + fPct.toFixed(2) + '%"></div>' + fLabel + '</div>' +
          '</div>';
        }
        pyrContainer.innerHTML = html;

        if (pyrSubtitle) {
          pyrSubtitle.textContent = pyrMode === 'cases'
            ? 'By 5-year age group & sex · 2026 Pop. ' + TOTAL_POP.toLocaleString()
            : 'Attack Rate / 1,000 Pop. · Base ' + TOTAL_POP.toLocaleString();
        }
        if (pyrAxisL) pyrAxisL.textContent = pyrMode === 'rate' ? 'Male AR / 1k' : 'Male';
        if (pyrAxisR) pyrAxisR.textContent = pyrMode === 'rate' ? 'Female AR / 1k' : 'Female';

        var rows = pyrContainer.querySelectorAll('.pyr-row');
        for (var k = 0; k < rows.length; k++) {
          (function(el) {
            el.addEventListener('mouseenter', function() {
              if (!pyrReadout) return;
              var item = PYRAMID_DATA[Number(el.getAttribute('data-pyr-idx'))];
              if (!item) return;
              pyrReadout.textContent = item.label + ': Male ' + item.male + ' (' + item.maleRate.toFixed(2) + '/1k) · Female ' + item.female + ' (' + item.femaleRate.toFixed(2) + '/1k) · Pop ' + item.totalPop.toLocaleString();
            });
          })(rows[k]);
        }
      }

      if (btnCases && btnRate) {
        btnCases.addEventListener('click', function() {
          pyrMode = 'cases';
          btnCases.className = 'seg-btn active';
          btnRate.className = 'seg-btn';
          renderPyramid();
        });
        btnRate.addEventListener('click', function() {
          pyrMode = 'rate';
          btnRate.className = 'seg-btn active';
          btnCases.className = 'seg-btn';
          renderPyramid();
        });
      }

      renderPyramid();
    })();
  </script>
</body>
</html>`;

  const byteSize =
    typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(html).length
      : html.length;

  return {
    html,
    byteSize,
    totalCases,
    coverageRange,
    asOfDate,
    barangayCount: barangayRows.length,
    riskCounts,
  };
}

export function triggerHTMLDownload(
  htmlContent: string,
  filename?: string
): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const resolvedName =
    filename || `argao_dengue_dashboard_google_sites_${dateStamp}.html`;
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', resolvedName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return resolvedName;
}
