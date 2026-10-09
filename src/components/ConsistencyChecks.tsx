import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Play,
  ShieldCheck,
  Info,
  ChevronRight
} from 'lucide-react';
import { DatasetState, ConsistencyFinding } from '../types';
import { isMissingValue } from '../utils/csvParser';

interface ConsistencyChecksProps {
  state: DatasetState;
}

export const ConsistencyChecks: React.FC<ConsistencyChecksProps> = ({ state }) => {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    state.consistencyFindings[0]?.id || null
  );

  // User-defined validation rule testing state
  const [customCol, setCustomCol] = useState<string>(
    state.headers.find((h) => {
      const p = state.profiles.find((pr) => pr.name === h);
      return p?.inferredType === 'Integer' || p?.inferredType === 'Decimal';
    }) || state.headers[0] || ''
  );
  const [minVal, setMinVal] = useState<string>('0');
  const [maxVal, setMaxVal] = useState<string>('120');
  const [customRuleResult, setCustomRuleResult] = useState<{
    evaluated: boolean;
    violatingCount: number;
    violatingPercentage: number;
    examples: any[];
  } | null>(null);

  const selectedFinding = state.consistencyFindings.find((f) => f.id === selectedFindingId);

  const evaluateCustomRule = () => {
    const min = minVal.trim() !== '' ? Number(minVal) : -Infinity;
    const max = maxVal.trim() !== '' ? Number(maxVal) : Infinity;

    const violating: any[] = [];
    state.rawRows.forEach((r) => {
      const val = r[customCol];
      if (!isMissingValue(val)) {
        const num = Number(val);
        if (!isNaN(num)) {
          if (num < min || num > max) {
            violating.push(num);
          }
        }
      }
    });

    const violatingPercentage =
      state.totalRows > 0 ? Math.round((violating.length / state.totalRows) * 1000) / 10 : 0;

    setCustomRuleResult({
      evaluated: true,
      violatingCount: violating.length,
      violatingPercentage,
      examples: Array.from(new Set(violating)).slice(0, 8),
    });
  };

  const getSeverityBadge = (sev: ConsistencyFinding['severity']) => {
    switch (sev) {
      case 'High':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'Warning':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'Info':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Data Consistency & Structural Quality Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detect whitespace artifacts, inconsistent categorical casing, mixed types, zero-variance attributes, and test custom domain range limits.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-300 pt-1">
          <div>
            Total Consistency Issues Flagged:{' '}
            <strong className="text-amber-400 font-mono text-sm">{state.consistencyFindings.length}</strong>
          </div>
          <div>•</div>
          <div>
            High Severity Deficiencies:{' '}
            <strong className="text-rose-400 font-mono text-sm">
              {state.consistencyFindings.filter((f) => f.severity === 'High').length}
            </strong>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Automated Consistency Findings</h3>
          <span className="text-xs text-slate-400 font-mono">
            {state.consistencyFindings.length} finding(s)
          </span>
        </div>

        {state.consistencyFindings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="font-semibold text-slate-200">No consistency defects detected</p>
            <p className="text-slate-500">
              Columns are formatted cleanly without trailing spaces, mixed casing, or zero-variance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-medium">
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Detected Issue</th>
                  <th className="py-2.5 px-4">Affected Column</th>
                  <th className="py-2.5 px-4 text-right">Affected Items</th>
                  <th className="py-2.5 px-4">Suggested Action</th>
                  <th className="py-2.5 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {state.consistencyFindings.map((finding) => {
                  const isSelected = selectedFindingId === finding.id;
                  return (
                    <tr
                      key={finding.id}
                      onClick={() => setSelectedFindingId(finding.id)}
                      className={`transition cursor-pointer hover:bg-slate-800/40 ${
                        isSelected ? 'bg-purple-950/20 border-l-2 border-purple-500' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSeverityBadge(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-200">
                        {finding.issue}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-purple-300">
                        {finding.column}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        {finding.affectedCount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">
                        {finding.suggestedAction}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <ChevronRight className="w-4 h-4 text-slate-500 mx-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Finding Evidence Deep-Dive */}
      {selectedFinding && (
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getSeverityBadge(
                  selectedFinding.severity
                )}`}
              >
                {selectedFinding.severity}
              </span>
              <h4 className="text-sm font-bold text-white font-mono">
                {selectedFinding.issue} in "{selectedFinding.column}"
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {selectedFinding.affectedCount} values affected
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 font-medium block mb-1">Recommended Solution:</span>
              <p className="text-slate-200 bg-slate-950/50 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {selectedFinding.suggestedAction}
              </p>
            </div>

            {selectedFinding.sampleEvidence.length > 0 && (
              <div>
                <span className="text-slate-400 font-medium block mb-1">Sample Evidence from Dataset:</span>
                <div className="flex flex-wrap gap-2 font-mono">
                  {selectedFinding.sampleEvidence.map((ev, i) => (
                    <span
                      key={i}
                      className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-purple-300"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User-Configured Domain Validation Rule Sandbox */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Configurable Domain Range Validator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical tools should not assume values are invalid without defensible rules. Define domain boundaries (e.g. valid age 0–120) and evaluate your dataset.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Column to Validate:</label>
            <select
              value={customCol}
              onChange={(e) => setCustomCol(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
            >
              {state.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Minimum Allowable Value:</label>
            <input
              type="number"
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
              placeholder="e.g. 0"
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Maximum Allowable Value:</label>
            <input
              type="number"
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
              placeholder="e.g. 120"
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-hidden font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={evaluateCustomRule}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-900 text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Test Rule
            </button>
          </div>
        </div>

        {/* Validation result preview */}
        {customRuleResult && customRuleResult.evaluated && (
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Validation Results for "{customCol}":</span>
              <span
                className={`px-2 py-0.5 rounded font-mono font-semibold ${
                  customRuleResult.violatingCount === 0
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-rose-950 text-rose-300'
                }`}
              >
                {customRuleResult.violatingCount} Violations ({customRuleResult.violatingPercentage}%)
              </span>
            </div>

            {customRuleResult.violatingCount === 0 ? (
              <p className="text-emerald-400 text-xs">
                ✓ All non-missing numeric values in "{customCol}" fall strictly within [{minVal || '-∞'}, {maxVal || '+∞'}].
              </p>
            ) : (
              <div>
                <p className="text-slate-400 text-[11px] mb-1.5">
                  Values falling outside [{minVal}, {maxVal}]:
                </p>
                <div className="flex flex-wrap gap-2 font-mono">
                  {customRuleResult.examples.map((ex, i) => (
                    <span
                      key={i}
                      className="bg-rose-950/60 text-rose-300 px-2.5 py-0.5 rounded border border-rose-800"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
