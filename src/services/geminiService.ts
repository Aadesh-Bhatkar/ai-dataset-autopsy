import { DatasetState } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isRuleBased?: boolean;
}

/**
 * Extracts a privacy-safe, aggregate-only summary of computed metrics.
 * Note: Never includes raw individual rows or user PII.
 */
export function buildPrivacySafeSummary(state: DatasetState) {
  return {
    filename: state.filename,
    totalRows: state.totalRows,
    totalColumns: state.totalColumns,
    overallQualityScore: state.qualityScore.overallScore,
    qualityRating: state.qualityScore.rating,
    missingValues: {
      totalMissingCells: state.missingSummary.totalMissingCells,
      overallMissingPercentage: state.missingSummary.missingRate,
      columnsWithMissing: state.missingSummary.columnsWithMissing,
      columnMissingBreakdown: state.missingSummary.details.map((d) => ({
        column: d.column,
        missingPercentage: d.missingPercentage,
        inferredType: d.inferredType,
        recommendation: d.recommendedTreatment,
      })),
    },
    duplicates: {
      duplicateRowCount: state.duplicateResult.duplicateCount,
      duplicatePercentage: state.duplicateResult.duplicatePercentage,
    },
    outliers: state.outlierResults.map((o) => ({
      column: o.column,
      outlierCount: o.outlierCount,
      outlierPercentage: o.outlierPercentage,
      bounds: [o.lowerBound, o.upperBound],
    })),
    consistencyIssues: state.consistencyFindings.map((c) => ({
      issue: c.issue,
      column: c.column,
      severity: c.severity,
      affectedCount: c.affectedCount,
    })),
    targetAnalysis: state.targetAnalysis
      ? {
          column: state.targetAnalysis.column,
          isContinuous: state.targetAnalysis.isContinuous,
          imbalanceSeverity: state.targetAnalysis.imbalanceSeverity,
          majorityClass: state.targetAnalysis.majorityClass,
          minorityClass: state.targetAnalysis.minorityClass,
          imbalanceRatio: state.targetAnalysis.imbalanceRatio,
        }
      : null,
    leakageRisks: state.leakageFindings
      .filter((l) => l.riskLevel !== 'No Obvious Warning Detected')
      .map((l) => ({
        column: l.column,
        riskLevel: l.riskLevel,
        reason: l.reason,
      })),
    topCleaningRecommendations: state.recommendations.slice(0, 5).map((r) => ({
      issue: r.issue,
      priority: r.priority,
      recommendedAction: r.recommendedAction,
    })),
  };
}

/**
 * Intelligent local rule-based answers when Gemini API is unavailable or unconfigured.
 */
export function generateLocalRuleBasedResponse(prompt: string, state: DatasetState): string {
  const p = prompt.toLowerCase();
  const summary = buildPrivacySafeSummary(state);

  if (p.includes('biggest') || p.includes('priority') || p.includes('attention') || p.includes('first')) {
    const topRecs = state.recommendations.filter((r) => r.priority === 'High');
    if (topRecs.length > 0) {
      return `### 🔍 Priority Quality Findings for \`${state.filename}\`

Based on computed statistical audits, here are the highest priority items:

${topRecs.map((r, i) => `${i + 1}. **${r.issue}**\n   - *Evidence:* ${r.evidence}\n   - *Action:* ${r.recommendedAction}\n   - *Why it matters:* ${r.whyItMatters}`).join('\n\n')}

**Summary Score:** Your current Data Quality Score is **${state.qualityScore.overallScore}/100 (${state.qualityScore.rating})**. Addressing these will directly lift model reliability.`;
    }
    return `Your dataset is in solid shape! Quality Score is **${state.qualityScore.overallScore}/100**. No critical severity defects were detected. Review outliers or mild class imbalances before modeling.`;
  }

  if (p.includes('outlier') || p.includes('extreme')) {
    if (state.outlierResults.length === 0) {
      return `No numeric columns or outliers were detected in this dataset.`;
    }
    const withOutliers = state.outlierResults.filter((o) => o.outlierCount > 0);
    if (withOutliers.length === 0) {
      return `Good news! None of your numeric features have values outside Tukey's IQR boundaries ($Q_1 - 1.5\\times IQR$ to $Q_3 + 1.5\\times IQR$).`;
    }
    return `### 📊 Outlier Analysis Summary

The following numeric columns contain values flagged by the Interquartile Range (IQR) method:

${withOutliers.map((o) => `* **\`${o.column}\`**: **${o.outlierCount}** outliers (${o.outlierPercentage}% of values). Valid IQR range is [${o.lowerBound}, ${o.upperBound}]. Examples: ${o.flaggedValues.slice(0, 4).join(', ')}`).join('\n')}

