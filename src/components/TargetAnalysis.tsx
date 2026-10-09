import React from 'react';
import {
  Target,
  BarChart2,
  PieChart,
  Scale,
  AlertTriangle,
  Lightbulb,
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
import { DatasetState } from '../types';
import { analyzeTargetColumn } from '../utils/targetAnalyzer';

interface TargetAnalysisProps {
  state: DatasetState;
  onTargetChange: (newTarget: string) => void;
}

export const TargetAnalysis: React.FC<TargetAnalysisProps> = ({
  state,
  onTargetChange,
}) => {
  const currentTargetCol = state.targetColumn || state.headers[state.headers.length - 1];
  const targetResult = state.targetAnalysis || analyzeTargetColumn(currentTargetCol, state.rawRows, state.profiles);

  const getSeverityBadgeClass = (sev: string = 'Balanced') => {
    switch (sev) {
      case 'Balanced':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'Mild Imbalance':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800';
      case 'Moderate Imbalance':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'Severe Imbalance':
        return 'bg-rose-950/80 text-rose-400 border-rose-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const barColors = ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Top Banner and Selector */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Target Variable & Class Imbalance Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Designate your machine learning target (dependent variable) to evaluate class distributions and metric skewness.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <label className="text-xs text-slate-400 font-medium">Designate Target:</label>
            <select
              value={currentTargetCol}
              onChange={(e) => onTargetChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1 outline-hidden font-mono"
            >
              {state.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <span className="text-slate-400">Target Feature:</span>
          <span className="font-mono text-purple-300 font-semibold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800">
            "{targetResult.column}"
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Type:</span>
          <span className="font-mono text-cyan-300">
            {targetResult.isContinuous ? 'Continuous (Regression)' : 'Discrete (Classification)'}
          </span>
          {!targetResult.isContinuous && targetResult.imbalanceSeverity && (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Status:</span>
              <span className={`px-2 py-0.5 rounded border font-semibold ${getSeverityBadgeClass(targetResult.imbalanceSeverity)}`}>
                {targetResult.imbalanceSeverity}
              </span>
            </>
          )}
        </div>
      </div>

      {/* REGRESSION TARGET VIEW */}
      {targetResult.isContinuous && targetResult.regressionSummary ? (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              Continuous Target Detected (Regression Task)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target has {targetResult.uniqueCount} distinct continuous values. Classification class imbalance formulas are skipped in favor of continuous spread metrics.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Min</span>
              <span className="text-slate-200 text-sm font-semibold">{targetResult.regressionSummary.min}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Mean</span>
              <span className="text-slate-200 text-sm font-semibold">{targetResult.regressionSummary.mean}</span>
            </div>
            <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800">
              <span className="text-purple-300 block text-[10px] uppercase font-sans">Median</span>
              <span className="text-cyan-400 text-sm font-bold">{targetResult.regressionSummary.median}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Max</span>
              <span className="text-slate-200 text-sm font-semibold">{targetResult.regressionSummary.max}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">StdDev</span>
              <span className="text-slate-200 text-sm font-semibold">{targetResult.regressionSummary.stdDev}</span>
            </div>
          </div>

          {/* Recommendations for regression */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/60 space-y-2 text-xs">
            <h4 className="font-semibold text-purple-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              Regression Modeling Recommendations:
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              {targetResult.recommendedActions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* CLASSIFICATION TARGET VIEW */
        <div className="space-y-6">
          {/* Key Imbalance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-slate-500 block">Unique Classes</span>
              <span className="font-mono text-xl font-bold text-white mt-1 block">
                {targetResult.uniqueCount}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-slate-500 block">Majority Class Share</span>
              <span className="font-mono text-xl font-bold text-purple-300 mt-1 block">
                {targetResult.majorityClass?.percentage}%
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Class "{targetResult.majorityClass?.label}"
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-slate-500 block">Minority Class Share</span>
              <span className="font-mono text-xl font-bold text-cyan-400 mt-1 block">
                {targetResult.minorityClass?.percentage}%
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Class "{targetResult.minorityClass?.label}"
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-slate-500 block">Class Imbalance Ratio</span>
              <span className="font-mono text-xl font-bold text-amber-400 mt-1 block">
                {targetResult.imbalanceRatio} : 1
              </span>
              <span className="text-[11px] text-slate-500">
                Majority / Minority
              </span>
            </div>
          </div>

          {/* Distribution Chart & Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                Class Frequency Distribution
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={targetResult.classDistribution || []}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  >
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, props: any) => [
                        `${val} records (${props.payload.percentage}%)`,
                        'Count',
                      ]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(targetResult.classDistribution || []).map((_, idx) => (
                        <Cell key={`bar-${idx}`} fill={barColors[idx % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white">Class Breakdown Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Class Label</th>
                      <th className="p-2 text-right">Count</th>
                      <th className="p-2 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {targetResult.classDistribution?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-semibold text-slate-200">
                          "{item.label}"
                        </td>
                        <td className="p-2 text-right text-slate-300">
                          {item.count.toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-purple-300">
                          {item.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Actionable Strategy and Resampling Safeguard */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              Machine Learning Imbalance Guidelines
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-slate-300">
                <span className="font-semibold text-purple-300 block">Recommended Modeling Techniques:</span>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-[11px]">
                  {targetResult.recommendedActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/60 space-y-2 text-rose-300 text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Crucial Resampling Safeguard:
                </span>
                <p className="text-[11px] leading-relaxed text-rose-300/90">
                  If using synthetic oversampling techniques like <strong>SMOTE</strong> or <strong>ADASYN</strong>, apply them <strong>exclusively to training splits</strong> within cross-validation folds. Never resample the validation or test sets. Applying SMOTE before splitting duplicates synthetic patterns into test data, creating severe artificial test performance inflation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
