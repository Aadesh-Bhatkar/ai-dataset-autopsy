import React, { useState } from 'react';
import {
  FileSpreadsheet,
  BarChart3,
  HelpCircle,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Key,
  Layers,
  ChevronDown,
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
import { DatasetState, ColumnProfile, InferredType } from '../types';

interface DataProfileProps {
  state: DatasetState;
}

export const DataProfile: React.FC<DataProfileProps> = ({ state }) => {
  const [selectedColumnName, setSelectedColumnName] = useState<string>(
    state.profiles[0]?.name || ''
  );
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const selectedProfile = state.profiles.find((p) => p.name === selectedColumnName);

  const filteredProfiles = state.profiles.filter((p) => {
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'NUMERIC') return p.inferredType === 'Integer' || p.inferredType === 'Decimal';
    if (typeFilter === 'CATEGORICAL') return p.inferredType === 'Categorical' || p.inferredType === 'Text';
    return p.inferredType === typeFilter;
  });

  const getTypeIcon = (type: InferredType) => {
    switch (type) {
      case 'Integer':
      case 'Decimal':
        return <Hash className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Categorical':
      case 'Text':
        return <Type className="w-3.5 h-3.5 text-purple-400" />;
      case 'Boolean':
        return <ToggleLeft className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Date':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case 'Identifier-like':
        return <Key className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Documentation Note */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-400" />
              Automatic Data Profiling & Type Inference
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Inspects every feature across statistical distributions, uniqueness, missingness, and inferred semantics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 outline-hidden"
            >
              <option value="ALL">All Types ({state.profiles.length})</option>
              <option value="NUMERIC">Numeric Only</option>
              <option value="CATEGORICAL">Categorical & Text</option>
              <option value="Boolean">Boolean</option>
              <option value="Date">Date</option>
              <option value="Identifier-like">Identifier-like</option>
            </select>
          </div>
        </div>

        {/* Missing conventions note */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Missing Value Conventions:</strong> Empty cells, whitespace-only strings, and standard missing markers (<code>null</code>, <code>nan</code>, <code>NA</code>, <code>N/A</code>, <code>?</code>, <code>-</code>, <code>#N/A</code>) are recognized as unobserved missing entries rather than valid textual categories.
          </div>
        </div>
      </div>

      {/* Profile Overview Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-medium">
                <th className="py-3 px-4">Column Name</th>
                <th className="py-3 px-4">Inferred Type</th>
                <th className="py-3 px-4 text-right">Non-Missing</th>
                <th className="py-3 px-4 text-right">Missing Cells</th>
                <th className="py-3 px-4 text-right">Unique Values</th>
                <th className="py-3 px-4 text-center">Quality Status</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProfiles.map((prof) => {
                const isSelected = selectedColumnName === prof.name;
                return (
                  <tr
                    key={prof.name}
                    className={`transition hover:bg-slate-800/40 ${
                      isSelected ? 'bg-purple-950/25 border-l-2 border-purple-500' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-200">
                      {prof.name}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-slate-800 border border-slate-700 text-slate-300">
                        {getTypeIcon(prof.inferredType)}
                        {prof.inferredType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-300">
                      {prof.nonMissingCount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {prof.missingCount > 0 ? (
                        <span className="text-rose-400 font-semibold">
                          {prof.missingCount} ({prof.missingPercentage}%)
                        </span>
                      ) : (
                        <span className="text-emerald-400">0 (0%)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-300">
                      {prof.uniqueCount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          prof.qualityStatus === 'Good'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : prof.qualityStatus === 'Warning'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {prof.qualityStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      <button
                        onClick={() => setSelectedColumnName(prof.name)}
                        className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Column Deep Dive Component */}
      {selectedProfile && (
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-mono">
                  {selectedProfile.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs bg-purple-950 text-purple-300 border border-purple-800">
                  {getTypeIcon(selectedProfile.inferredType)}
                  {selectedProfile.inferredType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Detailed profile metrics, distribution visualization, and sample values.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Switch column:</span>
              <select
                value={selectedProfile.name}
                onChange={(e) => setSelectedColumnName(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 outline-hidden font-mono"
              >
                {state.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* If Numeric: Display Stats & Histogram */}
          {selectedProfile.numericSummary && (
            <div className="space-y-6">
              {/* Numeric Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Minimum</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedProfile.numericSummary.min}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Q1 (25th)</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedProfile.numericSummary.q1}</span>
                </div>
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/80">
                  <span className="text-purple-300 block text-[10px] uppercase font-sans">Median (50th)</span>
                  <span className="text-cyan-400 text-sm font-bold">{selectedProfile.numericSummary.median}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Mean</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedProfile.numericSummary.mean}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Q3 (75th)</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedProfile.numericSummary.q3}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Maximum</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedProfile.numericSummary.max}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Std Deviation</span>
                  <span className="text-slate-200 text-sm font-semibold">{selectedProfile.numericSummary.stdDev}</span>
                </div>
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/80">
                  <span className="text-purple-300 block text-[10px] uppercase font-sans">IQR (Q3-Q1)</span>
                  <span className="text-purple-300 text-sm font-bold">{selectedProfile.numericSummary.iqr}</span>
                </div>
              </div>

              {/* Histogram Visualization */}
              {selectedProfile.numericSummary.histogram.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Binned Frequency Histogram
                  </h4>
                  <div className="h-64 w-full">
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
                          labelStyle={{ color: '#cbd5e1' }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If Categorical or Text: Frequency Counts and Variants */}
          {selectedProfile.categoricalSummary && (
            <div className="space-y-6">
              {/* Category Frequency Chart */}
              {selectedProfile.categoricalSummary.topValues.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Top Category Distribution
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedProfile.categoricalSummary.topValues.slice(0, 8)}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
                      >
                        <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="value"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: any, name: any, props: any) => [
                            `${value} records (${props.payload.percentage}%)`,
                            'Count',
                          ]}
                        />
                        <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Inconsistent Casing Alert */}
              {selectedProfile.categoricalSummary.unusualCasingFound && (
                <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/80 text-xs text-amber-300 space-y-2">
                  <span className="font-semibold block">⚠️ Inconsistent Capitalization Detected:</span>
                  <p className="text-amber-300/80 text-[11px]">
                    The following entries exist with multiple casing styles (e.g. "new york" vs "New York"). Standardize casing in the Cleaning Workspace.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-mono">
                    {selectedProfile.categoricalSummary.casingVariants.map((c, i) => (
                      <span key={i} className="bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700">
                        {c.variants.join(' | ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sample Values Preview */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-500 font-sans uppercase block mb-1.5">
              Sample Distinct Observations:
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedProfile.sampleValues.map((v, i) => (
                <span key={i} className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {v === null || v === undefined || String(v).trim() === '' ? (
                    <em className="text-rose-400">null</em>
                  ) : (
                    String(v)
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
