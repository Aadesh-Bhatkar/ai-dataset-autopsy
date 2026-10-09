import React from 'react';
import {
  UploadCloud,
  Sparkles,
  AlertOctagon,
  Copy,
  TrendingDown,
  CheckCircle2,
  Target,
  ShieldAlert,
  ArrowRight,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';

interface HomeLandingProps {
  onGoToUpload: () => void;
  onLoadSample: () => void;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({
  onGoToUpload,
  onLoadSample,
}) => {
  const featureCards = [
    {
      title: 'Missing Value Detection',
      desc: 'Pinpoint missing cell counts, evaluate MCAR vs MNAR patterns, and recommend tailored imputation techniques (median, mode, or categorical indicators).',
      icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/10 to-transparent border-rose-900/40',
    },
    {
      title: 'Duplicate Record Analysis',
      desc: 'Detect exact multi-column row collisions and inspect duplicate clusters. Generate clean deduplicated working copies non-destructively.',
      icon: <Copy className="w-5 h-5 text-indigo-400" />,
      color: 'from-indigo-500/10 to-transparent border-indigo-900/40',
    },
    {
      title: 'Outlier Detection',
      desc: 'Screen numeric columns using Tukey’s 1.5× Interquartile Range (IQR) method. Inspect distribution tails without blindly dropping valid real-world extremes.',
      icon: <TrendingDown className="w-5 h-5 text-purple-400" />,
      color: 'from-purple-500/10 to-transparent border-purple-900/40',
    },
    {
      title: 'Data Consistency Checks',
      desc: 'Flag whitespace artifacts, mixed categorical casing ("new york" vs "New York"), zero-variance columns, and test custom domain range limits.',
      icon: <FileSpreadsheet className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/10 to-transparent border-cyan-900/40',
    },
    {
      title: 'Target Imbalance Analysis',
      desc: 'Analyze majority and minority class proportions, quantify imbalance ratios, and formulate cross-validation and resampling safeguards.',
      icon: <Target className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/10 to-transparent border-amber-900/40',
    },
    {
      title: 'ML Data Leakage Risk Review',
      desc: 'Identify retrospective features, target-proxy correlations, and unavailable operational attributes that cause false model optimism.',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/10 to-transparent border-rose-900/40',
    },
  ];

  const steps = [
    { num: '1', title: 'Upload your CSV', desc: 'Drag and drop or load our synthetic sample dataset with deliberate anomalies.' },
    { num: '2', title: 'Inspect findings', desc: 'Review automated data types, quality scores, and statistical profiles in-browser.' },
    { num: '3', title: 'Explore visualizations', desc: 'Interact with distribution histograms, missingness rates, and class charts.' },
    { num: '4', title: 'Apply recommendations', desc: 'Use the non-destructive Cleaning Workspace to trim, deduplicate, and impute.' },
    { num: '5', title: 'Download the report', desc: 'Export high-fidelity HTML and Markdown reports or your cleaned dataset.' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-4">
      {/* Hero Section */}
      <div className="text-center space-y-5 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Educational Data Science Portfolio Project</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          AI Dataset Autopsy
        </h1>

        <p className="text-lg font-medium text-purple-200/90 font-mono">
          "Investigate your data. Discover hidden problems. Prepare better datasets."
        </p>

        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload a CSV dataset to discover missing values, duplicates, suspicious outliers, inconsistent data types, target imbalance, and potential machine-learning data leakage risks. 100% computed locally in your browser.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onGoToUpload}
            className="px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition cursor-pointer flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload My Dataset
          </button>

          <button
            onClick={onLoadSample}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Try Sample Dataset
          </button>
        </div>
      </div>

      {/* Six Feature Cards */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Comprehensive Diagnostic Suite</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real calculations on your uploaded dataset — no fabricated or mocked statistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureCards.map((card, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl bg-linear-to-b ${card.color} bg-slate-900/60 border p-5 space-y-3 transition hover:scale-[1.01]`}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shadow-xs">
                {card.icon}
              </div>
              <h3 className="text-sm font-bold text-white">{card.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white">How It Works</h2>
          <p className="text-xs text-slate-400">
            A seamless, transparent workflow designed for data analysts and aspiring data scientists.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-2">
          {steps.map((st) => (
            <div key={st.num} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-center">
              <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-bold font-mono text-sm mx-auto flex items-center justify-center">
                {st.num}
              </div>
              <h4 className="text-xs font-bold text-slate-200">{st.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
