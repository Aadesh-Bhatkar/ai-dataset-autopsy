import { ColumnProfile, InferredType, NumericSummary, CategoricalSummary } from '../types';
import { isMissingValue } from './csvParser';

/**
 * Calculates standard percentiles with linear interpolation.
 */
function calculatePercentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const index = p * (sortedAsc.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedAsc[lower] * (1 - weight) + sortedAsc[upper] * weight;
}

/**
 * Infers the best data type for an array of values.
 */
export function inferColumnType(values: any[], columnName: string): InferredType {
  const nonMissing = values.filter((v) => !isMissingValue(v));
  if (nonMissing.length === 0) return 'Text';

  const stringVals = nonMissing.map((v) => String(v).trim());
  const colNameLower = columnName.toLowerCase();

  // Check Boolean
  const boolTokens = new Set(['true', 'false', '0', '1', 'yes', 'no', 'y', 'n', 't', 'f']);
  const allBoolLike = stringVals.every((v) => boolTokens.has(v.toLowerCase()));
  const uniqueSet = new Set(stringVals.map((v) => v.toLowerCase()));
  if (allBoolLike && uniqueSet.size <= 2 && !colNameLower.includes('age') && !colNameLower.includes('year') && !colNameLower.includes('month') && !colNameLower.includes('day')) {
    return 'Boolean';
  }

  // Check Numeric
  let numericCount = 0;
  let integerCount = 0;
  let decimalCount = 0;

  for (const str of stringVals) {
    // Regex for standard float/int
    if (/^-?\d+(\.\d+)?$/.test(str)) {
      numericCount++;
      if (str.includes('.')) {
        decimalCount++;
      } else {
        integerCount++;
      }
    }
  }

  const numericRatio = numericCount / stringVals.length;

  if (numericRatio >= 0.85) {
    // Check if it's identifier-like despite being numbers (e.g. customer_id = 1001, 1002...)
    const uniqueNumCount = new Set(stringVals).size;
    if (
      (colNameLower.includes('id') || colNameLower.includes('uuid') || colNameLower.includes('key')) &&
      uniqueNumCount > nonMissing.length * 0.95
    ) {
      return 'Identifier-like';
    }
    return decimalCount > 0 ? 'Decimal' : 'Integer';
  }

  // Check Date
  let dateParseCount = 0;
  for (const str of stringVals) {
    // Check reasonable date patterns (YYYY-MM-DD, MM/DD/YYYY, ISO)
    if (str.length >= 8 && (str.includes('-') || str.includes('/') || str.includes('T'))) {
      const parsed = Date.parse(str);
      if (!isNaN(parsed) && parsed > -2208988800000 && parsed < 2524608000000) {
        // Between 1900 and 2050
        dateParseCount++;
      }
    }
  }
  if (dateParseCount / stringVals.length >= 0.8) {
    return 'Date';
  }

  // Check Identifier-like for strings
  const uniqueStringCount = new Set(stringVals).size;
  const isHighCardinality = uniqueStringCount >= nonMissing.length * 0.95;
  if (
    isHighCardinality &&
    (colNameLower.includes('id') ||
      colNameLower.includes('uuid') ||
      colNameLower.includes('key') ||
      colNameLower.includes('code') ||
      colNameLower.includes('hash') ||
      colNameLower.includes('token') ||
      colNameLower.endsWith('_no'))
  ) {
    return 'Identifier-like';
  }

  // Categorical vs Text
  if (uniqueStringCount <= 35 || uniqueStringCount / nonMissing.length <= 0.15) {
    return 'Categorical';
  }

  return 'Text';
}

/**
 * Computes numeric statistics and histogram.
 */
