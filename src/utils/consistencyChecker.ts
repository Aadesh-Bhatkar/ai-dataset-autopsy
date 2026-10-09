import { ConsistencyFinding, ColumnProfile } from '../types';
import { isMissingValue } from './csvParser';

export function runConsistencyChecks(
  headers: string[],
  rows: Record<string, any>[],
  profiles: ColumnProfile[]
): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];
  let findingId = 1;

  // 1. Check for Duplicate Column Headers (case-insensitive)
  const headerMap = new Map<string, string[]>();
  for (const h of headers) {
    const lower = h.trim().toLowerCase();
    if (!headerMap.has(lower)) {
      headerMap.set(lower, []);
    }
    headerMap.get(lower)!.push(h);
  }
  for (const [lower, matchingHeaders] of headerMap.entries()) {
    if (matchingHeaders.length > 1) {
      findings.push({
        id: `cons-${findingId++}`,
        issue: 'Duplicate or Conflicting Column Headers',
        column: matchingHeaders.join(', '),
        affectedCount: matchingHeaders.length,
        severity: 'High',
        suggestedAction: 'Rename colliding columns with unique descriptive identifiers to avoid parsing confusion.',
        sampleEvidence: matchingHeaders,
      });
    }
  }

  // 2. Column-by-column checks
  for (const prof of profiles) {
    const colValues = rows.map((r) => r[prof.name]);
    const totalCount = rows.length;

    // Check Leading / Trailing Whitespace
    const whitespaceValues: string[] = [];
    for (const v of colValues) {
      if (typeof v === 'string' && (v.startsWith(' ') || v.endsWith(' ') || v.startsWith('\t') || v.endsWith('\t'))) {
        whitespaceValues.push(`"${v}"`);
      }
    }
    if (whitespaceValues.length > 0) {
      findings.push({
        id: `cons-${findingId++}`,
        issue: 'Leading or Trailing Whitespace in String Values',
        column: prof.name,
        affectedCount: whitespaceValues.length,
        severity: 'Warning',
        suggestedAction: 'Apply string trimming (strip whitespace) before grouping, filtering, or feature encoding.',
        sampleEvidence: Array.from(new Set(whitespaceValues)).slice(0, 5),
      });
    }

    // Check Blank Strings (spaces only)
    const blankCount = colValues.filter(
      (v) => typeof v === 'string' && v.length > 0 && v.trim() === ''
    ).length;
    if (blankCount > 0) {
      findings.push({
        id: `cons-${findingId++}`,
        issue: 'Blank / Whitespace-Only Strings',
        column: prof.name,
        affectedCount: blankCount,
        severity: 'Warning',
        suggestedAction: 'Convert blank strings into explicit NULL/missing markers so imputation pipelines recognize them.',
        sampleEvidence: [`Found ${blankCount} empty whitespace cells`],
      });
    }

    // Check Categorical Casing Inconsistencies
    if (prof.categoricalSummary?.unusualCasingFound) {
      const variants = prof.categoricalSummary.casingVariants;
      const allVariantExamples = variants.flatMap((v) => v.variants);
      findings.push({
        id: `cons-${findingId++}`,
        issue: 'Inconsistent Category Casing',
        column: prof.name,
        affectedCount: variants.length,
        severity: 'Warning',
        suggestedAction: 'Standardize casing (e.g. Title Case or Lowercase) to prevent redundant duplicate category levels.',
        sampleEvidence: allVariantExamples.slice(0, 6),
      });
    }

    // Check Constant-Value Column (Zero Variance)
    if (prof.uniqueCount === 1 && prof.missingCount === 0) {
      findings.push({
        id: `cons-${findingId++}`,
        issue: 'Constant-Value Column (Zero Variance)',
        column: prof.name,
        affectedCount: totalCount,
        severity: 'High',
        suggestedAction: 'Drop this feature prior to model training. Features with zero variance convey zero predictive information.',
        sampleEvidence: [String(prof.sampleValues[0])],
      });
    } else if (prof.uniqueCount === 2 && prof.missingCount === 0) {
      // Check Nearly Constant Column (>98% same value)
      if (prof.categoricalSummary?.topValues && prof.categoricalSummary.topValues.length > 0) {
        const topRatio = prof.categoricalSummary.topValues[0].percentage;
        if (topRatio >= 98) {
          findings.push({
            id: `cons-${findingId++}`,
            issue: 'Nearly-Constant Column (Near-Zero Variance)',
            column: prof.name,
            affectedCount: Math.round((topRatio / 100) * totalCount),
            severity: 'Warning',
            suggestedAction: `Over ${topRatio}% of values are identical ("${prof.categoricalSummary.topValues[0].value}"). Verify whether this column adds genuine signal.`,
            sampleEvidence: [`${prof.categoricalSummary.topValues[0].value} (${topRatio}%)`],
          });
        }
      }
    }

    // Check Identifier-Like Column
    if (prof.inferredType === 'Identifier-like') {
      findings.push({
        id: `cons-${findingId++}`,
        issue: 'High-Cardinality Identifier-Like Feature',
        column: prof.name,
        affectedCount: prof.uniqueCount,
        severity: 'Warning',
        suggestedAction: 'Exclude from machine learning feature set. Using high-cardinality IDs can lead to model memorization and overfitting.',
        sampleEvidence: prof.sampleValues.slice(0, 4).map(String),
      });
    }

    // Check Numeric Column with unexpected text corrupted entries
    if (prof.inferredType === 'Integer' || prof.inferredType === 'Decimal') {
      const nonMissingRaw = colValues.filter((v) => !isMissingValue(v));
      const corruptedStrings = nonMissingRaw.filter((v) => {
        const str = String(v).trim();
        return isNaN(Number(str));
      });
      if (corruptedStrings.length > 0) {
        findings.push({
          id: `cons-${findingId++}`,
          issue: 'Unexpected Non-Numeric Characters in Numeric Column',
          column: prof.name,
          affectedCount: corruptedStrings.length,
          severity: 'High',
          suggestedAction: 'Clean corrupted string markers (e.g., "$", "N/A", text annotations) and convert to clean numeric types.',
          sampleEvidence: Array.from(new Set(corruptedStrings.map(String))).slice(0, 5),
        });
      }
    }
  }

  return findings;
}
