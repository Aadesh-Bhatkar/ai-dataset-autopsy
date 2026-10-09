import { TargetAnalysisResult, ColumnProfile } from '../types';
import { isMissingValue } from './csvParser';

export function analyzeTargetColumn(
  targetColName: string,
  rows: Record<string, any>[],
  profiles: ColumnProfile[]
): TargetAnalysisResult {
  const profile = profiles.find((p) => p.name === targetColName);
  const values = rows.map((r) => r[targetColName]).filter((v) => !isMissingValue(v));

  const totalValid = values.length;
  const uniqueVals = Array.from(new Set(values.map(String)));
  const uniqueCount = uniqueVals.length;

  const isNumericType =
    profile?.inferredType === 'Integer' || profile?.inferredType === 'Decimal';

  // If continuous numeric with many unique values (> 15), classify as regression target
  if (isNumericType && uniqueCount > 15) {
    const nums = values.map(Number).filter((n) => !isNaN(n));
    nums.sort((a, b) => a - b);
    const sum = nums.reduce((acc, curr) => acc + curr, 0);
    const mean = nums.length > 0 ? sum / nums.length : 0;
    const median = nums.length > 0 ? nums[Math.floor(nums.length / 2)] : 0;
    const min = nums.length > 0 ? nums[0] : 0;
    const max = nums.length > 0 ? nums[nums.length - 1] : 0;
    const variance =
      nums.length > 1
        ? nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (nums.length - 1)
        : 0;
    const stdDev = Math.sqrt(variance);

    const recommendedActions = [
      'This column appears continuous. Treat as a Regression target rather than discrete classification.',
      'Evaluate target distribution skewness; consider log or Box-Cox transformations if heavy right-skew exists.',
      'Check for extreme target outliers that could disproportionately inflate Mean Squared Error (MSE) loss.',
      'Use robust evaluation metrics like Mean Absolute Error (MAE) alongside RMSE.',
    ];

    return {
      column: targetColName,
      isContinuous: true,
      uniqueCount,
      regressionSummary: {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
      },
      recommendedActions,
    };
  }

  // Classification Target Analysis
  const counts = new Map<string, number>();
  for (const v of values) {
    const key = String(v).trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const distribution = Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: totalValid > 0 ? Math.round((count / totalValid) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const majorityClass = distribution[0]
    ? { label: distribution[0].label, percentage: distribution[0].percentage }
    : undefined;
  const minorityClass = distribution[distribution.length - 1]
    ? {
        label: distribution[distribution.length - 1].label,
        percentage: distribution[distribution.length - 1].percentage,
      }
    : undefined;

  let imbalanceRatio = 1;
  if (majorityClass && minorityClass && minorityClass.percentage > 0) {
    imbalanceRatio = Math.round((majorityClass.percentage / minorityClass.percentage) * 10) / 10;
  }

  let imbalanceSeverity: TargetAnalysisResult['imbalanceSeverity'] = 'Balanced';
  if (majorityClass) {
    if (majorityClass.percentage > 90) {
      imbalanceSeverity = 'Severe Imbalance';
    } else if (majorityClass.percentage > 75) {
      imbalanceSeverity = 'Moderate Imbalance';
    } else if (majorityClass.percentage >= 60) {
      imbalanceSeverity = 'Mild Imbalance';
    } else {
      imbalanceSeverity = 'Balanced';
    }
  }

  const recommendedActions: string[] = [];
  if (imbalanceSeverity === 'Severe Imbalance' || imbalanceSeverity === 'Moderate Imbalance') {
    recommendedActions.push(
      'Never rely on plain Accuracy metric. A trivial model predicting only the majority class will yield misleading high accuracy.'
    );
    recommendedActions.push(
      'Evaluate with Precision-Recall AUC (PR-AUC), F1-Score (macro or minority class), and Balanced Accuracy.'
    );
    recommendedActions.push(
      'Enforce Stratified K-Fold cross-validation to maintain consistent class proportions across train/validation splits.'
    );
    recommendedActions.push(
      'Use algorithmic balancing such as cost-sensitive learning (class_weight="balanced" in Scikit-Learn or scale_pos_weight in XGBoost).'
    );
    recommendedActions.push(
      'If applying resampling (SMOTE, ADASYN, Random Undersampling), apply ONLY to training folds—never leak resampled records into validation or test sets.'
    );
  } else {
    recommendedActions.push('Class proportions are relatively well-balanced. Standard cross-validation and classification loss functions are suitable.');
  }

  return {
    column: targetColName,
    isContinuous: false,
    uniqueCount,
    classDistribution: distribution,
    majorityClass,
    minorityClass,
    imbalanceRatio,
    imbalanceSeverity,
    recommendedActions,
  };
}
