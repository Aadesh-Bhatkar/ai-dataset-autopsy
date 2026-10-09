import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { parseCSVString } from '../utils/csvParser';
import { generateSampleDatasetCSV } from '../utils/sampleDataset';
import { runFullDatasetAudit } from '../utils/analyzer';
import { DatasetState } from '../types';

interface FileUploaderProps {
  datasetState: DatasetState | null;
  setDatasetState: (state: DatasetState | null) => void;
  onUploadSuccess?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  datasetState,
  setDatasetState,
  onUploadSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCSVContent = async (content: string, filename: string, size: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const parsed = await parseCSVString(content);
      const audit = runFullDatasetAudit(parsed.headers, parsed.data, filename, size);
      setDatasetState(audit);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process CSV file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Invalid file format. Please upload a comma-separated .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCSVContent(content, file.name, file.size);
    };
    reader.onerror = () => {
      setErrorMsg('An error occurred reading the file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Invalid file format. Please drop a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCSVContent(content, file.name, file.size);
    };
    reader.readAsText(file);
  };

  const loadSampleDataset = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      const sampleCSV = generateSampleDatasetCSV();
      processCSVContent(sampleCSV, 'sample_customer_churn_analytics.csv', 18450);
    }, 150);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-purple-600/10 to-transparent pointer-events-none" />
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-400" />
          Upload Dataset for Autopsy
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Upload any comma-delimited CSV table. The application profiles data types, scans for missing values,
          detects duplicate records, pinpoints outliers with IQR bounds, checks categorical consistency,
          and flags machine learning leakage hazards completely inside your browser.
        </p>
      </div>

      {/* Drag & Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-purple-400 bg-purple-950/20 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-purple-400">
            {isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-200">
              Drag and drop your CSV file here, or{' '}
              <span className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                Browse File
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard tabular .csv files up to ~50MB. First row should contain column headers.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Client-Side Privacy
            </span>
            <span>•</span>
            <span>No Account Required</span>
            <span>•</span>
            <span>Zero Remote Storage</span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-medium">File Processing Issue</p>
            <p className="text-xs text-rose-300/90 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Active dataset state box */}
      {datasetState && (
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100 font-mono">
                  {datasetState.filename}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Active
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <span>{formatFileSize(datasetState.fileSize)}</span>
                <span>•</span>
                <span>{datasetState.totalRows.toLocaleString()} rows</span>
                <span>•</span>
                <span>{datasetState.totalColumns} columns</span>
                <span>•</span>
                <span>Audit time: {datasetState.analysisTimeMs}ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              Replace File
            </button>
            <button
              onClick={() => setDatasetState(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs border border-slate-700 transition cursor-pointer"
              title="Remove Dataset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sample Dataset Card */}
      <div className="p-5 rounded-xl bg-linear-to-r from-purple-950/30 to-cyan-950/20 border border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Don't have a CSV handy? Try our Educational Sample Dataset
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Loads a realistic customer churn dataset (124 rows, 12 features) engineered with intentional
            data quality quirks: missing annual incomes, duplicate customers, extreme age & charge outliers,
            inconsistent city casing, class imbalance, and a post-churn survey leakage risk feature.
          </p>
        </div>
        <button
          onClick={loadSampleDataset}
          disabled={isLoading}
          className="shrink-0 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Load Sample Dataset
        </button>
      </div>
    </div>
  );
};
