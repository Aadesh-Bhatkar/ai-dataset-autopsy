import { DatasetState } from '../types';
import Papa from 'papaparse';

/**
 * Triggers a client-side file download using Blob API.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads cleaned dataset rows as CSV.
 */
export function downloadCleanedCSV(rows: Record<string, any>[], filename: string) {
  const csv = Papa.unparse(rows);
  const cleanName = filename.replace(/\.csv$/i, '') + '_cleaned.csv';
  downloadFile(csv, cleanName, 'text/csv;charset=utf-8;');
}

/**
 * Generates Markdown format of the comprehensive report.
 */
export function generateMarkdownReport(state: DatasetState): string {
  const {
    filename,
    totalRows,
    totalColumns,
    parsedAt,
    qualityScore,
    missingSummary,
    duplicateResult,
    outlierResults,
    consistencyFindings,
    targetAnalysis,
    leakageFindings,
    recommendations,
  } = state;

  return `# AI Dataset Autopsy — Data Quality Audit Report

**Dataset Filename:** \`${filename}\`  
**Generated On:** ${new Date(parsedAt).toLocaleString()}  
**Total Observations (Rows):** ${totalRows.toLocaleString()}  
**Total Features (Columns):** ${totalColumns}  

---

## 1. Overall Data Quality Score: ${qualityScore.overallScore} / 100 (${qualityScore.rating})

The Data Quality Score is a heuristic composite metric calculated from verified dataset properties:

* **Completeness:** ${qualityScore.subScores.completeness.score} / ${qualityScore.subScores.completeness.max} (${qualityScore.subScores.completeness.description})
* **Uniqueness:** ${qualityScore.subScores.uniqueness.score} / ${qualityScore.subScores.uniqueness.max} (${qualityScore.subScores.uniqueness.description})
* **Consistency:** ${qualityScore.subScores.consistency.score} / ${qualityScore.subScores.consistency.max} (${qualityScore.subScores.consistency.description})
* **Integrity:** ${qualityScore.subScores.integrity.score} / ${qualityScore.subScores.integrity.max} (${qualityScore.subScores.integrity.description})
* **Structure & Variance:** ${qualityScore.subScores.structure.score} / ${qualityScore.subScores.structure.max} (${qualityScore.subScores.structure.description})

### Deductions Breakdown:
${
  qualityScore.deductions.length === 0
    ? '* No deductions applied. Dataset is clean on primary dimensions.'
    : qualityScore.deductions.map((d) => `* **-${d.points} pts:** ${d.reason}`).join('\n')
}

---

## 2. Missing Value Investigation

* **Total Missing Cells:** ${missingSummary.totalMissingCells.toLocaleString()} (${missingSummary.missingRate}% of all cells)
* **Columns With Missing Data:** ${missingSummary.columnsWithMissing} of ${totalColumns}

| Column Name | Inferred Type | Missing Count | Missing % | Severity | Recommended Treatment |
|---|---|---|---|---|---|
${missingSummary.details
  .map(
    (d) =>
      `| \`${d.column}\` | ${d.inferredType} | ${d.missingCount} | ${d.missingPercentage}% | ${d.severity} | ${d.recommendedTreatment} |`
  )
  .join('\n')}

---

## 3. Duplicate Record Analysis

* **Exact Duplicate Rows:** ${duplicateResult.duplicateCount} (${duplicateResult.duplicatePercentage}%)
* **Deduplication Baseline:** Evaluated across columns: \`${duplicateResult.consideredColumns.join(', ')}\`
${
  duplicateResult.duplicateCount > 0
    ? `* Action required: Exact duplicate rows detected. Remove prior to cross-validation splits to avoid data snooping.`
    : `* Clean: No duplicate rows detected.`
}

---

## 4. Numeric Outlier Detection (Tukey's IQR Method)

*Formula: $IQR = Q_3 - Q_1$, Outlier Range: $[Q_1 - 1.5 \\times IQR, Q_3 + 1.5 \\times IQR]$*

| Column | Lower Bound | Upper Bound | Min | Max | Outliers Flagged | Outlier % |
|---|---|---|---|---|---|---|
${
  outlierResults.length === 0
    ? '| No numeric columns found | - | - | - | - | - | - |'
    : outlierResults
        .map(
          (o) =>
            `| \`${o.column}\` | ${o.lowerBound} | ${o.upperBound} | ${o.min} | ${o.max} | ${o.outlierCount} | ${o.outlierPercentage}% |`
        )
        .join('\n')
}

*Note: Outliers are flagged for review, not automatic deletion. Real-world phenomena (e.g. rare transactions, high-net-worth clients) may be valid observations.*

---

## 5. Data Consistency Findings

${
  consistencyFindings.length === 0
    ? 'No formatting, casing, or cardinality defects were detected.'
    : consistencyFindings
        .map(
          (c) =>
            `### [${c.severity}] ${c.issue} — \`${c.column}\`\n* **Affected Count:** ${c.affectedCount}\n* **Action:** ${c.suggestedAction}\n* **Evidence:** ${c.sampleEvidence.join(', ')}`
        )
        .join('\n\n')
}

