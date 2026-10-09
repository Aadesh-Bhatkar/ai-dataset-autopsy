import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  EyeOff,
  Info,
  Lock,
  ChevronRight
} from 'lucide-react';
import { DatasetState, LeakageFinding } from '../types';
import { reviewDataLeakage } from '../utils/leakageReview';

interface LeakageReviewProps {
  state: DatasetState;
  onUpdateLeakage: (findings: LeakageFinding[], unavailableCols: string[]) => void;
}

export const LeakageReview: React.FC<LeakageReviewProps> = ({
  state,
  onUpdateLeakage,
}) => {
  const [unavailableCols, setUnavailableCols] = useState<string[]>([]);
  const targetCol = state.targetColumn || state.headers[state.headers.length - 1];

  const toggleUnavailable = (col: string) => {
    const updated = unavailableCols.includes(col)
      ? unavailableCols.filter((c) => c !== col)
      : [...unavailableCols, col];

    setUnavailableCols(updated);
    const newFindings = reviewDataLeakage(
      targetCol,
      state.headers,
      state.rawRows,
      state.profiles,
      updated
    );
    onUpdateLeakage(newFindings, updated);
  };

  const getRiskBadge = (risk: LeakageFinding['riskLevel']) => {
    switch (risk) {
      case 'Potential Leakage Risk':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'Review Recommended':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'No Obvious Warning Detected':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Concept Introduction */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Machine Learning Data Leakage Risk Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Data leakage occurs when information unavailable at production prediction time inadvertently enters training features, generating deceptive high training accuracy and catastrophic real-world failure.
          </p>
        </div>

        {/* Current Target Reference */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target Feature for Audit:</span>
            <span className="font-mono text-purple-300 font-bold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800">
              "{targetCol}"
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Change target in the Target Analysis section
          </span>
        </div>
      </div>

      {/* Interactive Tool: Unavailable at Prediction Time */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Operational Feature Availability Check
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Click any features below that would <strong>not be known or recorded</strong> at the moment a prediction is requested in production:
        </p>

        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
          {state.headers
            .filter((h) => h !== targetCol)
            .map((h) => {
              const isUnavailable = unavailableCols.includes(h);
              return (
                <button
                  key={h}
                  onClick={() => toggleUnavailable(h)}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                    isUnavailable
                      ? 'bg-rose-950/80 text-rose-300 border-rose-700 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isUnavailable ? '⚠️ Unavailable: ' : '+ '}
                  {h}
                </button>
              );
            })}
        </div>
      </div>

      {/* Leakage Audit Results Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Feature Leakage Audit Findings</h3>
          <span className="text-xs text-slate-400 font-mono">
            {state.leakageFindings.filter((l) => l.riskLevel !== 'No Obvious Warning Detected').length} risk(s) flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-medium">
                <th className="py-2.5 px-4">Feature</th>
                <th className="py-2.5 px-4">Risk Level</th>
                <th className="py-2.5 px-4">Indicator Pattern</th>
                <th className="py-2.5 px-4">Audit Rationale & Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {state.leakageFindings.map((finding) => (
                <tr key={finding.column} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-200">
                    {finding.column}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getRiskBadge(
                        finding.riskLevel
                      )}`}
                    >
                      {finding.riskLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-purple-300 font-medium">
                    {finding.indicator}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 max-w-md text-xs leading-relaxed">
                    {finding.reason}
                    {finding.scoreOrMetric && (
                      <span className="ml-2 font-mono text-cyan-400 font-semibold">
                        [{finding.scoreOrMetric}]
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prominent Educational Limitations Disclaimer */}
      <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 text-slate-300">
        <span className="font-semibold text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          Critical Methodological Limitation on Automated Leakage Detection:
        </span>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Automated heuristic algorithms evaluate naming keywords, high linear correlations, and asymmetric presence matrices. However, <strong>an automated scanner can NEVER definitively prove a dataset is free of leakage</strong> without intimate human knowledge of the operational business process and prediction timeframe.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
          <li><strong>Retrospective Data:</strong> Any field generated after or simultaneously with the target event must be dropped (e.g. churn surveys, return dates, fraud ticket resolution).</li>
          <li><strong>Lookahead Contamination:</strong> Preprocessing pipelines (such as scaling or target encoding) must be fitted strictly inside training cross-validation folds, never across the whole dataset before splitting.</li>
        </ul>
      </div>
    </div>
  );
};
