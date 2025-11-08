import { getBezierPath, getStepPathWithRoundedCorners } from './computeEgde/computeBezierEdge';
import { getRelationSymbol } from "./getRelationSymbol";

import { type Position, type XYPosition } from "@/types/positions";

interface Props {
  sourceXY: XYPosition;
  sourcePosition: Position;
  targetXY: XYPosition;
  targetPosition: Position;
  relationSource: string;
  relationTarget: string;
}

// Use smooth step for a cleaner, more angular look
const USE_SMOOTH_STEP = true;

export const computeConnectionPathWithSymbols = ({
  relationSource,
  relationTarget,
  sourceXY,
  targetXY,
  sourcePosition,
  targetPosition,
}: Props): string => {
  const linePath = USE_SMOOTH_STEP
    ? getStepPathWithRoundedCorners({
        sourcePosition,
        targetPosition,
        source: sourceXY,
        target: targetXY,
      })
    : getBezierPath({
        sourcePosition,
        targetPosition,
        source: sourceXY,
        target: targetXY,
      });

  const sourceSymbolPath = getRelationSymbol(
    relationSource,
    sourcePosition,
    sourceXY,
  );
  const targetSymbolPath = getRelationSymbol(
    relationTarget,
    targetPosition,
    targetXY,
  );

  return `${linePath} ${sourceSymbolPath} ${targetSymbolPath}`;
};
