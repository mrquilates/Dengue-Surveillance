import React, { useMemo } from 'react';
import { SurveillanceRecord, STANDARD_AGE_GROUPS } from '../types/surveillance';

interface AgeSexPyramidProps {
  records: SurveillanceRecord[];
}

export const AgeSexPyramid: React.FC<AgeSexPyramidProps> = ({ records }) => {
  const pyramidRows = useMemo(() => {
    const valid = records.filter(r => !r.isDuplicate);
    const orderedBottomToTop = [...STANDARD_AGE_GROUPS];
    const topToBottom = [...orderedBottomToTop].reverse();

    return topToBottom.map(cohort => {
      const cohortRecords = valid.filter(r => r.ageGroup === cohort);
      const male = cohortRecords.filter(r => r.sex === 'M' || r.sex === 'Male').length;
      const female = cohortRecords.filter(r => r.sex === 'F' || r.sex === 'Female').length;
      return {
        cohort,
        male,
        female,
        total: male + female,
      };
    });
  }, [records]);

  const maxSideVal = useMemo(() => {
    return Math.max(...pyramidRows.map(r => Math.max(r.male, r.female)), 1);
  }, [pyramidRows]);

  const totalMale = useMemo(() => pyramidRows.reduce((acc, r) => acc + r.male, 0), [pyramidRows]);
  const totalFemale = useMemo(() => pyramidRows.reduce((acc, r) => acc + r.female, 0), [pyramidRows]);
  const grandTotal = totalMale + totalFemale || 1;

  return (
    <div className="p-5 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-col justify-between h-full print-break-inside">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Case Pyramid
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            By age group and sex
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300 shrink-0">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 bg-blue-600 inline-block" />
            <span>Male {totalMale} ({Math.round((totalMale / grandTotal) * 100)}%)</span>
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 bg-red-600 inline-block" />
            <span>Female {totalFemale} ({Math.round((totalFemale / grandTotal) * 100)}%)</span>
          </span>
        </div>
      </div>

      {/* Column Axis Headers */}
      <div className="flex items-center text-[11px] font-mono text-slate-400 pt-3 pb-1.5">
        <div className="flex-1 text-right pr-2">Male</div>
        <div className="w-14 text-center font-semibold text-slate-300">Age</div>
        <div className="flex-1 text-left pl-2">Female</div>
      </div>

      {/* Bilateral Pyramid Stack */}
      <div className="flex-1 flex flex-col justify-center">
        {pyramidRows.map(row => {
          const malePct = (row.male / maxSideVal) * 85;
          const femalePct = (row.female / maxSideVal) * 85;

          return (
            <div
              key={row.cohort}
              className="flex items-center h-6.5"
              title={`Age ${row.cohort}: ${row.male} Male, ${row.female} Female`}
            >
              <div className="flex-1 flex justify-end items-center h-full">
                {row.male > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-blue-300 pr-1.5 font-semibold">
                    {row.male}
                  </span>
                )}
                <div
                  style={{ width: `${malePct}%` }}
                  className="h-full bg-blue-600 border-b border-[#0b0c0e]/70"
                />
              </div>

              <div className="w-14 text-center text-[11px] font-mono font-semibold text-slate-200 shrink-0 select-none">
                {row.cohort}
              </div>

              <div className="flex-1 flex justify-start items-center h-full">
                <div
                  style={{ width: `${femalePct}%` }}
                  className="h-full bg-red-600 border-b border-[#0b0c0e]/70"
                />
                {row.female > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-red-300 pl-1.5 font-semibold">
                    {row.female}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
