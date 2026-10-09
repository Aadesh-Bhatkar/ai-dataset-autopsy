import React, { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Layers,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { DatasetState } from '../types';
import { detectDuplicates, removeDuplicatesCopy } from '../utils/duplicateDetector';
import { downloadCleanedCSV } from '../utils/reportGenerator';

interface DuplicateAnalysisProps {
  state: DatasetState;
  onUpdateCleanedRows: (cleaned: Record<string, any>[], historyMsg: string) => void;
}

export const DuplicateAnalysis: React.FC<DuplicateAnalysisProps> = ({
  state,
  onUpdateCleanedRows,
}) => {
  const [useAllColumns, setUseAllColumns] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(state.headers);
  const [cleanedSuccessMsg, setCleanedSuccessMsg] = useState<string | null>(null);

  // Recalculate duplicates dynamically based on selected columns
  const activeColumns = useAllColumns ? state.headers : selectedColumns;
  const duplicateResult = detectDuplicates(state.rawRows, activeColumns);

  const toggleColumn = (col: string) => {
    if (selectedColumns.includes(col)) {
      if (selectedColumns.length > 1) {
        setSelectedColumns(selectedColumns.filter((c) => c !== col));
      }
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const handleCreateCleanedCopy = () => {
    const { cleanedRows, removedCount } = removeDuplicatesCopy(state.rawRows, activeColumns);
    const msg = `Deduplicated ${removedCount} duplicate record(s) based on ${
      useAllColumns ? 'all columns' : `${activeColumns.length} selected columns`
    }. Retained ${cleanedRows.length} unique records.`;
    onUpdateCleanedRows(cleanedRows, msg);
    setCleanedSuccessMsg(msg);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Copy className="w-5 h-5 text-indigo-400" />
            Duplicate Record Investigation & Deduplication
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detect identical observations, evaluate feature subset collisions, and create non-destructive deduplicated copies.
          </p>
        </div>

        {/* Stats banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Total Dataset Rows</span>
            <span className="font-mono text-lg font-bold text-slate-200 mt-1 block">
              {state.totalRows.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Identified Duplicates</span>
            <span
              className={`font-mono text-lg font-bold mt-1 block ${
                duplicateResult.duplicateCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {duplicateResult.duplicateCount.toLocaleString()} ({duplicateResult.duplicatePercentage}%)
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Unique Independent Rows</span>
            <span className="font-mono text-lg font-bold text-cyan-400 mt-1 block">
              {(state.totalRows - duplicateResult.duplicateCount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Column Scope Selector */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-400" />
              Deduplication Scope Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose whether two rows must match across every feature or a subset of key identifier attributes.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setUseAllColumns(true)}
              className={`px-3 py-1 rounded text-xs transition cursor-pointer ${
                useAllColumns
                  ? 'bg-purple-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Columns ({state.headers.length})
            </button>
            <button
              onClick={() => setUseAllColumns(false)}
              className={`px-3 py-1 rounded text-xs transition cursor-pointer ${
                !useAllColumns
                  ? 'bg-purple-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Subset of Columns ({selectedColumns.length})
            </button>
          </div>
        </div>

        {!useAllColumns && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">
              Toggle columns to consider for duplicate matching:
            </span>
            <div className="flex flex-wrap gap-2">
              {state.headers.map((h) => {
                const isChecked = selectedColumns.includes(h);
                return (
                  <button
                    key={h}
                    onClick={() => toggleColumn(h)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition border cursor-pointer ${
                      isChecked
                        ? 'bg-purple-950/60 text-purple-300 border-purple-700'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {isChecked ? '✓ ' : ''}{h}
                  </button>
                );
              })}
            </div>
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <p>
                <strong>Caution with Subsets:</strong> When matching on a partial subset of columns, rows that match may represent distinct real-world entities (e.g. two separate customers living in the same city or having identical demographic traits).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate Rows Preview */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Duplicate Observation Examples
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {duplicateResult.duplicateCount === 0
              ? 'No duplicate rows found'
              : `Showing first ${duplicateResult.exampleDuplicates.length} duplicates`}
          </span>
        </div>

        {duplicateResult.duplicateCount === 0 ? (
          <div className="p-8 text-center bg-slate-950/50 rounded-lg border border-slate-800 text-slate-400 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="font-semibold text-slate-200">No duplicate rows detected</p>
            <p className="text-slate-500 max-w-md">
              Every row in this dataset represents a distinct observation across the evaluated column criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5 text-center">Row Index</th>
                  <th className="p-2.5 text-center">Original Index</th>
                  {activeColumns.slice(0, 6).map((c) => (
                    <th key={c} className="p-2.5">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {duplicateResult.exampleDuplicates.map((dup, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-2.5 text-center text-amber-400 font-bold">
                      Row #{dup._duplicateRowIndex + 1}
                    </td>
                    <td className="p-2.5 text-center text-slate-500">
                      Row #{dup._originalRowIndex + 1}
                    </td>
                    {activeColumns.slice(0, 6).map((c) => (
                      <td key={c} className="p-2.5 text-slate-300 whitespace-nowrap">
                        {String(dup[c] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Deduplication Action Button */}
        {duplicateResult.duplicateCount > 0 && (
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-purple-950/20 p-4 rounded-xl border border-purple-900/50">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Create Cleaned Copy Without Duplicates
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Operates on a detached in-memory working copy. Your original dataset remains completely intact.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateCleanedCopy}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                Remove {duplicateResult.duplicateCount} Duplicates
              </button>
            </div>
          </div>
        )}

        {cleanedSuccessMsg && (
          <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{cleanedSuccessMsg}</span>
            </div>
            {state.cleanedRows && (
              <button
                onClick={() => downloadCleanedCSV(state.cleanedRows!, state.filename)}
                className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Download Cleaned CSV
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
