import React, { useState } from 'react';
import {
  Wrench,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter,
  Type
} from 'lucide-react';
import { DatasetState } from '../types';
import { isMissingValue } from '../utils/csvParser';
import { downloadCleanedCSV } from '../utils/reportGenerator';
import { detectDuplicates } from '../utils/duplicateDetector';

interface CleaningWorkspaceProps {
  state: DatasetState;
  onUpdateCleanedDataset: (cleanedRows: Record<string, any>[], historyLog: string[]) => void;
}

export const CleaningWorkspace: React.FC<CleaningWorkspaceProps> = ({
  state,
  onUpdateCleanedDataset,
}) => {
  // Working copy in memory: default to state.cleanedRows or clone of original rawRows
  const [workingRows, setWorkingRows] = useState<Record<string, any>[]>(() => {
    return state.cleanedRows ? [...state.cleanedRows] : state.rawRows.map((r) => ({ ...r }));
  });

  const [history, setHistory] = useState<string[]>(state.cleanedHistory || []);
  const [undoStack, setUndoStack] = useState<Record<string, any>[][]>([]);

  // Action configurations state
  const [activeAction, setActiveAction] = useState<
    'trim' | 'casing' | 'emptyToNull' | 'dedup' | 'dropCol' | 'impute' | 'filter'
  >('trim');

  // Selected column for single-column actions
  const [selectedCol, setSelectedCol] = useState<string>(state.headers[0] || '');
  const [casingMode, setCasingMode] = useState<'title' | 'lower' | 'upper'>('title');
  const [imputeMethod, setImputeMethod] = useState<'median' | 'mean' | 'mode' | 'constant'>('median');
  const [constantValue, setConstantValue] = useState<string>('Unknown');
  const [filterCondition, setFilterCondition] = useState<string>('not_empty');
  const [filterThreshold, setFilterThreshold] = useState<string>('0');

  const headers = workingRows.length > 0 ? Object.keys(workingRows[0]) : state.headers;

  const pushUndoState = () => {
    setUndoStack((prev) => [...prev, workingRows.map((r) => ({ ...r }))]);
  };

  const handleApplyAction = () => {
    pushUndoState();
    let newRows = workingRows.map((r) => ({ ...r }));
    let logMsg = '';

    switch (activeAction) {
      case 'trim': {
        let trimmedCount = 0;
        newRows = newRows.map((row) => {
          const updatedRow: Record<string, any> = {};
          for (const [k, v] of Object.entries(row)) {
            if (typeof v === 'string') {
              const trimmed = v.trim();
              if (trimmed !== v) trimmedCount++;
              updatedRow[k] = trimmed;
            } else {
              updatedRow[k] = v;
            }
          }
          return updatedRow;
        });
        logMsg = `Trimmed leading and trailing whitespace across all string cells (${trimmedCount} values modified).`;
        break;
      }

      case 'casing': {
        let casingCount = 0;
        newRows = newRows.map((row) => {
          const val = row[selectedCol];
          if (typeof val === 'string' && val.trim() !== '') {
            let transformed = val;
            if (casingMode === 'lower') transformed = val.toLowerCase();
            else if (casingMode === 'upper') transformed = val.toUpperCase();
            else if (casingMode === 'title') {
              transformed = val
                .toLowerCase()
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
            if (transformed !== val) casingCount++;
            return { ...row, [selectedCol]: transformed };
          }
          return row;
        });
        logMsg = `Standardized casing for column "${selectedCol}" to ${casingMode}case (${casingCount} values updated).`;
        break;
      }

      case 'emptyToNull': {
        let nullifiedCount = 0;
        newRows = newRows.map((row) => {
          const updatedRow: Record<string, any> = {};
          for (const [k, v] of Object.entries(row)) {
            if (isMissingValue(v)) {
              if (v !== null) nullifiedCount++;
              updatedRow[k] = null;
            } else {
              updatedRow[k] = v;
            }
          }
          return updatedRow;
        });
        logMsg = `Standardized all empty and placeholder values to explicit nulls (${nullifiedCount} cells updated).`;
        break;
      }

      case 'dedup': {
        const dupRes = detectDuplicates(newRows);
        const dupSet = new Set(dupRes.duplicateIndices);
        const before = newRows.length;
        newRows = newRows.filter((_, idx) => !dupSet.has(idx));
        logMsg = `Removed ${before - newRows.length} duplicate rows. Retained ${newRows.length} unique rows.`;
        break;
      }

      case 'dropCol': {
        newRows = newRows.map((row) => {
          const copy = { ...row };
          delete copy[selectedCol];
          return copy;
        });
        logMsg = `Dropped column "${selectedCol}" from the dataset.`;
        break;
      }

      case 'impute': {
        const nonMissing = newRows
          .map((r) => r[selectedCol])
          .filter((v) => !isMissingValue(v));

        let fillValue: any = constantValue;

        if (imputeMethod === 'mean') {
          const nums = nonMissing.map(Number).filter((n) => !isNaN(n));
          fillValue = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
          fillValue = Math.round(fillValue * 100) / 100;
        } else if (imputeMethod === 'median') {
          const nums = nonMissing.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
          fillValue = nums.length > 0 ? nums[Math.floor(nums.length / 2)] : 0;
        } else if (imputeMethod === 'mode') {
          const counts = new Map<string, number>();
          for (const v of nonMissing) {
            const k = String(v);
            counts.set(k, (counts.get(k) || 0) + 1);
          }
          const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
          fillValue = sorted[0] ? sorted[0][0] : '';
        }

        let filledCount = 0;
        newRows = newRows.map((row) => {
          if (isMissingValue(row[selectedCol])) {
            filledCount++;
            return { ...row, [selectedCol]: fillValue };
          }
          return row;
        });

        logMsg = `Imputed ${filledCount} missing cells in "${selectedCol}" using ${imputeMethod} (${fillValue}).`;
        break;
      }

      case 'filter': {
        const beforeCount = newRows.length;
        if (filterCondition === 'not_empty') {
          newRows = newRows.filter((r) => !isMissingValue(r[selectedCol]));
        } else if (filterCondition === 'greater_than') {
          const t = Number(filterThreshold);
          newRows = newRows.filter((r) => Number(r[selectedCol]) > t);
        } else if (filterCondition === 'less_than') {
          const t = Number(filterThreshold);
          newRows = newRows.filter((r) => Number(r[selectedCol]) < t);
        }
        logMsg = `Filtered rows on "${selectedCol}". Retained ${newRows.length} rows (removed ${beforeCount - newRows.length}).`;
        break;
      }
    }

    const updatedHistory = [...history, logMsg];
    setWorkingRows(newRows);
    setHistory(updatedHistory);
    onUpdateCleanedDataset(newRows, updatedHistory);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setWorkingRows(previous);
    setUndoStack(undoStack.slice(0, -1));
    const newHist = history.slice(0, -1);
    setHistory(newHist);
    onUpdateCleanedDataset(previous, newHist);
  };

  const handleResetToOriginal = () => {
    const fresh = state.rawRows.map((r) => ({ ...r }));
    setWorkingRows(fresh);
    setUndoStack([]);
    setHistory([]);
    onUpdateCleanedDataset(fresh, []);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              Non-Destructive Cleaning Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Apply reproducible transformations to an isolated working copy. Your original dataset remains preserved in memory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo
            </button>
            <button
              onClick={handleResetToOriginal}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              Reset All
            </button>
            <button
              onClick={() => downloadCleanedCSV(workingRows, state.filename)}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Cleaned CSV
            </button>
          </div>
        </div>

        {/* Working Copy Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Working Rows</span>
            <span className="font-mono text-base font-bold text-white mt-0.5 block">
              {workingRows.length.toLocaleString()}{' '}
              <span className="text-xs text-slate-500 font-normal">
                (Orig: {state.totalRows.toLocaleString()})
              </span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Working Columns</span>
            <span className="font-mono text-base font-bold text-cyan-400 mt-0.5 block">
              {headers.length}{' '}
              <span className="text-xs text-slate-500 font-normal">
                (Orig: {state.totalColumns})
              </span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Transformations Applied</span>
            <span className="font-mono text-base font-bold text-purple-300 mt-0.5 block">
              {history.length}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block">Integrity Status</span>
            <span className="font-mono text-base font-bold text-emerald-400 mt-0.5 block">
              Working Copy Active
            </span>
          </div>
        </div>
      </div>

      {/* Action Selector and Configuration Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Type List */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3 px-2">
            Choose Transformation
          </span>

          {[
            { id: 'trim', label: 'Trim Whitespace (All Columns)', desc: 'Strip leading/trailing spaces' },
            { id: 'casing', label: 'Standardize Category Casing', desc: 'Title case, lower, or upper' },
            { id: 'emptyToNull', label: 'Convert Empty Strings to NULL', desc: 'Standardize blank placeholders' },
            { id: 'dedup', label: 'Deduplicate Exact Rows', desc: 'Preserve single representative row' },
            { id: 'dropCol', label: 'Drop Selected Column', desc: 'Permanently remove redundant feature' },
            { id: 'impute', label: 'Fill Missing Values (Impute)', desc: 'Median, mean, mode, or constant' },
            { id: 'filter', label: 'Filter Rows on Condition', desc: 'Drop missing or out-of-range rows' },
          ].map((act) => (
            <button
              key={act.id}
              onClick={() => setActiveAction(act.id as any)}
              className={`w-full text-left p-2.5 rounded-lg text-xs transition cursor-pointer ${
                activeAction === act.id
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span className="font-semibold block">{act.label}</span>
              <span className="text-[11px] text-slate-500">{act.desc}</span>
            </button>
          ))}
        </div>

        {/* Action Settings & Confirmation */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Configure Operation: {activeAction.toUpperCase()}
          </h3>

          {/* Conditional settings per action */}
          {activeAction === 'trim' && (
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Trims leading and trailing whitespace from every text column in the dataset (e.g. <code>" Austin "</code> becomes <code>"Austin"</code>).
              </p>
              <p className="text-slate-500 text-[11px]">
                Safe operation. Preserves all internal words and non-string values.
              </p>
            </div>
          )}

          {activeAction === 'casing' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Target Column:</label>
                <select
                  value={selectedCol}
                  onChange={(e) => setSelectedCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Casing Style:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCasingMode('title')}
                    className={`px-3 py-1.5 rounded text-xs border cursor-pointer ${
                      casingMode === 'title' ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Title Case (e.g. "New York")
                  </button>
                  <button
                    onClick={() => setCasingMode('lower')}
                    className={`px-3 py-1.5 rounded text-xs border cursor-pointer ${
                      casingMode === 'lower' ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    lowercase (e.g. "new york")
                  </button>
                  <button
                    onClick={() => setCasingMode('upper')}
                    className={`px-3 py-1.5 rounded text-xs border cursor-pointer ${
                      casingMode === 'upper' ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    UPPERCASE (e.g. "NEW YORK")
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeAction === 'emptyToNull' && (
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Iterates through all cells and replaces whitespace-only strings, <code>"N/A"</code>, <code>"null"</code>, <code>"?"</code>, and <code>"-"</code> with standard JavaScript <code>null</code>.
              </p>
              <p className="text-slate-500 text-[11px]">
                Ensures subsequent imputation algorithms correctly recognize unobserved data points.
              </p>
            </div>
          )}

          {activeAction === 'dedup' && (
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Scans all rows and drops exact duplicates, keeping the first occurrence.
              </p>
            </div>
          )}

          {activeAction === 'dropCol' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Column to Drop:</label>
                <select
                  value={selectedCol}
                  onChange={(e) => setSelectedCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-amber-400 text-[11px]">
                ⚠️ Dropping this column will remove it from downstream exports of this working copy.
              </p>
            </div>
          )}

          {activeAction === 'impute' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Column to Impute:</label>
                <select
                  value={selectedCol}
                  onChange={(e) => setSelectedCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Imputation Strategy:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setImputeMethod('median')}
                    className={`px-3 py-1.5 rounded text-xs border cursor-pointer ${
                      imputeMethod === 'median' ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Median (Robust Numeric)
                  </button>
                  <button
                    onClick={() => setImputeMethod('mean')}
                    className={`px-3 py-1.5 rounded text-xs border cursor-pointer ${
                      imputeMethod === 'mean' ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Mean (Standard Numeric)
                  </button>
                  <button
                    onClick={() => setImputeMethod('mode')}
                    className={`px-3 py-1.5 rounded text-xs border cursor-pointer ${
                      imputeMethod === 'mode' ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Mode (Most Frequent)
                  </button>
                  <button
                    onClick={() => setImputeMethod('constant')}
                    className={`px-3 py-1.5 rounded text-xs border cursor-pointer ${
                      imputeMethod === 'constant' ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Custom Constant
                  </button>
                </div>
              </div>

              {imputeMethod === 'constant' && (
                <div>
                  <label className="text-slate-400 block mb-1">Constant Fill Value:</label>
                  <input
                    type="text"
                    value={constantValue}
                    onChange={(e) => setConstantValue(e.target.value)}
                    placeholder="e.g. Unknown or 0"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {activeAction === 'filter' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Column to Filter On:</label>
                <select
                  value={selectedCol}
                  onChange={(e) => setSelectedCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Condition:</label>
                <select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden"
                >
                  <option value="not_empty">Must not be empty / null</option>
                  <option value="greater_than">Numeric value is greater than threshold</option>
                  <option value="less_than">Numeric value is less than threshold</option>
                </select>
              </div>

              {filterCondition !== 'not_empty' && (
                <div>
                  <label className="text-slate-400 block mb-1">Numeric Threshold:</label>
                  <input
                    type="number"
                    value={filterThreshold}
                    onChange={(e) => setFilterThreshold(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action execution button */}
          <div className="pt-2">
            <button
              onClick={handleApplyAction}
              className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Apply Transformation
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log History of Applied Operations */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-purple-400" />
          Transformation Audit History ({history.length})
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No transformations applied yet. Working copy is identical to uploaded file.
          </p>
        ) : (
          <ol className="space-y-2 text-xs font-mono">
            {history.map((h, i) => (
              <li
                key={i}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-slate-300"
              >
                <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
