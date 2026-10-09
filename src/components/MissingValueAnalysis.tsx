import React, { useState } from 'react';
import {
  AlertOctagon,
  BarChart2,
  CheckCircle2,
  Lightbulb,
  Info,
  ShieldCheck,
  HelpCircle
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
import { DatasetState, MissingValueDetail } from '../types';

interface MissingValueAnalysisProps {
  state: DatasetState;
}

export const MissingValueAnalysis: React.FC<MissingValueAnalysisProps> = ({ state }) => {
  const [selectedColumnName, setSelectedColumnName] = useState<string>(
    state.missingSummary.details.find((d) => d.missingCount > 0)?.column ||
      state.missingSummary.details[0]?.column ||
      ''
  );

  const selectedDetail = state.missingSummary.details.find((d) => d.column === selectedColumnName);

  // Prepare chart data (sort descending by missing rate)
  const chartData = [...state.missingSummary.details]
    .sort((a, b) => b.missingPercentage - a.missingPercentage)
    .map((d) => ({
      column: d.column,
      missingPercentage: d.missingPercentage,
      missingCount: d.missingCount,
      severity: d.severity,
    }));

  const getSeverityBadgeClass = (severity: MissingValueDetail['severity']) => {
    switch (severity) {
      case 'No Missing Values':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'Low Missingness':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800';
      case 'Moderate Missingness':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'High Missingness':
        return 'bg-rose-950/80 text-rose-400 border-rose-800';
    }
  };

  const getBarColor = (percentage: number) => {
    if (percentage === 0) return '#10b981';
    if (percentage < 5) return '#06b6d4';
    if (percentage <= 20) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary Stats */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            Missing Value Investigation & Imputation Guidance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze missing cell distribution, classify severity thresholds, and explore domain-appropriate imputation treatments.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Total Missing Cells</span>
            <span className="font-mono text-base font-bold text-rose-400 mt-1 block">
              {state.missingSummary.totalMissingCells.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Dataset Missingness Rate</span>
            <span className="font-mono text-base font-bold text-white mt-1 block">
              {state.missingSummary.missingRate}%
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Incomplete Features</span>
            <span className="font-mono text-base font-bold text-amber-400 mt-1 block">
              {state.missingSummary.columnsWithMissing} / {state.totalColumns}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Complete Features (100%)</span>
            <span className="font-mono text-base font-bold text-emerald-400 mt-1 block">
              {state.totalColumns - state.missingSummary.columnsWithMissing} / {state.totalColumns}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart of Missing Percentage per Column */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Missing Percentage by Feature
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> 0% None</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-cyan-500" /> &lt;5% Low</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> 5-20% Moderate</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-rose-500" /> &gt;20% High</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
            >
              <XAxis
                type="number"
                unit="%"
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="column"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any, props: any) => [
                  `${val}% (${props.payload.missingCount} missing cells)`,
                  'Missing Rate',
                ]}
              />
              <Bar dataKey="missingPercentage" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.missingPercentage)}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => setSelectedColumnName(entry.column)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-slate-500 italic">
          * Note: Severity thresholds (Low &lt;5%, Moderate 5-20%, High &gt;20%) are configurable heuristic guidelines, not universal data science laws.
        </p>
      </div>

      {/* Selected Feature Detailed Treatment Card */}
      {selectedDetail && (
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white font-mono">
                Column Investigation: "{selectedDetail.column}"
              </h3>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded border font-semibold ${getSeverityBadgeClass(
                  selectedDetail.severity
                )}`}
              >
                {selectedDetail.severity}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Select Feature:</span>
              <select
                value={selectedDetail.column}
                onChange={(e) => setSelectedColumnName(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 outline-hidden font-mono"
              >
                {state.missingSummary.details.map((d) => (
                  <option key={d.column} value={d.column}>
                    {d.column} ({d.missingPercentage}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Stat recap */}
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Missingness Profile
              </span>
              <div className="space-y-1 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span>Inferred Type:</span>
                  <span className="text-purple-300">{selectedDetail.inferredType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing Count:</span>
                  <span className="text-rose-400 font-semibold">{selectedDetail.missingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing Percentage:</span>
                  <span className="text-rose-400 font-semibold">{selectedDetail.missingPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Imputation Recommendation */}
            <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-800/60 space-y-2">
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                Recommended Treatment Strategy
              </span>
              <p className="text-xs font-semibold text-slate-100">
                {selectedDetail.recommendedTreatment}
              </p>
              <p className="text-xs text-slate-300/90 leading-relaxed">
                {selectedDetail.treatmentRationale}
              </p>
            </div>
          </div>

          {/* Educational Concept Box */}
          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Educational Context: The 3 Missing Data Mechanisms
            </span>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              <li><strong>MCAR (Missing Completely at Random):</strong> Missingness is entirely independent of observed and unobserved data (e.g., random coin flip or sensor glitch). Removing rows introduces little bias.</li>
              <li><strong>MAR (Missing at Random):</strong> Missingness depends on other observed features (e.g., younger respondents less likely to report income). Imputation using correlated predictors works well.</li>
              <li><strong>MNAR (Missing Not at Random):</strong> Missingness depends on the value itself (e.g., high-income earners refuse to disclose income). Deleting or naive mean-filling causes severe systematic bias. Consider explicit "Missing" flags.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
