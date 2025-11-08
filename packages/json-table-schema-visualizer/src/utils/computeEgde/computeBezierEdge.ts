/**
 * copied from https://github.com/xyflow/xyflow/blob/8b200b4f25c5e017a86974161b19bf75656d671b/packages/system/src/utils/edges/bezier-edge.ts
 * with some update
 */

import { compteSymbolOffset } from "../getRelationSymbol";

import { Position, type XYPosition } from "@/types/positions";

interface GetBezierPathParams {
  source: XYPosition;
  target: XYPosition;
  sourcePosition?: Position;
  targetPosition?: Position;
  curvature?: number;
}

interface GetControlWithCurvatureParams {
  pos: Position;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  c: number;
}

function calculateControlOffset(distance: number, curvature: number): number {
  if (distance >= 0) {
    return 0.5 * distance;
  }

  return curvature * 25 * Math.sqrt(-distance);
}

function getControlWithCurvature({
  pos,
  x1,
  y1,
  x2,
  y2,
  c,
}: GetControlWithCurvatureParams): [number, number] {
  switch (pos) {
    case Position.Left:
      return [x1 - calculateControlOffset(x1 - x2, c), y1];
    case Position.Right:
      return [x1 + calculateControlOffset(x2 - x1, c), y1];
    case Position.Top:
      return [x1, y1 - calculateControlOffset(y1 - y2, c)];
    case Position.Bottom:
      return [x1, y1 + calculateControlOffset(y2 - y1, c)];
  }
}

export function getBezierPath({
  source,
  sourcePosition = Position.Bottom,
  target,
  targetPosition = Position.Top,
  curvature = 0.5,
}: GetBezierPathParams): string {
  const [sourceControlX, sourceControlY] = getControlWithCurvature({
    pos: sourcePosition,
    x1: source.x,
    y1: source.y,
    x2: target.x,
    y2: target.y,
    c: curvature,
  });

  const [targetControlX, targetControlY] = getControlWithCurvature({
    pos: targetPosition,
    x1: target.x,
    y1: target.y,
    x2: source.x,
    y2: source.y,
    c: curvature,
  });

  // debug: print computed values for tracing incorrect anchors
  // eslint-disable-next-line no-console
  console.debug("getBezierPath: bezier inputs", {
    source,
    target,
    sourcePosition,
    targetPosition,
    sourceControl: [sourceControlX, sourceControlY],
    targetControl: [targetControlX, targetControlY],
  });

  const sourceOffset = compteSymbolOffset(sourcePosition, source);
  const targetOffset = compteSymbolOffset(targetPosition, target);

  const path = `M${source.x},${source.y} L${sourceOffset.x},${sourceOffset.y} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetOffset.x},${targetOffset.y} L${target.x},${target.y}`;

  return path;
}

/**
 * Create a step path with straight lines and rounded corners
 * Lines are completely straight, only corners are rounded using quadratic curves
 */
export function getStepPathWithRoundedCorners({
  source,
  sourcePosition = Position.Bottom,
  target,
  targetPosition = Position.Top,
}: GetBezierPathParams): string {
  const sourceOffset = compteSymbolOffset(sourcePosition, source);
  const targetOffset = compteSymbolOffset(targetPosition, target);

  const cornerRadius = 35; // Increased radius for smoother corners
  const stepDistance = 50; // Distance to step away from source

  let pathData = `M${source.x},${source.y} L${sourceOffset.x},${sourceOffset.y}`;

  const startX = sourceOffset.x;
  const startY = sourceOffset.y;
  const endX = targetOffset.x;
  const endY = targetOffset.y;

  // Calculate step away from source
  let step1X = startX;
  let step1Y = startY;

  if (sourcePosition === Position.Bottom) {
    step1Y += stepDistance;
  } else if (sourcePosition === Position.Top) {
    step1Y -= stepDistance;
  } else if (sourcePosition === Position.Right) {
    step1X += stepDistance;
  } else if (sourcePosition === Position.Left) {
    step1X -= stepDistance;
  }

  // Calculate corner point (where we change direction)
  let cornerX = step1X;
  let cornerY = step1Y;

  // Adjust corner to align with target
  if (targetPosition === Position.Bottom || targetPosition === Position.Top) {
    cornerX = endX;
  } else if (targetPosition === Position.Left || targetPosition === Position.Right) {
    cornerY = endY;
  }

  // Build path with straight lines and rounded corners
  if (cornerX !== startX && cornerY !== startY) {
    // Two corners needed - create Z-shape with rounded corners
    
    // Calculate actual radius based on available space
    const distX = Math.abs(cornerX - startX);
    const distY = Math.abs(cornerY - startY);
    const distY2 = Math.abs(endY - cornerY);
    const radius = Math.min(cornerRadius, distX / 2, distY / 2, distY2 / 2);

    // First straight line (stop before corner)
    const beforeCorner1X = cornerX > startX ? cornerX - radius : cornerX + radius;
    pathData += ` L${beforeCorner1X},${startY}`;
    
    // First rounded corner using quadratic curve
    const afterCorner1Y = cornerY > startY ? startY + radius : startY - radius;
    pathData += ` Q${cornerX},${startY} ${cornerX},${afterCorner1Y}`;
    
    // Second straight line (vertical, stop before corner)
    const beforeCorner2Y = endY > cornerY ? endY - radius : endY + radius;
    pathData += ` L${cornerX},${beforeCorner2Y}`;
    
    // Second rounded corner using quadratic curve
    const afterCorner2X = endX > cornerX ? cornerX + radius : cornerX - radius;
    pathData += ` Q${cornerX},${endY} ${afterCorner2X},${endY}`;
    
    // Final straight line to target
    pathData += ` L${endX},${endY}`;
  } else if (cornerX !== startX || cornerY !== startY) {
    // Single straight line
    pathData += ` L${endX},${endY}`;
  }

  pathData += ` L${target.x},${target.y}`;

  return pathData;
}