export function profileNumericColumn(values: any[]): NumericSummary {
  const nums: number[] = [];
  for (const v of values) {
    if (!isMissingValue(v)) {
      const parsed = Number(v);
      if (!isNaN(parsed) && isFinite(parsed)) {
        nums.push(parsed);
      }
    }
  }

  if (nums.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0,
      outlierCount: 0,
      outlierPercentage: 0,
      outlierExamples: [],
      histogram: [],
    };
  }

  nums.sort((a, b) => a - b);

  const min = nums[0];
  const max = nums[nums.length - 1];
  const sum = nums.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / nums.length;

  const median = calculatePercentile(nums, 0.5);
  const q1 = calculatePercentile(nums, 0.25);
  const q3 = calculatePercentile(nums, 0.75);
  const iqr = q3 - q1;

  // Interquartile Range outlier boundaries
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Sample standard deviation
  let variance = 0;
  if (nums.length > 1) {
    variance = nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (nums.length - 1);
  }
  const stdDev = Math.sqrt(variance);

  // Detect outliers
  const outliers = nums.filter((n) => n < lowerBound || n > upperBound);
  const outlierExamples = Array.from(new Set(outliers)).slice(0, 8);

  // Generate 8-10 histogram bins
  const binCount = Math.min(10, Math.max(5, Math.floor(Math.sqrt(nums.length))));
  const range = max - min;
  const binWidth = range === 0 ? 1 : range / binCount;
  const bins: { bin: string; count: number; min: number; max: number }[] = [];

  for (let b = 0; b < binCount; b++) {
    const bMin = min + b * binWidth;
    const bMax = b === binCount - 1 ? max : min + (b + 1) * binWidth;
    bins.push({
      bin: `${bMin.toFixed(range < 10 ? 2 : 0)}-${bMax.toFixed(range < 10 ? 2 : 0)}`,
      count: 0,
      min: bMin,
      max: bMax,
    });
  }

  for (const n of nums) {
    let placed = false;
    for (let b = 0; b < binCount; b++) {
      if (n >= bins[b].min && (b === binCount - 1 ? n <= bins[b].max : n < bins[b].max)) {
        bins[b].count++;
        placed = true;
        break;
      }
    }
    if (!placed && bins.length > 0) {
      bins[bins.length - 1].count++;
    }
  }

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    q1: Math.round(q1 * 100) / 100,
    q3: Math.round(q3 * 100) / 100,
    iqr: Math.round(iqr * 100) / 100,
    lowerBound: Math.round(lowerBound * 100) / 100,
    upperBound: Math.round(upperBound * 100) / 100,
    outlierCount: outliers.length,
    outlierPercentage: Math.round((outliers.length / nums.length) * 1000) / 10,
    outlierExamples,
    histogram: bins,
  };
}

/**
 * Computes categorical statistics and casing inconsistency checks.
 */
export function profileCategoricalColumn(values: any[]): CategoricalSummary {
  const counts = new Map<string, number>();
  const casingMap = new Map<string, Set<string>>();
  let blankCount = 0;
  let totalNonMissing = 0;

  for (const v of values) {
    if (isMissingValue(v)) {
      if (typeof v === 'string' && v.length > 0 && v.trim() === '') {
        blankCount++;
      }
      continue;
    }

    const str = String(v).trim();
    totalNonMissing++;
    counts.set(str, (counts.get(str) || 0) + 1);

    // Track case variants
    const lower = str.toLowerCase();
    if (!casingMap.has(lower)) {
      casingMap.set(lower, new Set<string>());
    }
    casingMap.get(lower)!.add(str);
  }

  const topValues = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([val, cnt]) => ({
      value: val,
      count: cnt,
      percentage: totalNonMissing > 0 ? Math.round((cnt / totalNonMissing) * 1000) / 10 : 0,
    }));

  const casingVariants: { lower: string; variants: string[] }[] = [];
  for (const [lower, varSet] of casingMap.entries()) {
    if (varSet.size > 1) {
      casingVariants.push({
        lower,
        variants: Array.from(varSet),
      });
    }
  }

  return {
    uniqueCount: counts.size,
    topValues,
    blankCount,
    unusualCasingFound: casingVariants.length > 0,
    casingVariants,
  };
}

/**
 * Comprehensive profiling of all columns in dataset.
 */
export function profileDataset(headers: string[], rows: Record<string, any>[]): ColumnProfile[] {
  const totalRows = rows.length;

  return headers.map((col) => {
    const values = rows.map((r) => r[col]);
    const missingCount = values.filter(isMissingValue).length;
    const nonMissingCount = totalRows - missingCount;
    const missingPercentage = totalRows > 0 ? Math.round((missingCount / totalRows) * 1000) / 10 : 0;

    const inferredType = inferColumnType(values, col);

    const nonMissingVals = values.filter((v) => !isMissingValue(v));
    const uniqueCount = new Set(nonMissingVals.map((v) => String(v).trim())).size;

    let numericSummary: NumericSummary | undefined;
    let categoricalSummary: CategoricalSummary | undefined;

    if (inferredType === 'Integer' || inferredType === 'Decimal') {
      numericSummary = profileNumericColumn(values);
    } else {
      categoricalSummary = profileCategoricalColumn(values);
    }

    // Quality Status
    let qualityStatus: 'Good' | 'Warning' | 'Critical' = 'Good';
    if (missingPercentage > 35) {
      qualityStatus = 'Critical';
    } else if (missingPercentage > 5 || (numericSummary && numericSummary.outlierPercentage > 8)) {
      qualityStatus = 'Warning';
    } else if (categoricalSummary && categoricalSummary.unusualCasingFound) {
      qualityStatus = 'Warning';
    }

    const sampleValues = values.slice(0, 5);

    return {
      name: col,
      inferredType,
      totalCount: totalRows,
      nonMissingCount,
      missingCount,
      missingPercentage,
      uniqueCount,
      qualityStatus,
      sampleValues,
      numericSummary,
      categoricalSummary,
    };
  });
}