**Data Science Advice:** Do not immediately delete outliers. Check if they reflect valid extreme real-world events (e.g. ultra-high net worth customers) vs data entry errors (e.g. negative age, typo zeroes). If valid, consider using tree-based models (XGBoost, Random Forest) which are naturally resistant to extreme values.`;
  }

  if (p.includes('imbalance') || p.includes('target') || p.includes('class')) {
    if (!state.targetAnalysis) {
      return `No target column has been selected yet. Head to the **Target Analysis** tab in the sidebar and select a target variable to see class distributions and imbalance ratios.`;
    }
    if (state.targetAnalysis.isContinuous) {
      return `Target column **\`${state.targetAnalysis.column}\`** is continuous (regression task), with mean ${state.targetAnalysis.regressionSummary?.mean} and range [${state.targetAnalysis.regressionSummary?.min}, ${state.targetAnalysis.regressionSummary?.max}]. Check for skewness rather than class imbalance.`;
    }
    return `### ⚖️ Target Imbalance Evaluation

* **Target Feature:** \`${state.targetAnalysis.column}\`
* **Status:** **${state.targetAnalysis.imbalanceSeverity}**
* **Majority Class:** "${state.targetAnalysis.majorityClass?.label}" (${state.targetAnalysis.majorityClass?.percentage}%)
* **Minority Class:** "${state.targetAnalysis.minorityClass?.label}" (${state.targetAnalysis.minorityClass?.percentage}%)
* **Imbalance Ratio:** ${state.targetAnalysis.imbalanceRatio} : 1

**Action Plan:**
1. **Never use standard Accuracy** as your primary score (a dumb model predicting 100% majority class achieves high accuracy but zero utility).
2. Use **PR-AUC**, **Macro F1**, or **Balanced Accuracy**.
3. Use \`class_weight='balanced'\` in estimators.
4. Resample only on training cross-validation splits!`;
  }

  if (p.includes('leakage') || p.includes('leak') || p.includes('future')) {
    const risks = state.leakageFindings.filter((l) => l.riskLevel !== 'No Obvious Warning Detected');
    if (risks.length === 0) {
      return `No obvious heuristic leakage warnings were triggered. However, remember: automated checks cannot guarantee zero leakage. Always verify that all features are physically available at the moment a prediction is requested in production.`;
    }
    return `### ⚠️ Data Leakage Review Findings

The following columns show suspicious patterns that may leak information not available at prediction time:

${risks.map((l) => `* **\`${l.column}\` [${l.riskLevel}]**: ${l.indicator}\n  *Reason:* ${l.reason}`).join('\n\n')}

**Rule of Thumb:** If a feature is generated after the target event or during resolution, it must be removed before model training.`;
  }

  if (p.includes('clean') || p.includes('prepare') || p.includes('workspace')) {
    return `### 🧹 Recommended Cleaning Steps for \`${state.filename}\`

1. **Duplicates:** ${state.duplicateResult.duplicateCount > 0 ? `Remove ${state.duplicateResult.duplicateCount} duplicate rows in the Cleaning Workspace.` : 'No duplicates found.'}
2. **Missing Values:** ${state.missingSummary.columnsWithMissing > 0 ? `Impute missing cells in ${state.missingSummary.columnsWithMissing} columns (${state.missingSummary.missingRate}% missing). Use median for numeric columns with outliers, mode or 'Unknown' for categories.` : 'All columns are 100% complete.'}
3. **Consistency:** ${state.consistencyFindings.length > 0 ? `Fix ${state.consistencyFindings.length} formatting issues (e.g. whitespace, mixed casing) to avoid split category levels.` : 'Format formatting is consistent.'}

Use the built-in **Cleaning Workspace** in the sidebar to apply non-destructive transforms and download your cleaned CSV.`;
  }

  // General default response
  return `### 🔬 Dataset Autopsy Summary for \`${state.filename}\`

* **Observations:** ${state.totalRows.toLocaleString()} rows | ${state.totalColumns} columns
* **Data Quality Score:** **${state.qualityScore.overallScore}/100** (${state.qualityScore.rating})
* **Missing Data:** ${state.missingSummary.totalMissingCells} missing cells across ${state.missingSummary.columnsWithMissing} column(s)
* **Duplicates:** ${state.duplicateResult.duplicateCount} exact duplicate row(s)
* **Outliers:** ${state.outlierResults.reduce((a, b) => a + b.outlierCount, 0)} total values flagged by IQR

Ask me specific questions such as:
* *"What are the biggest quality issues?"*
* *"Explain the outliers"*
* *"Does my target look imbalanced?"*
* *"Which columns might cause data leakage?"*`;
}

/**
 * Sends aggregate summary and prompt to server-side Gemini route,
 * with automatic fallback to local rule-based engine.
 */
export async function askDataAnalyst(
  prompt: string,
  state: DatasetState,
  history: ChatMessage[] = []
): Promise<{ text: string; isRuleBased: boolean }> {
  try {
    const summary = buildPrivacySafeSummary(state);
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        datasetSummary: summary,
        history: history.slice(-6).map((h) => ({ role: h.role, text: h.text })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) {
        return { text: data.text, isRuleBased: false };
      }
    }

    // If server responds with 503 NO_API_KEY or error, gracefully fallback
    console.info('Gemini API endpoint unavailable or unconfigured; activating local rule-based data analyst.');
    const fallbackText = generateLocalRuleBasedResponse(prompt, state);
    return { text: fallbackText, isRuleBased: true };
  } catch (err) {
    console.warn('Network error reaching Gemini backend, switching to local rule-based data analyst:', err);
    const fallbackText = generateLocalRuleBasedResponse(prompt, state);
    return { text: fallbackText, isRuleBased: true };
  }
}