/**
 * Create a step path with rounded corners that passes through a midpoint
 * This allows interactive editing of edges while maintaining smoothstep style
 */
export function getStepPathWithRoundedCornersAndMidpoint({
  source,
  sourcePosition = Position.Bottom,
  target,
  targetPosition = Position.Top,
  midpoint,
}: GetBezierPathParams & { midpoint: XYPosition }): string {
  const sourceOffset = compteSymbolOffset(sourcePosition, source);
  const targetOffset = compteSymbolOffset(targetPosition, target);

  const cornerRadius = 35;
  let pathData = `M${source.x},${source.y} L${sourceOffset.x},${sourceOffset.y}`;

  const startX = sourceOffset.x;
  const startY = sourceOffset.y;
  const midX = midpoint.x;
  const midY = midpoint.y;
  const endX = targetOffset.x;
  const endY = targetOffset.y;

  // Source to midpoint segment
  if (startX !== midX && startY !== midY) {
    // Diagonal: need corner
    const distX1 = Math.abs(midX - startX);
    const distY1 = Math.abs(midY - startY);
    const radius1 = Math.min(cornerRadius, distX1 / 2, distY1 / 2);

    // Determine which direction to go first (prefer maintaining source direction)
    const goHorizontalFirst = Math.abs(startX - midX) >= Math.abs(startY - midY);

    if (goHorizontalFirst) {
      // Horizontal then vertical
      const beforeCornerX = midX > startX ? midX - radius1 : midX + radius1;
      pathData += ` L${beforeCornerX},${startY}`;
      const afterCornerY = midY > startY ? startY + radius1 : startY - radius1;
      pathData += ` Q${midX},${startY} ${midX},${afterCornerY}`;
      pathData += ` L${midX},${midY}`;
    } else {
      // Vertical then horizontal
      const beforeCornerY = midY > startY ? midY - radius1 : midY + radius1;
      pathData += ` L${startX},${beforeCornerY}`;
      const afterCornerX = midX > startX ? startX + radius1 : startX - radius1;
      pathData += ` Q${startX},${midY} ${afterCornerX},${midY}`;
      pathData += ` L${midX},${midY}`;
    }
  } else if (startX !== midX || startY !== midY) {
    // Straight line
    pathData += ` L${midX},${midY}`;
  }

  // Midpoint to target segment
  if (midX !== endX && midY !== endY) {
    // Diagonal: need corner
    const distX2 = Math.abs(endX - midX);
    const distY2 = Math.abs(endY - midY);
    const radius2 = Math.min(cornerRadius, distX2 / 2, distY2 / 2);

    // Determine which direction to go first (prefer target direction)
    const goHorizontalFirst2 = Math.abs(endX - midX) >= Math.abs(endY - midY);

    if (goHorizontalFirst2) {
      // Horizontal then vertical
      const beforeCornerX = endX > midX ? endX - radius2 : endX + radius2;
      pathData += ` L${beforeCornerX},${midY}`;
      const afterCornerY = endY > midY ? midY + radius2 : midY - radius2;
      pathData += ` Q${endX},${midY} ${endX},${afterCornerY}`;
      pathData += ` L${endX},${endY}`;
    } else {
      // Vertical then horizontal
      const beforeCornerY = endY > midY ? endY - radius2 : endY + radius2;
      pathData += ` L${midX},${beforeCornerY}`;
      const afterCornerX = endX > midX ? midX + radius2 : midX - radius2;
      pathData += ` Q${midX},${endY} ${afterCornerX},${endY}`;
      pathData += ` L${endX},${endY}`;
    }
  } else if (midX !== endX || midY !== endY) {
    // Straight line
    pathData += ` L${endX},${endY}`;
  }

  pathData += ` L${target.x},${target.y}`;

  return pathData;
}


