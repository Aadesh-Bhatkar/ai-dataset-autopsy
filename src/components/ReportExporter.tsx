import React, { useState } from 'react';
import {
  FileDown,
  Download,
  FileCode,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { DatasetState } from '../types';
import {
  generateMarkdownReport,
  generateHTMLReport,
  downloadFile,
  downloadCleanedCSV,
} from '../utils/reportGenerator';

interface ReportExporterProps {
  state: DatasetState;
}

export const ReportExporter: React.FC<ReportExporterProps> = ({ state }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport(state);
    const fname = `${state.filename.replace(/\.csv$/i, '')}_data_quality_report.md`;
    downloadFile(md, fname, 'text/markdown;charset=utf-8;');
    setDownloadSuccess(`Downloaded Markdown report: ${fname}`);
  };

  const handleDownloadHTML = () => {
    const html = generateHTMLReport(state);
    const fname = `${state.filename.replace(/\.csv$/i, '')}_data_quality_report.html`;
    downloadFile(html, fname, 'text/html;charset=utf-8;');
    setDownloadSuccess(`Downloaded HTML interactive audit report: ${fname}`);
  };

  const mdPreview = generateMarkdownReport(state);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileDown className="w-5 h-5 text-purple-400" />
            Export Data Quality Audit & Cleaned Datasets
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export comprehensive diagnostic documentation for your data science portfolio, stakeholders, or engineering pipeline.
          </p>
        </div>

        {/* Download Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleDownloadHTML}
            className="px-4 py-2.5 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <FileCode className="w-4 h-4" /> Download HTML Report (Printable to PDF)
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-cyan-400" /> Download Markdown (.md) Report
          </button>

          {state.cleanedRows && (
            <button
              onClick={() => downloadCleanedCSV(state.cleanedRows!, state.filename)}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Cleaned CSV ({state.cleanedRows.length} rows)
            </button>
          )}
        </div>

        {downloadSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}
      </div>

      {/* Report Structure Overview Card */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Included Audit Sections in Report
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">1. Executive Overview</span>
            <span className="text-[11px] text-slate-400">Dimensions, records analyzed, memory footprint.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">2. Data Quality Score</span>
            <span className="text-[11px] text-slate-400">0–100 heuristic breakdown with point deductions.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">3. Missing Value Audit</span>
            <span className="text-[11px] text-slate-400">Per-column rates and imputation rationales.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">4. Deduplication Review</span>
            <span className="text-[11px] text-slate-400">Exact row collision count and rate.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">5. Tukey IQR Outliers</span>
            <span className="text-[11px] text-slate-400">Bounds, distribution spread, flagged values.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">6. Consistency Findings</span>
            <span className="text-[11px] text-slate-400">Whitespace, mixed casing, zero-variance.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">7. Target Imbalance</span>
            <span className="text-[11px] text-slate-400">Class distributions, majority ratios, metrics.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">8. ML Leakage Risk</span>
            <span className="text-[11px] text-slate-400">Retrospective features & proxy correlations.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-purple-300 block mb-1">9. Cleaning Actions</span>
            <span className="text-[11px] text-slate-400">Prioritized checklist for ML readiness.</span>
          </div>
        </div>
      </div>

      {/* Raw Markdown Report Preview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden space-y-2">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Report Content Preview (Markdown)</h3>
          <span className="text-xs text-slate-400 font-mono">
            {mdPreview.length.toLocaleString()} characters
          </span>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950/60 whitespace-pre-wrap leading-relaxed">
          {mdPreview}
        </div>
      </div>
    </div>
  );
};