---

## 6. Target Variable Analysis

${
  !targetAnalysis
    ? 'No target column was designated for evaluation.'
    : targetAnalysis.isContinuous
    ? `* **Column:** \`${targetAnalysis.column}\` (Continuous Numeric / Regression Target)  
* **Summary:** Min: ${targetAnalysis.regressionSummary?.min}, Max: ${targetAnalysis.regressionSummary?.max}, Mean: ${targetAnalysis.regressionSummary?.mean}, Median: ${targetAnalysis.regressionSummary?.median}, StdDev: ${targetAnalysis.regressionSummary?.stdDev}  
* **Guidance:** ${targetAnalysis.recommendedActions.join(' ')}`
    : `* **Target Column:** \`${targetAnalysis.column}\` (Classification)  
* **Imbalance Assessment:** **${targetAnalysis.imbalanceSeverity}** (Ratio: ${targetAnalysis.imbalanceRatio}:1)  
* **Majority Class:** ${targetAnalysis.majorityClass?.label} (${targetAnalysis.majorityClass?.percentage}%)  
* **Minority Class:** ${targetAnalysis.minorityClass?.label} (${targetAnalysis.minorityClass?.percentage}%)  

#### Distribution:
${targetAnalysis.classDistribution?.map((cd) => `* **${cd.label}:** ${cd.count} (${cd.percentage}%)`).join('\n')}

#### Recommended Modeling Strategy:
${targetAnalysis.recommendedActions.map((a) => `* ${a}`).join('\n')}`
}

---

## 7. Machine Learning Data Leakage Risk Review

${
  leakageFindings.length === 0
    ? 'No leakage checks configured.'
    : leakageFindings
        .map(
          (l) =>
            `* **\`${l.column}\` [${l.riskLevel}]**: ${l.indicator} — ${l.reason} ${l.scoreOrMetric ? `(${l.scoreOrMetric})` : ''}`
        )
        .join('\n')
}

*Disclaimer: Automated leakage detection flags heuristic risk patterns. Conclusive validation requires understanding the operational prediction horizon in production.*

---

## 8. Prioritized Cleaning Recommendations

${
  recommendations.length === 0
    ? 'No immediate cleaning actions required.'
    : recommendations
        .map(
          (r, idx) =>
            `### ${idx + 1}. [${r.priority} Priority] ${r.issue}\n* **Category:** ${r.category}\n* **Evidence:** ${r.evidence}\n* **Recommended Action:** ${r.recommendedAction}\n* **Why It Matters:** ${r.whyItMatters}`
        )
        .join('\n\n')
}

---

## 9. Methodological Limitations & Ethical Considerations

1. **Local Statistical Heuristics:** Calculations reflect descriptive sample statistics computed in-browser. Small sample sizes may produce wide confidence intervals.
2. **Context-Dependent Validity:** Outliers and rare classes are not necessarily errors. Wholesale pruning without domain validation risks survivorship bias and diminished real-world generalization.
3. **Privacy First:** This audit was computed locally. No raw observations were transmitted to remote external cloud stores.
`;
}

/**
 * Generates an HTML report suitable for printing, viewing, or saving as PDF.
 */
export function generateHTMLReport(state: DatasetState): string {
  const md = generateMarkdownReport(state);
  // Simple markdown to HTML conversion for high fidelity printing
  const htmlBody = md
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-slate-900 border-b pb-3 mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-slate-800 border-b pb-2 mt-8 mb-3">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium text-slate-800 mt-5 mb-2">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-medium text-slate-700 mt-4 mb-2">$1</h4>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="bg-slate-100 text-purple-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^\* (.*$)/gim, '<li class="ml-5 list-disc text-slate-700 my-1">$1</li>')
    .replace(/\n\n/gim, '<div class="my-3"></div>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Data Quality Audit Report — ${state.filename}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background: white; color: black; font-size: 12pt; }
      .no-print { display: none; }
      table { page-break-inside: avoid; }
      h2, h3 { page-break-after: avoid; }
    }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
    th { background: #f1f5f9; text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; font-weight: 600; }
    td { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 p-8 max-w-5xl mx-auto font-sans leading-relaxed">
  <div class="no-print mb-6 flex justify-between items-center bg-purple-900 text-white p-4 rounded-lg shadow">
    <div>
      <h1 class="text-xl font-bold">AI Dataset Autopsy — Audit Export</h1>
      <p class="text-sm text-purple-200">Ready to save, print, or export as PDF (Ctrl/Cmd + P)</p>
    </div>
    <button onclick="window.print()" class="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-4 py-2 rounded shadow cursor-pointer transition">
      Print / Save as PDF
    </button>
  </div>
  <div class="bg-white p-10 rounded-xl shadow border border-slate-200">
    ${htmlBody}
  </div>
  <footer class="mt-8 text-center text-xs text-slate-500 no-print">
    Generated by AI Dataset Autopsy — Intelligent Data Quality Analyzer
  </footer>
</body>
</html>`;
}
