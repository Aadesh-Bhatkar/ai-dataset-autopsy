import { OutlierResult, ColumnProfile } from '../types';

/**
 * Runs IQR-based outlier analysis across all numeric columns.
 */
export function detectOutliers(profiles: ColumnProfile[]): OutlierResult[] {
  const results: OutlierResult[] = [];

  for (const prof of profiles) {
    if (
      (prof.inferredType === 'Integer' || prof.inferredType === 'Decimal') &&
      prof.numericSummary
    ) {
      const {
        lowerBound,
        upperBound,
        min,
        max,
        q1,
        median,
        q3,
        iqr,
        outlierCount,
        outlierPercentage,
        outlierExamples,
      } = prof.numericSummary;

      results.push({
        column: prof.name,
        outlierCount,
        outlierPercentage,
        lowerBound,
        upperBound,
        min,
        max,
        q1,
        median,
        q3,
        iqr,
        flaggedValues: outlierExamples,
      });
    }
  }

  return results;
}
