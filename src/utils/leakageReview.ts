import { LeakageFinding, ColumnProfile } from '../types';
import { isMissingValue } from './csvParser';

/**
 * Calculates Pearson correlation coefficient between two numeric arrays.
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 5) return null;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  const denominator = Math.sqrt(denX * denY);
  if (denominator === 0) return 0;
  return num / denominator;
}

/**
 * Evaluates machine learning data leakage risks.
 */
export function reviewDataLeakage(
  targetColName: string | null,
  headers: string[],
  rows: Record<string, any>[],
  profiles: ColumnProfile[],
  unavailableColumns: string[] = []
): LeakageFinding[] {
  const findings: LeakageFinding[] = [];

  if (!targetColName) {
    return headers.map((col) => ({
      column: col,
      riskLevel: 'No Obvious Warning Detected',
      indicator: 'Target column not selected',
      reason: 'Select a target variable to evaluate feature associations, retrospective attributes, and leakage risks.',
    }));
  }

  const targetLower = targetColName.toLowerCase();
  const unavailableSet = new Set(unavailableColumns);

  // Extract target values
  const targetVals = rows.map((r) => r[targetColName]);
  const isTargetNumeric = targetVals.every(
    (v) => isMissingValue(v) || (!isNaN(Number(v)) && isFinite(Number(v)))
  );

  for (const col of headers) {
    if (col === targetColName) continue;

    const colLower = col.toLowerCase();
    const profile = profiles.find((p) => p.name === col);

    // 1. Explicitly marked as unavailable at prediction time
    if (unavailableSet.has(col)) {
      findings.push({
        column: col,
        riskLevel: 'Potential Leakage Risk',
        indicator: 'User-Declared Unavailable Feature',
        reason: 'You explicitly identified that this column will not be collected or accessible when making real-time predictions in production.',
      });
      continue;
    }

    // 2. Suspicious Naming Patterns
    const suspiciousKeywords = [
      'cancellation',
      'churn_reason',
      'churn_date',
      'exit_date',
      'outcome',
      'result',
      'post_',
      'survey_score',
      'termination',
      'refund_amount',
      'closed_reason',
      'discharge_date',
      'fraud_flag',
    ];

    const hasSuspiciousName = suspiciousKeywords.some((kw) => colLower.includes(kw));
    const sharesTargetPrefix =
      targetLower.length > 3 &&
      colLower.includes(targetLower) &&
      colLower !== targetLower;

    if (hasSuspiciousName || sharesTargetPrefix) {
      findings.push({
        column: col,
        riskLevel: 'Potential Leakage Risk',
        indicator: 'Retrospective or Outcome-Dependent Name Pattern',
        reason: `Feature name "${col}" suggests information collected AFTER or CONCURRENTLY with the target event (${targetColName}). Retrospective attributes cause severe train-test leakage.`,
      });
      continue;
    }

    // 3. Identifier Columns
    if (profile?.inferredType === 'Identifier-like') {
      findings.push({
        column: col,
        riskLevel: 'Review Recommended',
        indicator: 'High-Cardinality Primary Identifier',
        reason: 'ID columns can inadvertently encode batch order, user registration chronology, or data partition artifacts that the model might exploit spurious correlations from.',
      });
      continue;
    }

    // 4. Time or Date Columns
    if (profile?.inferredType === 'Date') {
      findings.push({
        column: col,
        riskLevel: 'Review Recommended',
        indicator: 'Temporal Feature / Lookahead Risk',
        reason: 'Dates must be strictly split chronologically (Time-Series Split). Random K-Fold CV on temporal data leaks future trends into past predictions.',
      });
      continue;
    }

    // 5. Check High Numeric Correlation with Target
    if (
      isTargetNumeric &&
      (profile?.inferredType === 'Integer' || profile?.inferredType === 'Decimal')
    ) {
      const pairedNumbers: { x: number; y: number }[] = [];
      for (let i = 0; i < rows.length; i++) {
        const xVal = rows[i][col];
        const yVal = rows[i][targetColName];
        if (!isMissingValue(xVal) && !isMissingValue(yVal)) {
          const xNum = Number(xVal);
          const yNum = Number(yVal);
          if (!isNaN(xNum) && !isNaN(yNum)) {
            pairedNumbers.push({ x: xNum, y: yNum });
          }
        }
      }

      const r = calculatePearsonCorrelation(
        pairedNumbers.map((p) => p.x),
        pairedNumbers.map((p) => p.y)
      );

      if (r !== null) {
        const absR = Math.abs(r);
        if (absR >= 0.90) {
          findings.push({
            column: col,
            riskLevel: 'Potential Leakage Risk',
            indicator: `Extremely High Linear Correlation (|r| = ${absR.toFixed(2)})`,
            reason: `Feature has an almost perfect mathematical correlation with "${targetColName}". Verify whether this feature is a direct proxy or calculated duplicate of the target.`,
            scoreOrMetric: `r = ${r.toFixed(3)}`,
          });
          continue;
        } else if (absR >= 0.70) {
          findings.push({
            column: col,
            riskLevel: 'Review Recommended',
            indicator: `Strong Correlation (|r| = ${absR.toFixed(2)})`,
            reason: 'High association detected. Verify that this variable is causally preceding the target and available before the event occurs.',
            scoreOrMetric: `r = ${r.toFixed(3)}`,
          });
          continue;
        }
      }
    }

    // 6. Check Target-Missingness Co-occurrence (Missingness Leakage)
    // E.g., if column is populated ONLY when target is 1
    const populatedWhenTargetPositive = rows.filter((r) => {
      const tVal = String(r[targetColName]);
      const cVal = r[col];
      return (tVal === '1' || tVal === 'true' || tVal.toLowerCase() === 'yes') && !isMissingValue(cVal);
    }).length;

    const populatedWhenTargetNegative = rows.filter((r) => {
      const tVal = String(r[targetColName]);
      const cVal = r[col];
      return (tVal === '0' || tVal === 'false' || tVal.toLowerCase() === 'no') && !isMissingValue(cVal);
    }).length;

    if (
      populatedWhenTargetPositive > 5 &&
      populatedWhenTargetNegative === 0 &&
      rows.length > 20
    ) {
      findings.push({
        column: col,
        riskLevel: 'Potential Leakage Risk',
        indicator: 'Asymmetric Presence Pattern',
        reason: `This feature is recorded exclusively when "${targetColName}" is positive, and completely unrecorded otherwise. The presence of a value itself gives away the target label.`,
      });
      continue;
    }

    // Default clean
    findings.push({
      column: col,
      riskLevel: 'No Obvious Warning Detected',
      indicator: 'Standard Feature Characteristics',
      reason: 'No naming anomalies, suspicious temporal markers, or extreme proxy correlations detected in basic screening.',
    });
  }

  return findings;
}
