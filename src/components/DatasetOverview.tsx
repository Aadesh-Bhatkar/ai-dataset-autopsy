import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Copy,
  AlertOctagon,
  TrendingDown,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DatasetState } from '../types';

interface DatasetOverviewProps {
  state: DatasetState;
  onNavigate: (tab: any) => void;
}

export const DatasetOverview: React.FC<DatasetOverviewProps> = ({ state, onNavigate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [inspectedColumn, setInspectedColumn] = useState<string>(state.headers[0] || '');

  const totalPages = Math.ceil(state.totalRows / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const currentRows = state.rawRows.slice(startIdx, startIdx + pageSize);

  const inspectedProfile = state.profiles.find((p) => p.name === inspectedColumn);
  const totalOutliers = state.outlierResults.reduce((a, b) => a + b.outlierCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Quality Score Banner */}
      <div className="p-6 rounded-xl bg-linear-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
              AUDIT COMPLETE
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> {state.analysisTimeMs} ms
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-mono tracking-tight">
            {state.filename}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Investigated {state.totalRows.toLocaleString()} rows across {state.totalColumns} features locally in memory.
          </p>
        </div>

        {/* Quality Score Meter */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Data Quality Score
            </span>
            <span className="text-xs font-medium text-slate-300">
              Rating: <strong className={
                state.qualityScore.rating === 'Excellent' ? 'text-emerald-400' :
                state.qualityScore.rating === 'Good' ? 'text-cyan-400' :
                state.qualityScore.rating === 'Fair' ? 'text-amber-400' : 'text-rose-400'
              }>{state.qualityScore.rating}</strong>
            </span>
          </div>
          <div className="relative flex items-center justify-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold font-mono border-2 ${
              state.qualityScore.overallScore >= 80
                ? 'border-emerald-500/80 text-emerald-400 bg-emerald-950/40'
                : state.qualityScore.overallScore >= 65
                ? 'border-cyan-500/80 text-cyan-400 bg-cyan-950/40'
                : state.qualityScore.overallScore >= 50
                ? 'border-amber-500/80 text-amber-400 bg-amber-950/40'
                : 'border-rose-500/80 text-rose-400 bg-rose-950/40'
            }`}>
              {state.qualityScore.overallScore}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Rows */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Rows</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {state.totalRows.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">100% indexed</span>
        </div>

        {/* Total Columns */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Columns</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {state.totalColumns}
          </div>
          <span className="text-[11px] text-slate-500">All types profiled</span>
        </div>

        {/* Duplicate Rows */}
        <div
          onClick={() => onNavigate('duplicates')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-600/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Duplicate Rows</span>
            <Copy className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-xl font-bold font-mono ${state.duplicateResult.duplicateCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {state.duplicateResult.duplicateCount}
          </div>
          <span className="text-[11px] text-slate-500">
            {state.duplicateResult.duplicatePercentage}% of dataset
          </span>
        </div>

        {/* Missing Cells */}
        <div
          onClick={() => onNavigate('missing')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-600/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Missing Cells</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-xl font-bold font-mono ${state.missingSummary.totalMissingCells > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {state.missingSummary.totalMissingCells.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">
            {state.missingSummary.missingRate}% missing rate
          </span>
        </div>

        {/* Cols with Missing */}
        <div
          onClick={() => onNavigate('missing')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-600/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Incomplete Cols</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {state.missingSummary.columnsWithMissing} <span className="text-xs text-slate-500 font-normal">/ {state.totalColumns}</span>
          </div>
          <span className="text-[11px] text-slate-500">Require imputation</span>
        </div>

        {/* Potential Outliers */}
        <div
          onClick={() => onNavigate('outliers')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-600/50 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Flagged Outliers</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-xl font-bold font-mono ${totalOutliers > 0 ? 'text-purple-300' : 'text-emerald-400'}`}>
            {totalOutliers}
          </div>
          <span className="text-[11px] text-slate-500">Via 1.5× IQR test</span>
        </div>
      </div>

      {/* Interactive Table Preview & Column Inspector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Dataset Records Preview</h3>
            <span className="text-xs text-slate-500 font-mono">
              Showing rows {startIdx + 1} to {Math.min(startIdx + pageSize, state.totalRows)} of {state.totalRows.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Rows per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-hidden"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-mono">
                <th className="py-2.5 px-3 border-r border-slate-800/80 w-12 text-center text-slate-500">
                  #
                </th>
                {state.headers.map((h) => {
                  const prof = state.profiles.find((p) => p.name === h);
                  return (
                    <th
                      key={h}
                      onClick={() => setInspectedColumn(h)}
                      className={`py-2.5 px-3 whitespace-nowrap cursor-pointer hover:bg-slate-900 transition ${
                        inspectedColumn === h ? 'text-purple-300 bg-purple-950/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{h}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-sans font-normal">
                          ({prof?.inferredType.slice(0, 3)})
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {currentRows.map((row, rIdx) => {
                const globalRowIdx = startIdx + rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 border-r border-slate-800/80 text-center text-slate-500">
                      {globalRowIdx}
                    </td>
                    {state.headers.map((h) => {
                      const val = row[h];
                      const isNull = val === null || val === undefined || String(val).trim() === '';
                      return (
                        <td
                          key={h}
                          className={`py-2 px-3 whitespace-nowrap ${
                            inspectedColumn === h ? 'bg-purple-950/10' : ''
                          }`}
                        >
                          {isNull ? (
                            <span className="text-rose-400/80 italic text-[11px] bg-rose-950/30 px-1 rounded">
                              null
                            </span>
                          ) : (
                            <span className="text-slate-300">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Column Deep-Inspection Panel */}
      {inspectedProfile && (
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Inspecting Column: <span className="font-mono text-purple-300">"{inspectedProfile.name}"</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                {inspectedProfile.inferredType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Select column:</label>
              <select
                value={inspectedColumn}
                onChange={(e) => setInspectedColumn(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 outline-hidden"
              >
                {state.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Non-Missing Values</span>
              <span className="font-mono text-slate-200 font-semibold mt-0.5 block">
                {inspectedProfile.nonMissingCount.toLocaleString()} / {state.totalRows.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Missing Cells</span>
              <span className={`font-mono font-semibold mt-0.5 block ${inspectedProfile.missingCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {inspectedProfile.missingCount} ({inspectedProfile.missingPercentage}%)
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Unique Values</span>
              <span className="font-mono text-slate-200 font-semibold mt-0.5 block">
                {inspectedProfile.uniqueCount.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Quality Status</span>
              <span className={`font-mono font-semibold mt-0.5 block ${
                inspectedProfile.qualityStatus === 'Good' ? 'text-emerald-400' :
                inspectedProfile.qualityStatus === 'Warning' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {inspectedProfile.qualityStatus}
              </span>
            </div>
          </div>

          {/* Type-Specific Details */}
          {inspectedProfile.numericSummary && (
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Numeric Distribution Metrics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 font-mono text-xs">
                <div><span className="text-slate-500 block text-[10px]">Min</span><span className="text-slate-200">{inspectedProfile.numericSummary.min}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Q1 (25%)</span><span className="text-slate-200">{inspectedProfile.numericSummary.q1}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Median</span><span className="text-cyan-400 font-semibold">{inspectedProfile.numericSummary.median}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Mean</span><span className="text-slate-200">{inspectedProfile.numericSummary.mean}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Q3 (75%)</span><span className="text-slate-200">{inspectedProfile.numericSummary.q3}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Max</span><span className="text-slate-200">{inspectedProfile.numericSummary.max}</span></div>
                <div><span className="text-slate-500 block text-[10px]">StdDev</span><span className="text-slate-200">{inspectedProfile.numericSummary.stdDev}</span></div>
                <div><span className="text-slate-500 block text-[10px]">IQR</span><span className="text-purple-300">{inspectedProfile.numericSummary.iqr}</span></div>
              </div>
            </div>
          )}

          {inspectedProfile.categoricalSummary && (
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Top Value Frequencies
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {inspectedProfile.categoricalSummary.topValues.slice(0, 6).map((tv, idx) => (
                  <span key={idx} className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                    <strong className="text-white font-mono">"{tv.value}"</strong>: {tv.count} ({tv.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
