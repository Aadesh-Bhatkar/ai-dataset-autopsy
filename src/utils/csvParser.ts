import Papa from 'papaparse';

export interface ParseResult {
  data: Record<string, any>[];
  headers: string[];
  totalRows: number;
  totalColumns: number;
  errors: string[];
  warnings: string[];
}

// Common null/missing value conventions in tabular data
export const NULL_MARKERS = new Set([
  '',
  ' ',
  '  ',
  'null',
  'NULL',
  'Null',
  'nan',
  'NAN',
  'NaN',
  'na',
  'NA',
  'N/A',
  'n/a',
  'none',
  'NONE',
  'None',
  'nil',
  'NIL',
  '?',
  '-',
  '--',
  '#N/A',
  '#VALUE!',
  'undefined',
  'UNDEFINED',
]);

/**
 * Checks whether a raw cell value represents a missing/null value.
 */
export function isMissingValue(val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'number') return isNaN(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return NULL_MARKERS.has(val) || NULL_MARKERS.has(trimmed);
  }
  return false;
}

/**
 * Parses a CSV string safely using PapaParse.
 */
export function parseCSVString(csvString: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    if (!csvString || !csvString.trim()) {
      return reject(new Error('CSV file is empty. Please provide a valid CSV file with headers.'));
    }

    Papa.parse<Record<string, any>>(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Keep raw strings to allow accurate type inference
      complete: (results) => {
        const rawHeaders = results.meta.fields || [];
        const cleanHeaders = rawHeaders
          .map((h) => (h ? h.trim() : ''))
          .filter((h) => h.length > 0);

        if (cleanHeaders.length === 0) {
          return reject(new Error('No column headers detected. Please ensure row 1 contains column names.'));
        }

        const validRows = results.data.filter((row) => {
          if (!row || typeof row !== 'object') return false;
          // Check if at least one column has non-empty content
          return Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '');
        });

        if (validRows.length === 0) {
          return reject(new Error('The CSV contains headers but 0 data rows. Please provide data to analyze.'));
        }

        const warnings: string[] = [];
        if (validRows.length > 25000) {
          warnings.push(`Dataset contains ${validRows.length.toLocaleString()} rows. Complex calculations will be optimized for browser responsiveness.`);
        }

        const errors: string[] = results.errors.map((e) => `Row ${e.row}: ${e.message}`);

        resolve({
          data: validRows,
          headers: cleanHeaders,
          totalRows: validRows.length,
          totalColumns: cleanHeaders.length,
          errors,
          warnings,
        });
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}
