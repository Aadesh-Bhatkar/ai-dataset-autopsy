import {
  CleaningRecommendation,
  ColumnProfile,
  DuplicateResult,
  ConsistencyFinding,
  TargetAnalysisResult,
  LeakageFinding,
} from '../types';

export function generateCleaningRecommendations(
  profiles: ColumnProfile[],
  duplicateResult: DuplicateResult,
  consistencyFindings: ConsistencyFinding[],
  targetAnalysis: TargetAnalysisResult | null,
  leakageFindings: LeakageFinding[]
): CleaningRecommendation[] {
  const recommendations: CleaningRecommendation[] = [];
  let recId = 1;

  // 1. Duplicate Rows
  if (duplicateResult.duplicateCount > 0) {
    recommendations.push({
      id: `rec-${recId++}`,
      category: 'Duplicates',
      issue: `${duplicateResult.duplicateCount} Exact Duplicate Rows Found`,
      evidence: `${duplicateResult.duplicatePercentage}% of dataset observations are exact duplicates across examined columns.`,
      recommendedAction:
        'Remove redundant duplicate observations in the Cleaning Workspace or preserve one distinct representative row.',
      whyItMatters:
        'Duplicate records artificially inflate metric importance, skew cross-validation splits, and can cause training and test sets to share identical data points (data snooping).',
      priority: 'High',
      reviewed: false,
    });
  }

  // 2. High & Moderate Missing Values
  for (const prof of profiles) {
    if (prof.missingPercentage > 50) {
      recommendations.push({
        id: `rec-${recId++}`,
        category: 'Missing Values',
        column: prof.name,
        issue: `Critical Missingness in "${prof.name}" (${prof.missingPercentage}%)`,
        evidence: `Column has ${prof.missingCount} missing out of ${prof.totalCount} rows.`,
        recommendedAction:
          'Evaluate if this feature is expendable. If dropping, verify that the missingness mechanism is non-informative; otherwise, create a binary flag "is_missing".',
        whyItMatters:
          'Imputing more than half the values artificially suppresses real variance and injects fabricated structure into feature space.',
        priority: 'High',
        reviewed: false,
      });
    } else if (prof.missingPercentage > 0) {
      const isNum = prof.inferredType === 'Integer' || prof.inferredType === 'Decimal';
      const hasOutliers = (prof.numericSummary?.outlierCount || 0) > 0;
      recommendations.push({
        id: `rec-${recId++}`,
        category: 'Missing Values',
        column: prof.name,
        issue: `Missing Values in "${prof.name}" (${prof.missingPercentage}%)`,
        evidence: `Column contains ${prof.missingCount} missing cells.`,
        recommendedAction: isNum
          ? hasOutliers
            ? 'Impute with Median rather than Mean to avoid outlier bias.'
            : 'Impute with Mean, Median, or KNN.'
          : 'Impute with Mode (most frequent) or create an explicit "Unknown" category.',
        whyItMatters:
          'Many machine learning algorithms (like standard Logistic Regression, SVMs, and neural networks) will fail or throw errors when receiving NaN values.',
        priority: prof.missingPercentage > 15 ? 'High' : 'Medium',
        reviewed: false,
      });
    }
  }

  // 3. Consistency Findings
  for (const finding of consistencyFindings) {
    recommendations.push({
      id: `rec-${recId++}`,
      category: 'Consistency',
      column: finding.column,
      issue: finding.issue,
      evidence: `Affects ${finding.affectedCount} values/occurrences. Examples: ${finding.sampleEvidence.join(', ')}`,
      recommendedAction: finding.suggestedAction,
      whyItMatters:
        'Formatting artifacts and case discrepancies cause categorical encoders (e.g. One-Hot Encoding) to treat identical concepts as distinct categories.',
      priority: finding.severity === 'High' ? 'High' : finding.severity === 'Warning' ? 'Medium' : 'Low',
      reviewed: false,
    });
  }

  // 4. Outliers
  for (const prof of profiles) {
    if (prof.numericSummary && prof.numericSummary.outlierCount > 0) {
      const { outlierCount, outlierPercentage, lowerBound, upperBound, outlierExamples } =
        prof.numericSummary;
      recommendations.push({
        id: `rec-${recId++}`,
        category: 'Outliers',
        column: prof.name,
        issue: `Statistical Outliers in "${prof.name}" (${outlierPercentage}%)`,
        evidence: `Flagged ${outlierCount} values outside IQR bounds [${lowerBound}, ${upperBound}]. Examples: ${outlierExamples.join(', ')}`,
        recommendedAction:
          'Inspect flagged values against domain boundaries. Do not automatically delete valid extreme measurements. Consider winsorizing, log transformations, or tree-based models.',
        whyItMatters:
          'Extreme outliers heavily distort linear algorithms, OLS regression lines, and distance-based estimators like KNN and K-Means.',
        priority: outlierPercentage > 10 ? 'High' : 'Medium',
        reviewed: false,
      });
    }
  }

  // 5. Target Imbalance
  if (targetAnalysis && !targetAnalysis.isContinuous && targetAnalysis.imbalanceSeverity !== 'Balanced') {
    recommendations.push({
      id: `rec-${recId++}`,
      category: 'Target',
      column: targetAnalysis.column,
      issue: `Target Class Imbalance: ${targetAnalysis.imbalanceSeverity}`,
      evidence: `Majority class "${targetAnalysis.majorityClass?.label}" represents ${targetAnalysis.majorityClass?.percentage}% of samples (Ratio: ${targetAnalysis.imbalanceRatio}:1).`,
      recommendedAction:
        'Adopt PR-AUC and Balanced Accuracy metrics instead of standard accuracy. Enforce Stratified K-Fold validation and evaluate class weights.',
      whyItMatters:
        'Class imbalance easily results in models that achieve high nominal accuracy by predicting only the dominant class while failing to detect the minority class of interest.',
      priority: targetAnalysis.imbalanceSeverity === 'Severe Imbalance' ? 'High' : 'Medium',
      reviewed: false,
    });
  }

  // 6. Leakage Findings
  const riskyLeakages = leakageFindings.filter(
    (l) => l.riskLevel === 'Potential Leakage Risk' || l.riskLevel === 'Review Recommended'
  );
  for (const leak of riskyLeakages) {
    recommendations.push({
      id: `rec-${recId++}`,
      category: 'Leakage',
      column: leak.column,
      issue: `Data Leakage Risk: "${leak.column}"`,
      evidence: `${leak.indicator}. ${leak.reason}`,
      recommendedAction:
        'Confirm whether this feature will realistically be recorded and accessible at the precise moment inference occurs in production. If not, drop it from model training.',
      whyItMatters:
        'Data leakage produces unrealistically optimistic test scores during offline development, followed by catastrophic model failure once deployed in the real world.',
      priority: leak.riskLevel === 'Potential Leakage Risk' ? 'High' : 'Medium',
      reviewed: false,
    });
  }

  return recommendations;
}
