import React, { useState } from 'react';
import { Users2, UserCheck, ShieldAlert, PieChart, BarChart3, HelpCircle } from 'lucide-react';
import { DemographicStats, AgeGroup } from '../types/surveillance';

interface DemographicsAnalysisProps {
  stats: DemographicStats;
  totalCases: number;
}

type PyramidMode = 'total' | 'hospitalized' | 'deaths';

export const DemographicsAnalysis: React.FC<DemographicsAnalysisProps> = ({ stats, totalCases }) => {
  const [pyramidMode, setPyramidMode] = useState<PyramidMode>('total');

  // Find max value in age groups for pyramid scaling
  const maxBarValue = Math.max(
    ...stats.ageGroups.map(ag => {
      if (pyramidMode === 'hospitalized') {
        return Math.max(ag.maleHospitalized, ag.femaleHospitalized);
      }
      if (pyramidMode === 'deaths') {
        return Math.max(ag.maleDeaths, ag.femaleDeaths);
      }
      return Math.max(ag.male, ag.female);
    }),
    1
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users2 className="w-4 h-4 text-cyan-400" />
              Descriptive Epidemiology: Person & Demographics
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
              Host Factors
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Bilateral Age-Sex Population Pyramid and biometric distribution across 10 surveillance age cohorts.
          </p>
        </div>

        {/* Pyramid Mode Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setPyramidMode('total')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              pyramidMode === 'total' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Total Cases
          </button>
          <button
            onClick={() => setPyramidMode('hospitalized')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              pyramidMode === 'hospitalized' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hospitalizations
          </button>
          <button
            onClick={() => setPyramidMode('deaths')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              pyramidMode === 'deaths' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mortality (Deaths)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Age-Sex Pyramid (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold mb-3 border-b border-slate-800 pb-2">
            <span className="text-cyan-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              MALE ({stats.sexDistribution.male} cases • {stats.sexDistribution.malePct}%)
            </span>
            <span className="text-slate-400 font-mono text-[11px]">AGE COHORT</span>
            <span className="text-rose-400 flex items-center gap-1.5">
              FEMALE ({stats.sexDistribution.female} cases • {stats.sexDistribution.femalePct}%)
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            </span>
          </div>

          {/* Pyramid Rows */}
          <div className="space-y-1.5 py-1">
            {stats.ageGroups
              .slice()
              .reverse()
              .map(ag => {
                let mVal = ag.male;
                let fVal = ag.female;
                if (pyramidMode === 'hospitalized') {
                  mVal = ag.maleHospitalized;
                  fVal = ag.femaleHospitalized;
                } else if (pyramidMode === 'deaths') {
                  mVal = ag.maleDeaths;
                  fVal = ag.femaleDeaths;
                }

                const mPct = (mVal / maxBarValue) * 100;
                const fPct = (fVal / maxBarValue) * 100;

                return (
                  <div key={ag.group} className="flex items-center text-xs group">
                    {/* Left: Male Bar */}
                    <div className="flex-1 flex items-center justify-end pr-2">
                      <span className="text-[10px] font-mono text-cyan-300 mr-2 opacity-80 group-hover:opacity-100">
                        {mVal > 0 ? mVal : ''}
                      </span>
                      <div className="w-full bg-slate-900 h-5 rounded-l flex justify-end overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-l transition-all duration-300 group-hover:bg-cyan-400"
                          style={{ width: `${mPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Center: Age Group Label */}
                    <div className="w-16 text-center font-mono font-bold text-[11px] text-slate-300 py-0.5 bg-slate-900 border-x border-slate-800 rounded">
                      {ag.group}
                    </div>

                    {/* Right: Female Bar */}
                    <div className="flex-1 flex items-center justify-start pl-2">
                      <div className="w-full bg-slate-900 h-5 rounded-r overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-r transition-all duration-300 group-hover:bg-rose-400"
                          style={{ width: `${fPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-rose-300 ml-2 opacity-80 group-hover:opacity-100">
                        {fVal > 0 ? fVal : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Pyramid Bottom Note */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Mode: {pyramidMode.toUpperCase()}</span>
            <span>Dominant Risk: Children 5–14 Years</span>
          </div>
        </div>

        {/* Biometric Summary & Outcome by Age (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Age Statistics & Clinical Outcomes</span>
              <span className="text-[10px] font-mono text-cyan-400">N = {totalCases}</span>
            </h4>

            {/* Age Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Mean Age</span>
                <span className="text-lg font-bold font-mono text-white">{stats.meanAge} yrs</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Median Age</span>
                <span className="text-lg font-bold font-mono text-cyan-400">{stats.medianAge} yrs</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Age Range (Min–Max)</span>
                <span className="text-sm font-bold font-mono text-white">
                  {stats.minAge} to {stats.maxAge} yrs
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Interquartile Range (IQR)</span>
                <span className="text-sm font-bold font-mono text-purple-400">{stats.iqr} yrs</span>
              </div>
            </div>

            {/* Outcome by Age Group Heatmap Table */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Case Fatality & Hospitalization by Cohort
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                      <th className="py-1">Group</th>
                      <th className="py-1 text-right">Cases</th>
                      <th className="py-1 text-right">Admit %</th>
                      <th className="py-1 text-right">Deaths</th>
                      <th className="py-1 text-right">CFR %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ageGroups
                      .filter(ag => ag.total > 0)
                      .slice(0, 7)
                      .map(ag => {
                        const admitRate = ag.total > 0 ? Math.round((ag.hospitalized / ag.total) * 100) : 0;
                        return (
                          <tr key={ag.group} className="border-b border-slate-900 hover:bg-slate-900/60">
                            <td className="py-1 text-white font-medium">{ag.group} yrs</td>
                            <td className="py-1 text-right text-slate-300">{ag.total}</td>
                            <td className="py-1 text-right text-purple-300">{admitRate}%</td>
                            <td className="py-1 text-right text-rose-400">{ag.deaths}</td>
                            <td className="py-1 text-right font-bold text-rose-300">{ag.cfr}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Surveillance Guideline: Prioritize pediatric fluid resuscitation.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
