import { QualityScoreBreakdown, ColumnProfile, DuplicateResult, ConsistencyFinding } from '../types';

export function calculateQualityScore(
  profiles: ColumnProfile[],
  duplicateResult: DuplicateResult,
  consistencyFindings: ConsistencyFinding[],
  totalRows: number
): QualityScoreBreakdown {
  const deductions: { reason: string; points: number }[] = [];

  // 1. Completeness Score (Max 30)
  const totalCells = totalRows * profiles.length;
  const totalMissing = profiles.reduce((acc, p) => acc + p.missingCount, 0);
  const overallMissingRate = totalCells > 0 ? totalMissing / totalCells : 0;

  let completenessDeduction = 0;
  if (overallMissingRate > 0) {
    completenessDeduction = Math.min(30, Math.round(overallMissingRate * 80 * 10) / 10);
    deductions.push({
      reason: `Dataset has ${(overallMissingRate * 100).toFixed(1)}% missing cells overall`,
      points: completenessDeduction,
    });
  }
  const completenessScore = Math.max(0, Math.round(30 - completenessDeduction));

  // 2. Uniqueness Score (Max 20)
  const dupRate = duplicateResult.duplicatePercentage / 100;
  let uniquenessDeduction = 0;
  if (duplicateResult.duplicateCount > 0) {
    uniquenessDeduction = Math.min(20, Math.round(dupRate * 100 + (duplicateResult.duplicateCount > 0 ? 5 : 0)));
    deductions.push({
      reason: `Found ${duplicateResult.duplicateCount} duplicate row(s) (${duplicateResult.duplicatePercentage}%)`,
      points: uniquenessDeduction,
    });
  }
  const uniquenessScore = Math.max(0, Math.round(20 - uniquenessDeduction));

  // 3. Consistency Score (Max 25)
  let consistencyDeduction = 0;
  const highSeverityCons = consistencyFindings.filter((c) => c.severity === 'High');
  const warnSeverityCons = consistencyFindings.filter((c) => c.severity === 'Warning');

  if (highSeverityCons.length > 0) {
    const pts = Math.min(15, highSeverityCons.length * 5);
    consistencyDeduction += pts;
    deductions.push({
      reason: `${highSeverityCons.length} high-severity consistency defect(s) detected`,
      points: pts,
    });
  }

  if (warnSeverityCons.length > 0) {
    const pts = Math.min(10, warnSeverityCons.length * 2);
    consistencyDeduction += pts;
    deductions.push({
      reason: `${warnSeverityCons.length} category casing, whitespace, or cardinality warning(s)`,
      points: pts,
    });
  }
  const consistencyScore = Math.max(0, Math.round(25 - consistencyDeduction));

  // 4. Integrity / Outliers Score (Max 15)
  let integrityDeduction = 0;
  let totalOutlierCount = 0;
  for (const prof of profiles) {
    if (prof.numericSummary && prof.numericSummary.outlierCount > 0) {
      totalOutlierCount += prof.numericSummary.outlierCount;
    }
  }
  if (totalOutlierCount > 0) {
    integrityDeduction = Math.min(15, Math.ceil(totalOutlierCount * 0.5));
    deductions.push({
      reason: `${totalOutlierCount} statistical outlier values flagged via IQR check`,
      points: integrityDeduction,
    });
  }
  const integrityScore = Math.max(0, Math.round(15 - integrityDeduction));

  // 5. Structure & Variance Score (Max 10)
  let structureDeduction = 0;
  const zeroVarCols = profiles.filter((p) => p.uniqueCount <= 1 && p.missingCount === 0);
  if (zeroVarCols.length > 0) {
    structureDeduction += Math.min(10, zeroVarCols.length * 4);
    deductions.push({
      reason: `${zeroVarCols.length} zero-variance column(s) detected`,
      points: structureDeduction,
    });
  }
  const structureScore = Math.max(0, Math.round(10 - structureDeduction));

  const overallScore = Math.max(
    0,
    Math.min(100, completenessScore + uniquenessScore + consistencyScore + integrityScore + structureScore)
  );

  let rating: QualityScoreBreakdown['rating'] = 'Good';
  if (overallScore >= 88) rating = 'Excellent';
  else if (overallScore >= 72) rating = 'Good';
  else if (overallScore >= 55) rating = 'Fair';
  else rating = 'Poor';

  return {
    overallScore,
    rating,
    subScores: {
      completeness: {
        score: completenessScore,
        max: 30,
        label: 'Completeness',
        description: 'Absence of empty, null, or missing cells across all columns.',
      },
      uniqueness: {
        score: uniquenessScore,
        max: 20,
        label: 'Uniqueness',
        description: 'Deduplication across observations to avoid repeated rows.',
      },
      consistency: {
        score: consistencyScore,
        max: 25,
        label: 'Consistency',
        description: 'Uniform formatting, casing, whitespace, and type conformity.',
      },
      integrity: {
        score: integrityScore,
        max: 15,
        label: 'Integrity',
        description: 'Absence of extreme distribution distortions and value corruption.',
      },
      structure: {
        score: structureScore,
        max: 10,
        label: 'Structure & Variance',
        description: 'Adequate variance and feature information content.',
      },
    },
    deductions,
  };
}
