import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

import { TABLES_GAP_X, TABLES_GAP_Y, TABLE_DEFAULT_MIN_WIDTH, TABLE_HEADER_HEIGHT, COLUMN_HEIGHT } from "@/constants/sizing";
import { getColsNumber } from "./getColsNumber";
import { type XYPosition } from "@/types/positions";

/**
 * Deterministic grid layout for tables used by unit tests and default layout.
 * Places tables row-major across N columns (N from getColsNumber) with fixed
 * column width = TABLE_DEFAULT_MIN_WIDTH and fixed row height derived from
 * header + 5 columns height (a conservative fixed height used in tests).
 */
const computeTablesPositions = (
  tables: JSONTableTable[],
  _refs: JSONTableRef[] = [],
): Map<string, XYPosition> => {
  const positions = new Map<string, XYPosition>();

  const cols = getColsNumber(tables.length);
  const colWidth = TABLE_DEFAULT_MIN_WIDTH + TABLES_GAP_X;
  const rowHeight = TABLE_HEADER_HEIGHT + COLUMN_HEIGHT * 5 + TABLES_GAP_Y;

  tables.forEach((t, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = col * colWidth;
    const y = row * rowHeight;
    positions.set(t.name, { x, y });
  });

  return positions;
};

export default computeTablesPositions;
