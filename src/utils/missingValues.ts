import { ColumnProfile, MissingValueDetail } from '../types';

export interface MissingAnalysisResult {
  totalCells: number;
  totalMissingCells: number;
  missingRate: number;
  columnsWithMissing: number;
  details: MissingValueDetail[];
}

export function analyzeMissingValues(profiles: ColumnProfile[], totalRows: number): MissingAnalysisResult {
  const totalCells = totalRows * profiles.length;
  let totalMissingCells = 0;
  let columnsWithMissing = 0;

  const details: MissingValueDetail[] = profiles.map((p) => {
    totalMissingCells += p.missingCount;
    if (p.missingCount > 0) {
      columnsWithMissing++;
    }

    let severity: MissingValueDetail['severity'] = 'No Missing Values';
    if (p.missingPercentage === 0) {
      severity = 'No Missing Values';
    } else if (p.missingPercentage < 5) {
      severity = 'Low Missingness';
    } else if (p.missingPercentage <= 20) {
      severity = 'Moderate Missingness';
    } else {
      severity = 'High Missingness';
    }

    let recommendedTreatment = 'None required (column is 100% complete)';
    let treatmentRationale = 'All observations possess verified recorded values.';

    if (p.missingPercentage > 0) {
      if (p.missingPercentage > 60) {
        recommendedTreatment = 'Consider column drop or binary missingness flag (is_missing)';
        treatmentRationale = `Over 60% of data is unobserved (${p.missingPercentage}%). Direct imputation could introduce severe artificial variance or bias. Evaluate whether missingness itself carries informative signal before dropping.`;
      } else if (p.inferredType === 'Integer' || p.inferredType === 'Decimal') {
        const hasOutliers = (p.numericSummary?.outlierCount || 0) > 0;
        if (hasOutliers) {
          recommendedTreatment = 'Median Imputation';
          treatmentRationale = `Column contains ${p.numericSummary?.outlierCount} outliers. The median is resistant to skewness, whereas mean imputation would be distorted by extreme observations.`;
        } else {
          recommendedTreatment = 'Mean or Median Imputation';
          treatmentRationale = 'Distribution appears relatively balanced. For linear models, verify that reducing variance via single-value imputation is acceptable, or use KNN/Iterative imputer.';
        }
      } else if (p.inferredType === 'Categorical' || p.inferredType === 'Text') {
        if (p.missingPercentage < 5) {
          recommendedTreatment = 'Mode (Most Frequent) Imputation';
          treatmentRationale = 'Low missingness rate (< 5%) allows replacing missing entries with the dominant class without heavily shifting category proportions.';
        } else {
          recommendedTreatment = 'Explicit "Unknown" or "Missing" Category';
          treatmentRationale = `Missingness (${p.missingPercentage}%) may represent a distinct customer state or uncollected response. Encoding it as "Unknown" preserves the missingness pattern for tree-based models.`;
        }
      } else if (p.inferredType === 'Date') {
        recommendedTreatment = 'Forward-Fill (ffill) or Linear Time Interpolation';
        treatmentRationale = 'For temporal records, propagate the most recently observed timestamp or perform sequential time-series interpolation.';
      } else if (p.inferredType === 'Identifier-like') {
        recommendedTreatment = 'Investigate record generation / Exclude unkeyed rows';
        treatmentRationale = 'Primary keys and entity identifiers should not be imputed. Missing IDs usually point to data pipeline or ingestion errors.';
      } else {
        recommendedTreatment = 'Mode imputation or review source system';
        treatmentRationale = 'Assess whether data is Missing Completely at Random (MCAR) or Missing at Random (MAR).';
      }
    }

    return {
      column: p.name,
      inferredType: p.inferredType,
      missingCount: p.missingCount,
      missingPercentage: p.missingPercentage,
      severity,
      recommendedTreatment,
      treatmentRationale,
    };
  });

  const missingRate = totalCells > 0 ? Math.round((totalMissingCells / totalCells) * 1000) / 10 : 0;

  return {
    totalCells,
    totalMissingCells,
    missingRate,
    columnsWithMissing,
    details,
  };
}
