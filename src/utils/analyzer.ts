import { DatasetState } from '../types';
import { profileDataset } from './dataProfiler';
import { analyzeMissingValues } from './missingValues';
import { detectDuplicates } from './duplicateDetector';
import { detectOutliers } from './outlierDetector';
import { runConsistencyChecks } from './consistencyChecker';
import { analyzeTargetColumn } from './targetAnalyzer';
import { reviewDataLeakage } from './leakageReview';
import { calculateQualityScore } from './qualityScoring';
import { generateCleaningRecommendations } from './cleaningRecommendations';

export function runFullDatasetAudit(
  headers: string[],
  rows: Record<string, any>[],
  filename: string,
  fileSize: number,
  targetColName?: string | null,
  unavailableColumns: string[] = []
): DatasetState {
  const startTime = performance.now();

  // 1. Profiling
  const profiles = profileDataset(headers, rows);

  // 2. Missing Values Analysis
  const missingSummary = analyzeMissingValues(profiles, rows.length);

  // 3. Duplicate Rows
  const duplicateResult = detectDuplicates(rows);

  // 4. Outliers via IQR
  const outlierResults = detectOutliers(profiles);

  // 5. Data Consistency Checks
  const consistencyFindings = runConsistencyChecks(headers, rows, profiles);

  // 6. Target Selection (detect intuitive target or use provided)
  let chosenTarget: string | null = targetColName ?? null;
  if (chosenTarget === null) {
    const candidates = ['churned', 'churn', 'target', 'label', 'outcome', 'is_churned', 'default', 'survived', 'converted'];
    for (const cand of candidates) {
      const match = headers.find((h) => h.toLowerCase() === cand);
      if (match) {
        chosenTarget = match;
        break;
      }
    }
  }

  // 7. Target Analysis
  const targetAnalysis = chosenTarget ? analyzeTargetColumn(chosenTarget, rows, profiles) : null;

  // 8. ML Data Leakage Review
  const leakageFindings = reviewDataLeakage(chosenTarget, headers, rows, profiles, unavailableColumns);

  // 9. Data Quality Score
  const qualityScore = calculateQualityScore(profiles, duplicateResult, consistencyFindings, rows.length);

  // 10. Prioritized Cleaning Recommendations
  const recommendations = generateCleaningRecommendations(
    profiles,
    duplicateResult,
    consistencyFindings,
    targetAnalysis,
    leakageFindings
  );

  const endTime = performance.now();
  const analysisTimeMs = Math.round((endTime - startTime) * 10) / 10;

  return {
    filename,
    fileSize,
    rawRows: rows,
    headers,
    totalRows: rows.length,
    totalColumns: headers.length,
    parsedAt: new Date().toISOString(),
    analysisTimeMs,
    profiles,
    missingSummary,
    duplicateResult,
    outlierResults,
    consistencyFindings,
    targetColumn: chosenTarget,
    targetAnalysis,
    leakageFindings,
    recommendations,
    qualityScore,
    cleanedRows: undefined,
    cleanedHistory: [],
  };
}
