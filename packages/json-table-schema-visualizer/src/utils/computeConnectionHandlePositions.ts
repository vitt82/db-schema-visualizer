import { Position } from "@/types/positions";

interface Params {
  sourceW: number;
  sourceX: number;
  targetX: number;
  targetW: number;
}

const intersectionGap = 40;

export const computeConnectionHandlePos = ({
  sourceX,
  sourceW,
  targetW,
  targetX,
}: Params): [Position, Position, number, number] => {
  // We may receive coordinates either as top-left (current store) or as dagre centers
  // (older persisted values). To be robust, evaluate both interpretations and pick
  // the one that yields a clearer separation between boxes.
  // Interpretation A (top-left):
  const aSourceLeft = sourceX;
  const aSourceRight = sourceX + sourceW;
  const aTargetLeft = targetX;
  const aTargetRight = targetX + targetW;
  const aSourceCenter = sourceX + sourceW / 2;
  const aTargetCenter = targetX + targetW / 2;

  // Interpretation B (centers): assume incoming X are centers
  const bSourceLeft = sourceX - sourceW / 2;
  const bSourceRight = sourceX + sourceW / 2;
  const bTargetLeft = targetX - targetW / 2;
  const bTargetRight = targetX + targetW / 2;
  const bSourceCenter = sourceX;
  const bTargetCenter = targetX;

  // compute separation gaps (positive means A.source is left of target)
  const gapA = aTargetLeft - aSourceRight;
  const gapB = bTargetLeft - bSourceRight;

  // Choose interpretation: prefer the one with larger absolute gap when signs differ,
  // otherwise prefer top-left (A) as default.
  let useCenters = false;
  if (Math.sign(gapA) !== Math.sign(gapB)) {
    useCenters = Math.abs(gapB) > Math.abs(gapA);
  }

  // pick active values
  const sourceLeft = useCenters ? bSourceLeft : aSourceLeft;
  const sourceRight = useCenters ? bSourceRight : aSourceRight;
  const targetLeft = useCenters ? bTargetLeft : aTargetLeft;
  const targetRight = useCenters ? bTargetRight : aTargetRight;
  const sourceCenter = useCenters ? bSourceCenter : aSourceCenter;
  const targetCenter = useCenters ? bTargetCenter : aTargetCenter;

  // debug chosen interpretation
  // eslint-disable-next-line no-console
  console.debug("computeConnectionHandlePos: interpretation", {
    useCenters,
    gapA,
    gapB,
  });

  // If boxes are clearly separated with a gap, connect right->left or left->right accordingly
  if (sourceRight + intersectionGap < targetLeft) {
    // source is clearly left of target
    // debug
    // eslint-disable-next-line no-console
    console.debug("computeConnectionHandlePos: source left of target", {
      sourceX,
      sourceW,
      targetX,
      targetW,
      sourceLeft,
      sourceRight,
      targetLeft,
      targetRight,
      decided: [Position.Right, Position.Left, sourceRight, targetLeft],
    });
    return [Position.Right, Position.Left, sourceRight, targetLeft];
  }

  if (targetRight + intersectionGap < sourceLeft) {
    // target is clearly left of source
    // debug
    // eslint-disable-next-line no-console
    console.debug("computeConnectionHandlePos: target left of source", {
      sourceX,
      sourceW,
      targetX,
      targetW,
      sourceLeft,
      sourceRight,
      targetLeft,
      targetRight,
      decided: [Position.Left, Position.Right, sourceLeft, targetRight],
    });
    return [Position.Left, Position.Right, sourceLeft, targetRight];
  }

  // Boxes overlap or are very close: decide based on centers to keep consistent direction
  if (sourceCenter <= targetCenter) {
    // prefer connecting source right to target left
    // debug
    // eslint-disable-next-line no-console
    console.debug("computeConnectionHandlePos: centers decide right->left", {
      sourceCenter,
      targetCenter,
      decided: [Position.Right, Position.Left, sourceRight, targetLeft],
    });
    return [Position.Right, Position.Left, sourceRight, targetLeft];
  }

  // otherwise connect source left to target right
  // eslint-disable-next-line no-console
  console.debug("computeConnectionHandlePos: default left->right", {
    sourceCenter,
    targetCenter,
    decided: [Position.Left, Position.Right, sourceLeft, targetRight],
  });
  return [Position.Left, Position.Right, sourceLeft, targetRight];
};
