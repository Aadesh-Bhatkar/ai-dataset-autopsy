import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  AlertOctagon,
  Copy,
  TrendingDown,
  Target,
  ShieldAlert,
  Sparkles,
  Wrench,
  Bot,
  FileDown,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DatasetState } from '../types';

export type NavTab =
  | 'overview'
  | 'upload'
  | 'profile'
  | 'missing'
  | 'duplicates'
  | 'outliers'
  | 'target'
  | 'leakage'
  | 'recommendations'
  | 'workspace'
  | 'ai-analyst'
  | 'export'
  | 'about';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  datasetState: DatasetState | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  datasetState,
  isOpen,
  setIsOpen,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload Dataset', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'profile', label: 'Data Profile', icon: <FileSpreadsheet className="w-4 h-4" /> },
    {
      id: 'missing',
      label: 'Missing Values',
      icon: <AlertOctagon className="w-4 h-4" />,
      badge: datasetState && datasetState.missingSummary.totalMissingCells > 0 ? `${datasetState.missingSummary.missingRate}%` : undefined,
    },
    {
      id: 'duplicates',
      label: 'Duplicate Records',
      icon: <Copy className="w-4 h-4" />,
      badge: datasetState && datasetState.duplicateResult.duplicateCount > 0 ? `${datasetState.duplicateResult.duplicateCount}` : undefined,
    },
    {
      id: 'outliers',
      label: 'Outlier Detection',
      icon: <TrendingDown className="w-4 h-4" />,
      badge: datasetState ? `${datasetState.outlierResults.reduce((a, b) => a + b.outlierCount, 0)}` : undefined,
    },
    { id: 'target', label: 'Target Analysis', icon: <Target className="w-4 h-4" /> },
    {
      id: 'leakage',
      label: 'Leakage Risk Review',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: datasetState?.leakageFindings.some((l) => l.riskLevel === 'Potential Leakage Risk') ? 'Risk' : undefined,
    },
    {
      id: 'recommendations',
      label: 'Cleaning Recommendations',
      icon: <Sparkles className="w-4 h-4" />,
      badge: datasetState ? `${datasetState.recommendations.length}` : undefined,
    },
    { id: 'workspace', label: 'Cleaning Workspace', icon: <Wrench className="w-4 h-4" /> },
    { id: 'ai-analyst', label: 'AI Data Analyst', icon: <Bot className="w-4 h-4" /> },
    { id: 'export', label: 'Export Report', icon: <FileDown className="w-4 h-4" /> },
    { id: 'about', label: 'About Project', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0e1626] border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Tagline */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <span className="font-mono font-bold text-sm">DA</span>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Dataset Autopsy
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  AI
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">Intelligent Data Quality</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Current Dataset Mini Card */}
        {datasetState ? (
          <div className="p-3 mx-3 my-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 truncate max-w-[140px] font-mono text-[11px]" title={datasetState.filename}>
                {datasetState.filename}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                datasetState.qualityScore.overallScore >= 80
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : datasetState.qualityScore.overallScore >= 60
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                Score: {datasetState.qualityScore.overallScore}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{datasetState.totalRows.toLocaleString()} rows</span>
              <span>{datasetState.totalColumns} cols</span>
            </div>
          </div>
        ) : (
          <div className="p-3 mx-3 my-2.5 rounded-lg bg-slate-900/50 border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No dataset loaded yet
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isDisabled =
              !datasetState &&
              item.id !== 'upload' &&
              item.id !== 'overview' &&
              item.id !== 'about';

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isDisabled) {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }
                }}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : isDisabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span className={isActive ? 'text-purple-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                      item.badge === 'Risk'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>In-browser local processing</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Local Engine Active" />
        </div>
      </aside>
    </>
  );
};
