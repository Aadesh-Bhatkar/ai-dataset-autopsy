export type InferredType =
  | 'Integer'
  | 'Decimal'
  | 'Text'
  | 'Boolean'
  | 'Date'
  | 'Categorical'
  | 'Identifier-like';

export interface NumericSummary {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outlierCount: number;
  outlierPercentage: number;
  outlierExamples: number[];
  histogram: { bin: string; count: number; min: number; max: number }[];
}

export interface CategoricalSummary {
  uniqueCount: number;
  topValues: { value: string; count: number; percentage: number }[];
  blankCount: number;
  unusualCasingFound: boolean;
  casingVariants: { lower: string; variants: string[] }[];
}

export interface ColumnProfile {
  name: string;
  inferredType: InferredType;
  totalCount: number;
  nonMissingCount: number;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  qualityStatus: 'Good' | 'Warning' | 'Critical';
  sampleValues: (string | number | boolean | null)[];
  numericSummary?: NumericSummary;
  categoricalSummary?: CategoricalSummary;
  dateSummary?: {
    earliest?: string;
    latest?: string;
    validDateCount: number;
    invalidDateCount: number;
  };
}

export interface MissingValueDetail {
  column: string;
  inferredType: InferredType;
  missingCount: number;
  missingPercentage: number;
  severity: 'No Missing Values' | 'Low Missingness' | 'Moderate Missingness' | 'High Missingness';
  recommendedTreatment: string;
  treatmentRationale: string;
}

export interface DuplicateResult {
  totalRows: number;
  duplicateCount: number;
  duplicatePercentage: number;
  duplicateIndices: number[];
  exampleDuplicates: Record<string, any>[];
  consideredColumns: string[];
}

export interface OutlierResult {
  column: string;
  outlierCount: number;
  outlierPercentage: number;
  lowerBound: number;
  upperBound: number;
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  flaggedValues: number[];
}

export interface ConsistencyFinding {
  id: string;
  issue: string;
  column: string;
  affectedCount: number;
  severity: 'Info' | 'Warning' | 'High';
  suggestedAction: string;
  sampleEvidence: string[];
}

export interface TargetAnalysisResult {
  column: string;
  isContinuous: boolean;
  uniqueCount: number;
  classDistribution?: { label: string; count: number; percentage: number }[];
  majorityClass?: { label: string; percentage: number };
  minorityClass?: { label: string; percentage: number };
  imbalanceRatio?: number;
  imbalanceSeverity?: 'Balanced' | 'Mild Imbalance' | 'Moderate Imbalance' | 'Severe Imbalance';
  regressionSummary?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
  };
  recommendedActions: string[];
}

export interface LeakageFinding {
  column: string;
  riskLevel: 'No Obvious Warning Detected' | 'Review Recommended' | 'Potential Leakage Risk';
  reason: string;
  indicator: string;
  scoreOrMetric?: string;
}

export interface CleaningRecommendation {
  id: string;
  issue: string;
  column?: string;
  evidence: string;
  recommendedAction: string;
  whyItMatters: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Missing Values' | 'Duplicates' | 'Outliers' | 'Consistency' | 'Target' | 'Leakage';
  reviewed?: boolean;
}

export interface QualityScoreBreakdown {
  overallScore: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  subScores: {
    completeness: { score: number; max: 30; label: string; description: string };
    uniqueness: { score: number; max: 20; label: string; description: string };
    consistency: { score: number; max: 25; label: string; description: string };
    integrity: { score: number; max: 15; label: string; description: string };
    structure: { score: number; max: 10; label: string; description: string };
  };
  deductions: { reason: string; points: number }[];
}

export interface DatasetState {
  filename: string;
  fileSize: number;
  rawRows: Record<string, any>[];
  headers: string[];
  totalRows: number;
  totalColumns: number;
  parsedAt: string;
  analysisTimeMs: number;
  profiles: ColumnProfile[];
  missingSummary: {
    totalMissingCells: number;
    missingRate: number;
    columnsWithMissing: number;
    details: MissingValueDetail[];
  };
  duplicateResult: DuplicateResult;
  outlierResults: OutlierResult[];
  consistencyFindings: ConsistencyFinding[];
  targetColumn: string | null;
  targetAnalysis: TargetAnalysisResult | null;
  leakageFindings: LeakageFinding[];
  recommendations: CleaningRecommendation[];
  qualityScore: QualityScoreBreakdown;
  cleanedRows?: Record<string, any>[];
  cleanedHistory?: string[];
}
