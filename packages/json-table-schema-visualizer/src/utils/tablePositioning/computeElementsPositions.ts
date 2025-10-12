import dagre from "@dagrejs/dagre";

import { computeTableDimension } from "../computeTableDimension";

import type {
  JSONTableRef,
  JSONTableTable,
  JSONTableEnum,
} from "shared/types/tableSchema";

import { TABLES_GAP_X, TABLES_GAP_Y } from "@/constants/sizing";
import { computeEnumDetailBoxMaxW } from "@/utils/computeEnumDetailBoxMaxW";
import { type XYPosition } from "@/types/positions";

const computeElementsPositions = (
  tables: JSONTableTable[],
  refs: JSONTableRef[],
  enums: JSONTableEnum[] = [],
): Map<string, XYPosition> => {
  const positions = new Map<string, XYPosition>();

  // If no enums, use original table-only layout
  if (enums.length === 0) {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({
      nodesep: TABLES_GAP_X * 3,
      ranksep: TABLES_GAP_Y * 3,
      rankdir: "LR",
    });
    graph.setDefaultEdgeLabel(() => ({}));

    tables.forEach((table) => {
      const { height, width } = computeTableDimension(table);
      graph.setNode(table.name, { width, height });
    });

    refs.forEach((ref) => {
      graph.setEdge(ref.endpoints[0].tableName, ref.endpoints[1].tableName);
    });

    dagre.layout(graph);

    graph.nodes().forEach((nodeId) => {
      const node = graph.node(nodeId);
      if (node != null) {
        positions.set(nodeId, { x: node.x, y: node.y });
      }
    });

    return positions;
  }

  // With enums: use increased spacing and better separation
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    nodesep: TABLES_GAP_X * 5, // Increased spacing
    ranksep: TABLES_GAP_Y * 5, // Increased spacing
    rankdir: "TB", // Top-to-bottom for better enum separation
    align: "UL", // Upper-left alignment
  });
  graph.setDefaultEdgeLabel(() => ({}));

  // Add tables first
  tables.forEach((table) => {
    const { height, width } = computeTableDimension(table);
    graph.setNode(table.name, { width, height });
  });

  // Add enums with increased dimensions to ensure no overlap
  enums.forEach((en) => {
    const width = Math.max(computeEnumDetailBoxMaxW(en) + 64, 200); // Minimum width 200
    const height = Math.max(60 + en.values.length * 28, 120); // Minimum height 120
    graph.setNode(en.name, { width, height });
  });

  // Add table relationships
  refs.forEach((ref) => {
    graph.setEdge(ref.endpoints[0].tableName, ref.endpoints[1].tableName);
  });

  dagre.layout(graph);

  // Get initial positions from dagre
  const tablePositions = new Map<string, XYPosition>();
  const enumPositions = new Map<string, XYPosition>();

  graph.nodes().forEach((nodeId) => {
    const node = graph.node(nodeId);
    if (node != null) {
      // convert dagre center coords to top-left for our Konva usage
      const x = node.x - (node.width ?? 0) / 2;
      const y = node.y - (node.height ?? 0) / 2;
      const isEnum = enums.some((e) => e.name === nodeId);
      if (isEnum) {
        enumPositions.set(nodeId, { x, y });
      } else {
        tablePositions.set(nodeId, { x, y });
      }
    }
  });

  // Post-process: Move enums to avoid overlap with tables
  // Strategy: place enums in a dedicated column to the right of tables
  // so they don't overlap with tables or among themselves.
  const TABLES_RIGHT_X = Math.max(
    ...Array.from(tablePositions.values()).map((p) => p.x),
    0,
  );
  const ENUM_COLUMN_X = TABLES_RIGHT_X + TABLES_GAP_X * 8; // large gap to the right

  // compute sizes for enums (same as used for dagre nodes)
  const enumSizes = new Map<string, { width: number; height: number }>();
  enums.forEach((en) => {
    const width = Math.max(computeEnumDetailBoxMaxW(en) + 64, 200);
    const height = Math.max(60 + en.values.length * 28, 120);
    enumSizes.set(en.name, { width, height });
  });

  // Stack enums vertically with spacing. If total height exceeds allowed column height,
  // split enums into multiple columns.
  const VERTICAL_GAP = TABLES_GAP_Y * 1.2;

  const enumEntries = enums
    .map((en) => {
      const s = enumSizes.get(en.name);
      if (s == null) return null;
      return { name: en.name, width: s.width, height: s.height };
    })
    .filter(
      (v): v is { name: string; width: number; height: number } => v != null,
    );

  const totalHeight = enumEntries.reduce(
    (acc, e) => acc + e.height + VERTICAL_GAP,
    0,
  );

  // Estimate available vertical space using tables bbox or fallback to totalHeight if none
  const tableYs = Array.from(tablePositions.values()).map((p) => p.y);
  const availableHeight =
    tableYs.length > 0 ? Math.max(...tableYs) * 2 : Math.max(totalHeight, 800);

  const maxColumnHeight = Math.max(availableHeight * 0.9, 600);

  let columns = 1;
  if (totalHeight > maxColumnHeight) {
    columns = Math.ceil(totalHeight / maxColumnHeight);
  }

  // Determine max column width
  const maxEnumWidth = Math.max(...enumEntries.map((e) => e.width), 200);
  const columnGap = TABLES_GAP_X * 3;

  // Distribute enums across columns (simple round-robin fill by height)
  const cols: Array<Array<{ name: string; width: number; height: number }>> =
    Array.from({ length: columns }, () => []);
  const columnHeights = new Array(columns).fill(0);

  // place larger enums first for better packing
  const sorted = [...enumEntries].sort((a, b) => b.height - a.height);

  sorted.forEach((entry) => {
    // put in the column with smallest current height
    let minIdx = 0;
    for (let i = 1; i < columns; i++) {
      if (columnHeights[i] < columnHeights[minIdx]) minIdx = i;
    }
    cols[minIdx].push(entry);
    columnHeights[minIdx] += entry.height + VERTICAL_GAP;
  });

  // compute starting Y (top) based on tables top Y or 0
  const startY =
    tableYs.length > 0
      ? Math.min(...tableYs) - TABLES_GAP_Y * 2
      : TABLES_GAP_Y * 2;

  // place columns to the right, each column shifted by (maxEnumWidth + columnGap)
  for (let ci = 0; ci < columns; ci++) {
    const col = cols[ci];
    let yCursor = startY;
    const colX = ENUM_COLUMN_X + ci * (maxEnumWidth + columnGap);
    col.forEach((entry) => {
      yCursor += entry.height / 2 + VERTICAL_GAP;
      const centerX = colX + entry.width / 2;
      // store top-left x,y for consistency with other nodes
      positions.set(entry.name, {
        x: centerX - entry.width / 2,
        y: yCursor - entry.height / 2,
      });
      yCursor += entry.height / 2;
    });
  }

  // Add table positions
  tablePositions.forEach((pos, tableName) => {
    positions.set(tableName, pos);
  });

  return positions;
};

export default computeElementsPositions;
