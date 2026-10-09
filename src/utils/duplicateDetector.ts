import { DuplicateResult } from '../types';

/**
 * Serializes a row into a deterministic hash string for comparison.
 */
function serializeRow(row: Record<string, any>, columns: string[]): string {
  return columns
    .map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return '__NULL__';
      return String(val).trim().toLowerCase();
    })
    .join('|||');
}

/**
 * Detects duplicate rows based on all or selected columns.
 */
export function detectDuplicates(
  rows: Record<string, any>[],
  columnsToConsider?: string[]
): DuplicateResult {
  if (rows.length === 0) {
    return {
      totalRows: 0,
      duplicateCount: 0,
      duplicatePercentage: 0,
      duplicateIndices: [],
      exampleDuplicates: [],
      consideredColumns: [],
    };
  }

  const columns =
    columnsToConsider && columnsToConsider.length > 0
      ? columnsToConsider
      : Object.keys(rows[0]);

  const seenHashes = new Map<string, number>(); // hash -> first seen index
  const duplicateIndices: number[] = [];
  const exampleDuplicates: Record<string, any>[] = [];

  rows.forEach((row, index) => {
    const hash = serializeRow(row, columns);
    if (seenHashes.has(hash)) {
      duplicateIndices.push(index);
      if (exampleDuplicates.length < 5) {
        exampleDuplicates.push({
          _originalRowIndex: seenHashes.get(hash),
          _duplicateRowIndex: index,
          ...row,
        });
      }
    } else {
      seenHashes.set(hash, index);
    }
  });

  const duplicatePercentage =
    rows.length > 0 ? Math.round((duplicateIndices.length / rows.length) * 1000) / 10 : 0;

  return {
    totalRows: rows.length,
    duplicateCount: duplicateIndices.length,
    duplicatePercentage,
    duplicateIndices,
    exampleDuplicates,
    consideredColumns: columns,
  };
}

/**
 * Creates a deduplicated copy of the dataset.
 * Does not mutate original rows array.
 */
export function removeDuplicatesCopy(
  rows: Record<string, any>[],
  columnsToConsider?: string[]
): { cleanedRows: Record<string, any>[]; removedCount: number } {
  const result = detectDuplicates(rows, columnsToConsider);
  const dupSet = new Set(result.duplicateIndices);
  const cleanedRows = rows.filter((_, idx) => !dupSet.has(idx)).map((r) => ({ ...r }));
  return {
    cleanedRows,
    removedCount: result.duplicateIndices.length,
  };
}
