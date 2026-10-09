import React from 'react';
import {
  Info,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Github,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export const AboutProject: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-linear-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white font-mono font-bold text-base">
            DA
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Dataset Autopsy</h2>
            <p className="text-xs text-purple-300 font-mono">
              Intelligent Data Quality Analyzer & Preparation Studio
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          An educational Data Science portfolio application engineered to bridge the gap between raw CSV files and machine-learning-ready datasets. It diagnoses missingness mechanisms, exact duplicate collisions, statistical outliers, formatting inconsistencies, target variable imbalance, and retrospective ML leakage risks.
        </p>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">100% In-Browser Profiling</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All parsing (via PapaParse), statistical distributions (min, max, mean, median, IQR, std dev), and duplicate matrix checks execute entirely inside the client’s browser using modern JavaScript typed arrays.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Zero Raw Data Transmission</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Raw rows, customer identities, and records never leave your local session. When optional AI explanations are queried, only aggregated mathematical summaries (e.g., "Age has 8 missing cells") are sent.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Grounded AI Analysis</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gemini is constrained to interpret and translate verified statistics into actionable advice. It never invents, hallucinates, or estimates numbers. A fallback local rule-based engine operates if credentials are omitted.
          </p>
        </div>
      </div>

      {/* Methodological Details */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          Data Science Methodologies Applied
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-1">
            <strong className="text-slate-100 block">Tukey's IQR Outlier Detection:</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Calculates non-parametric quartiles Q1 (25th percentile) and Q3 (75th percentile), establishing boundaries at $Q_1 - 1.5\times IQR$ and $Q_3 + 1.5\times IQR$. Resistance to extreme values ensures bounds aren't pulled by the outliers themselves.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-slate-100 block">Class Imbalance & Resampling Guidance:</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Evaluates minority-to-majority ratios and warns against accuracy paradoxes. Emphasizes applying synthetic resampling (SMOTE) strictly within cross-validation training folds to prevent data snooping.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-slate-100 block">Machine Learning Leakage Heuristics:</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Screens for retrospective features (post-outcome measurements), high target-proxy correlations ($|r| \ge 0.90$), and asymmetric missingness presence that give away the target label.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-slate-100 block">Transparent Quality Scoring:</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Provides an intuitive 0–100 score across Completeness (30), Uniqueness (20), Consistency (25), Integrity (15), and Variance (10), detailing every mathematical deduction clearly.
            </p>
          </div>
        </div>
      </div>

      {/* Deployment & Setup Guide */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
        <h3 className="text-sm font-semibold text-white">Local Run & Vercel Deployment Instructions</h3>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
          <div># 1. Clone repository & install dependencies</div>
          <div className="text-cyan-400">npm install</div>
          <div className="pt-2"># 2. Start development server</div>
          <div className="text-cyan-400">npm run dev</div>
          <div className="pt-2"># 3. Production build</div>
          <div className="text-cyan-400">npm run build</div>
        </div>
        <p className="text-slate-400 text-[11px]">
          To deploy to Vercel, simply connect your GitHub repository. The core data profiling, anomaly detection, workspace, and export features run 100% client-side without any backend database or API key!
        </p>
      </div>
    </div>
  );
};
