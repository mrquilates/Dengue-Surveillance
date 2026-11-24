import React, { useMemo } from 'react';
import { SurveillanceRecord } from '../types/surveillance';
import { calculateFullYearEpiChannel, FullYearEpiWeekPoint } from '../utils/epidemiology';

interface CDCEpiCurveProps {
  records: SurveillanceRecord[];
  maxWeek?: number;
}

export const CDCEpiCurve: React.FC<CDCEpiCurveProps> = ({
  records,
  maxWeek = 46,
}) => {
  const channelData: FullYearEpiWeekPoint[] = useMemo(() => {
    return calculateFullYearEpiChannel(records, maxWeek);
  }, [records, maxWeek]);

  const yMax = useMemo(() => {
    const maxObserved = Math.max(...channelData.map(d => d.cases), 1);
    return Math.ceil(maxObserved * 1.18);
  }, [channelData]);

  const coverageLabel = useMemo(() => {
    const validDates = records
      .filter(r => !r.isDuplicate && r.dateOnset)
      .map(r => r.dateOnset)
      .sort();
    if (validDates.length === 0) return `Jan – Nov, ${new Date().getFullYear()}`;
    const start = new Date(`${validDates[0]}T00:00:00`);
    const end = new Date(`${validDates[validDates.length - 1]}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Jan – Nov 21, 2026';
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [records]);

  const width = 920;
  const height = 290;
  const pad = { top: 22, right: 16, bottom: 48, left: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const slotW = innerW / channelData.length;

  const getY = (val: number) => pad.top + innerH - (val / yMax) * innerH;

  return (
    <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between h-full print-break-inside">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Epidemic Curve
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
            Weekly cases by onset of symptoms · {coverageLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 shrink-0">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 bg-[#1e3a8a] border border-blue-500/60 inline-block" />
            <span>Cases</span>
          </span>
        </div>
      </div>

      {/* SVG Epidemic Curve */}
      <div className="mt-3 flex-1 flex items-center w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '640px' }}
          role="img"
          aria-label="Weekly dengue epidemic curve from Morbidity Week 1 to 46"
        >
          <line
            x1={pad.left}
            y1={pad.top}
            x2={pad.left}
            y2={pad.top + innerH}
            stroke="#334155"
            strokeWidth="1"
          />
          {[0, Math.round(yMax / 2), yMax].map((tickVal, idx) => {
            const y = getY(tickVal);
            return (
              <g key={idx}>
                <line
                  x1={pad.left - 4}
                  y1={y}
                  x2={pad.left}
                  y2={y}
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 7}
                  y={y + 3}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="end"
                >
                  {tickVal}
                </text>
              </g>
            );
          })}

          {channelData.map((d, idx) => {
            const x = pad.left + idx * slotW;
            const barH = (d.cases / yMax) * innerH;
            const y = pad.top + innerH - barH;

            return (
              <g key={d.mw}>
                <title>
                  {`MW ${d.mw}: ${d.cases} case(s)`}
                </title>

                {d.cases > 0 && (
                  <>
                    <rect
                      x={x}
                      y={y}
                      width={slotW}
                      height={barH}
                      fill="#1e3a8a"
                      stroke="#0b0c0e"
                      strokeWidth="0.4"
                    />
                    <text
                      x={x + slotW / 2}
                      y={y - 4}
                      fill="#e2e8f0"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {d.cases}
                    </text>
                  </>
                )}

                <text
                  x={x + slotW / 2}
                  y={pad.top + innerH + 14}
                  fill="#94a3b8"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {d.mw}
                </text>

                {d.monthLabel && (
                  <text
                    x={x + slotW / 2}
                    y={pad.top + innerH + 30}
                    fill="#cbd5e1"
                    fontSize="9"
                    fontFamily="DM Sans, sans-serif"
                    fontWeight="600"
                    textAnchor="start"
                  >
                    {d.monthLabel}
                  </text>
                )}
              </g>
            );
          })}

          <line
            x1={pad.left}
            y1={pad.top + innerH}
            x2={width - pad.right}
            y2={pad.top + innerH}
            stroke="#475569"
            strokeWidth="1.2"
          />

          <text
            x={pad.left + innerW / 2}
            y={height - 3}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="DM Sans, sans-serif"
            fontWeight="bold"
            textAnchor="middle"
            className="font-bold text-center"
          >
            Morbidity Week (MW 1 – {maxWeek})
          </text>
        </svg>
      </div>
    </div>
  );
};
