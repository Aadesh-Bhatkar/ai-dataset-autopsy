import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Wrench,
  Filter,
  Check,
  ArrowRight,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { DatasetState, CleaningRecommendation } from '../types';

interface CleaningRecommendationsProps {
  state: DatasetState;
  onNavigateToWorkspace: () => void;
  onToggleReviewed: (id: string) => void;
}

export const CleaningRecommendations: React.FC<CleaningRecommendationsProps> = ({
  state,
  onNavigateToWorkspace,
  onToggleReviewed,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredRecs = state.recommendations.filter((r) => {
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    return true;
  });

  const getPriorityBadge = (p: CleaningRecommendation['priority']) => {
    switch (p) {
      case 'High':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'Medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'Low':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
    }
  };

  const categories = ['ALL', 'Duplicates', 'Missing Values', 'Consistency', 'Outliers', 'Target', 'Leakage'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Prioritized Cleaning Recommendations Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic, evidence-grounded action plans derived strictly from verified statistical diagnostics.
            </p>
          </div>

          <button
            onClick={onNavigateToWorkspace}
            className="px-4 py-2.5 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Wrench className="w-4 h-4" /> Open Cleaning Workspace
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 outline-hidden"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 outline-hidden"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-mono ml-auto">
            Showing {filteredRecs.length} of {state.recommendations.length} recommendations
          </span>
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {filteredRecs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No recommendations match your selected filters.
          </div>
        ) : (
          filteredRecs.map((rec) => {
            const isReviewed = Boolean(rec.reviewed);
            return (
              <div
                key={rec.id}
                className={`p-5 rounded-xl border transition space-y-3 ${
                  isReviewed
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(
                        rec.priority
                      )}`}
                    >
                      {rec.priority} Priority
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {rec.category}
                    </span>
                    {rec.column && (
                      <span className="text-xs font-mono text-purple-300">
                        "{rec.column}"
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onToggleReviewed(rec.id)}
                    className={`text-xs px-3 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                      isReviewed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isReviewed ? 'Reviewed' : 'Mark as Reviewed'}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    {rec.issue}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    <strong className="text-slate-300 font-sans">Evidence:</strong> {rec.evidence}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Recommended Action:</strong>{' '}
                      <span className="text-slate-300">{rec.recommendedAction}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 border-t border-slate-900">
                    <Lightbulb className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Why It Matters:</strong>{' '}
                      <span className="text-slate-400">{rec.whyItMatters}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
