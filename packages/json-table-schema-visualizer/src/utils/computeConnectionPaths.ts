import { getBezierPath, getStepPathWithRoundedCorners, getStepPathWithRoundedCornersAndMidpoint, getStepPathWithRoundedCornersAndWaypoints } from './computeEgde/computeBezierEdge';
import { getRelationSymbol } from "./getRelationSymbol";

import { type Position, type XYPosition } from "@/types/positions";
import { type ConnectionType } from "@/stores/connectionTypeStore";

interface Props {
  sourceXY: XYPosition;
  sourcePosition: Position;
  targetXY: XYPosition;
  targetPosition: Position;
  relationSource: string;
  relationTarget: string;
  midpoint?: XYPosition;
  waypoints?: XYPosition[];
  connectionType?: ConnectionType;
}

export const computeConnectionPathWithSymbols = ({
  relationSource,
  relationTarget,
  sourceXY,
  targetXY,
  sourcePosition,
  targetPosition,
  midpoint,
  waypoints,
  connectionType = 'bezier',
}: Props): string => {
  const linePath = connectionType === 'smoothstep'
    ? waypoints != null && waypoints.length > 0
      ? getStepPathWithRoundedCornersAndWaypoints({
          sourcePosition,
          targetPosition,
          source: sourceXY,
          target: targetXY,
          waypoints,
        })
      : midpoint != null
      ? getStepPathWithRoundedCornersAndMidpoint({
          sourcePosition,
          targetPosition,
          source: sourceXY,
          target: targetXY,
          midpoint,
        })
      : getStepPathWithRoundedCorners({
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
