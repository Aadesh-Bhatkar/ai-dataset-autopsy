import React, { useState } from 'react';
import { Menu, Sparkles, UploadCloud, ShieldCheck, FileDown, Layers } from 'lucide-react';
import { DatasetState, LeakageFinding } from './types';
import { Sidebar, NavTab } from './components/Sidebar';
import { FileUploader } from './components/FileUploader';
import { HomeLanding } from './components/HomeLanding';
import { DatasetOverview } from './components/DatasetOverview';
import { DataProfile } from './components/DataProfile';
import { MissingValueAnalysis } from './components/MissingValueAnalysis';
import { DuplicateAnalysis } from './components/DuplicateAnalysis';
import { OutlierAnalysis } from './components/OutlierAnalysis';
import { ConsistencyChecks } from './components/ConsistencyChecks';
import { TargetAnalysis } from './components/TargetAnalysis';
import { LeakageReview } from './components/LeakageReview';
import { CleaningRecommendations } from './components/CleaningRecommendations';
import { CleaningWorkspace } from './components/CleaningWorkspace';
import { AIDataAnalyst } from './components/AIDataAnalyst';
import { ReportExporter } from './components/ReportExporter';
import { AboutProject } from './components/AboutProject';
import { generateSampleDatasetCSV } from './utils/sampleDataset';
import { parseCSVString } from './utils/csvParser';
import { runFullDatasetAudit } from './utils/analyzer';
import { analyzeTargetColumn } from './utils/targetAnalyzer';
import { reviewDataLeakage } from './utils/leakageReview';
import { generateCleaningRecommendations } from './utils/cleaningRecommendations';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [datasetState, setDatasetState] = useState<DatasetState | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load sample dataset shortcut
  const handleLoadSample = async () => {
    const csv = generateSampleDatasetCSV();
    const parsed = await parseCSVString(csv);
    const audit = runFullDatasetAudit(parsed.headers, parsed.data, 'sample_customer_churn_analytics.csv', 18450);
    setDatasetState(audit);
    setActiveTab('overview');
  };

  // Change ML Target Column
  const handleTargetChange = (newTarget: string) => {
    if (!datasetState) return;
    const targetAnalysis = analyzeTargetColumn(newTarget, datasetState.rawRows, datasetState.profiles);
    const leakageFindings = reviewDataLeakage(newTarget, datasetState.headers, datasetState.rawRows, datasetState.profiles);
    const recommendations = generateCleaningRecommendations(
      datasetState.profiles,
      datasetState.duplicateResult,
      datasetState.consistencyFindings,
      targetAnalysis,
      leakageFindings
    );

    setDatasetState({
      ...datasetState,
      targetColumn: newTarget,
      targetAnalysis,
      leakageFindings,
      recommendations,
    });
  };

  // Update Leakage Findings
  const handleUpdateLeakage = (findings: LeakageFinding[], unavailableCols: string[]) => {
    if (!datasetState) return;
    const recommendations = generateCleaningRecommendations(
      datasetState.profiles,
      datasetState.duplicateResult,
      datasetState.consistencyFindings,
      datasetState.targetAnalysis,
      findings
    );

    setDatasetState({
      ...datasetState,
      leakageFindings: findings,
      recommendations,
    });
  };

  // Toggle Reviewed status on recommendation
  const handleToggleReviewed = (recId: string) => {
    if (!datasetState) return;
    const updated = datasetState.recommendations.map((r) =>
      r.id === recId ? { ...r, reviewed: !r.reviewed } : r
    );
    setDatasetState({
      ...datasetState,
      recommendations: updated,
    });
  };

  // Update Cleaned dataset in memory
  const handleUpdateCleanedDataset = (cleanedRows: Record<string, any>[], historyLog: string[]) => {
    if (!datasetState) return;
    setDatasetState({
      ...datasetState,
      cleanedRows,
      cleanedHistory: historyLog,
    });
  };

  // Render main tab view
  const renderTabContent = () => {
    // If no dataset loaded and on overview, show landing page
    if (!datasetState && activeTab === 'overview') {
      return (
        <HomeLanding
          onGoToUpload={() => setActiveTab('upload')}
          onLoadSample={handleLoadSample}
        />
      );
    }

    switch (activeTab) {
      case 'overview':
        return datasetState ? (
          <DatasetOverview state={datasetState} onNavigate={(tab) => setActiveTab(tab)} />
        ) : (
          <HomeLanding
            onGoToUpload={() => setActiveTab('upload')}
            onLoadSample={handleLoadSample}
          />
        );

      case 'upload':
        return (
          <FileUploader
            datasetState={datasetState}
            setDatasetState={(st) => {
              setDatasetState(st);
              if (st) setActiveTab('overview');
            }}
            onUploadSuccess={() => setActiveTab('overview')}
          />
        );

      case 'profile':
        return datasetState ? <DataProfile state={datasetState} /> : null;

      case 'missing':
        return datasetState ? <MissingValueAnalysis state={datasetState} /> : null;

      case 'duplicates':
        return datasetState ? (
          <DuplicateAnalysis
            state={datasetState}
            onUpdateCleanedRows={(cleaned, msg) => {
              const hist = [...(datasetState.cleanedHistory || []), msg];
              handleUpdateCleanedDataset(cleaned, hist);
            }}
          />
        ) : null;

      case 'outliers':
        return datasetState ? <OutlierAnalysis state={datasetState} /> : null;

      case 'target':
        return datasetState ? (
          <TargetAnalysis state={datasetState} onTargetChange={handleTargetChange} />
        ) : null;

      case 'leakage':
        return datasetState ? (
          <LeakageReview state={datasetState} onUpdateLeakage={handleUpdateLeakage} />
        ) : null;

      case 'recommendations':
        return datasetState ? (
          <CleaningRecommendations
            state={datasetState}
            onNavigateToWorkspace={() => setActiveTab('workspace')}
            onToggleReviewed={handleToggleReviewed}
          />
        ) : null;

      case 'workspace':
        return datasetState ? (
          <CleaningWorkspace
            state={datasetState}
            onUpdateCleanedDataset={handleUpdateCleanedDataset}
          />
        ) : null;

      case 'ai-analyst':
        return datasetState ? <AIDataAnalyst state={datasetState} /> : null;

      case 'export':
        return datasetState ? <ReportExporter state={datasetState} /> : null;

      case 'about':
        return <AboutProject />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetState={datasetState}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800/80 bg-[#0e1626]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-purple-400">
                {activeTab.replace('-', ' ')}
              </span>
              {datasetState && (
                <span className="hidden sm:inline-flex text-xs text-slate-500 font-mono">
                  / {datasetState.filename}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!datasetState ? (
              <button
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold border border-purple-800/80 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Try</span> Sample Dataset
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload New</span>
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Report</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
