import React, { useState } from 'react';
import {
  TrendingDown,
  BarChart3,
  HelpCircle,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { DatasetState, OutlierResult } from '../types';

interface OutlierAnalysisProps {
  state: DatasetState;
}

export const OutlierAnalysis: React.FC<OutlierAnalysisProps> = ({ state }) => {
  const [selectedColumnName, setSelectedColumnName] = useState<string>(
    state.outlierResults.find((o) => o.outlierCount > 0)?.column ||
      state.outlierResults[0]?.column ||
      ''
  );

  const selectedOutlier = state.outlierResults.find((o) => o.column === selectedColumnName);
  const selectedProfile = state.profiles.find((p) => p.name === selectedColumnName);

  const totalFlaggedOutliers = state.outlierResults.reduce((acc, curr) => acc + curr.outlierCount, 0);

  // Chart data: Outlier count per numeric feature
  const outlierBarData = state.outlierResults.map((o) => ({
    column: o.column,
    outlierCount: o.outlierCount,
    outlierPercentage: o.outlierPercentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header and Method Documentation */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-purple-400" />
            Outlier Detection via Interquartile Range (IQR)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detect numerical values in the extreme tails using Tukey’s robust non-parametric fencing method.
          </p>
        </div>

        {/* Formula Explainer Card */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">
              1. Interquartile Range (IQR)
            </span>
            <span className="text-cyan-400 font-bold text-sm block mt-1">
              IQR = Q3 - Q1
            </span>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">
              Spread of the middle 50% of sorted observations.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">
              2. Lower Bound Fence
            </span>
            <span className="text-purple-400 font-bold text-sm block mt-1">
              Lower = Q1 - 1.5 × IQR
            </span>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">
              Values below this threshold are flagged.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">
              3. Upper Bound Fence
            </span>
            <span className="text-purple-400 font-bold text-sm block mt-1">
              Upper = Q3 + 1.5 × IQR
            </span>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">
              Values above this threshold are flagged.
            </span>
          </div>
        </div>

        {/* Overall summary stats */}
        <div className="flex items-center gap-6 text-xs text-slate-300 pt-1">
          <div>
            Total Flagged Outliers:{' '}
            <strong className="text-purple-300 font-mono text-sm">{totalFlaggedOutliers}</strong>
          </div>
          <div>•</div>
          <div>
            Numeric Features Analyzed:{' '}
            <strong className="text-cyan-300 font-mono text-sm">{state.outlierResults.length}</strong>
          </div>
        </div>
      </div>

      {state.outlierResults.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
          No numeric columns detected in this dataset to perform IQR outlier fencing on.
        </div>
      ) : (
        <>
          {/* Outlier Counts Across Columns */}
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Flagged Outliers Across Numeric Columns
            </h3>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={outlierBarData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <XAxis dataKey="column" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any, props: any) => [
                      `${val} outliers (${props.payload.outlierPercentage}%)`,
                      'Outlier Count',
                    ]}
                  />
                  <Bar dataKey="outlierCount" radius={[4, 4, 0, 0]}>
                    {outlierBarData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.outlierCount > 0 ? '#a855f7' : '#10b981'}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => setSelectedColumnName(entry.column)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deep-Dive for Selected Numeric Column */}
          {selectedOutlier && selectedProfile?.numericSummary && (
            <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white font-mono">
                      Feature: "{selectedOutlier.column}"
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded font-semibold border ${
                        selectedOutlier.outlierCount > 0
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}
                    >
                      {selectedOutlier.outlierCount} Outliers ({selectedOutlier.outlierPercentage}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tukey fences: [{selectedOutlier.lowerBound}, {selectedOutlier.upperBound}].
                    Observations outside this interval are flagged below.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Select column:</span>
                  <select
                    value={selectedOutlier.column}
                    onChange={(e) => setSelectedColumnName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 outline-hidden font-mono"
                  >
                    {state.outlierResults.map((o) => (
                      <option key={o.column} value={o.column}>
                        {o.column} ({o.outlierCount} outliers)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Statistical Bounds Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Min</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedOutlier.min}</span>
                </div>
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/60">
                  <span className="text-purple-300 block text-[10px] font-sans uppercase">Lower Fence</span>
                  <span className="text-purple-300 text-sm font-bold">{selectedOutlier.lowerBound}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Q1 (25th)</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedOutlier.q1}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-cyan-400 block text-[10px] font-sans uppercase">Median (50th)</span>
                  <span className="text-cyan-400 text-sm font-bold">{selectedOutlier.median}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Q3 (75th)</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedOutlier.q3}</span>
                </div>
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/60">
                  <span className="text-purple-300 block text-[10px] font-sans uppercase">Upper Fence</span>
                  <span className="text-purple-300 text-sm font-bold">{selectedOutlier.upperBound}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Max</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedOutlier.max}</span>
                </div>
              </div>

              {/* Flagged Values List */}
              {selectedOutlier.outlierCount > 0 && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/60 space-y-2">
                  <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider block">
                    Flagged Outlier Observations ({selectedOutlier.outlierCount} items):
                  </span>
                  <div className="flex flex-wrap gap-2 font-mono text-xs">
                    {selectedOutlier.flaggedValues.map((val, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-950/80 text-rose-300 px-2.5 py-1 rounded border border-purple-800 shadow-xs"
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Histogram Distribution */}
              {selectedProfile.numericSummary.histogram.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Distribution Histogram for "{selectedOutlier.column}"
                  </span>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedProfile.numericSummary.histogram}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <XAxis
                          dataKey="bin"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* CRITICAL EDUCATIONAL GUIDELINES */}
              <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2 text-slate-300">
                <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Crucial Data Science Best Practices on Outliers:
                </span>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-[11px]">
                  <li>
                    <strong className="text-slate-200">Never automatically prune or delete outliers:</strong> Outliers are often real, informative observations (e.g., enterprise clients, fraud attacks, rare meteorological events). Blind deletion removes the most important learning signal.
                  </li>
                  <li>
                    <strong className="text-slate-200">Distinguish Measurement Errors from Extreme Signals:</strong> An age of -5 or 142 is physically impossible (data entry error). An annual income of $2,850,000 is mathematically valid (wealthy individual). Only correct or discard verified errors.
                  </li>
                  <li>
                    <strong className="text-slate-200">IQR Limitation on Heavy Tails:</strong> The 1.5× IQR heuristic assumes roughly symmetric, bell-shaped distributions. For power-law, Pareto, or log-normal distributions, it naturally flags valid heavy tails.
                  </li>
                  <li>
                    <strong className="text-slate-200">Mitigation:</strong> Rather than dropping rows, use non-linear models (Decision Trees, Gradient Boosting) or consider log/quantile transformations.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
