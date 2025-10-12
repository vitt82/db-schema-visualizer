import { computeConnectionHandlePos } from "../computeConnectionHandlePositions";

import { Position } from "@/types/positions";

describe("compute connection handle positions", () => {
  test("return same position", () => {
    const input = {
      sourceW: 300,
      sourceX: 0,
      targetW: 300,
      targetX: 300,
    };
    // With top-left coords, centers are source=150 target=450 -> expect Right->Left anchors
    expect(computeConnectionHandlePos(input)).toEqual([
      Position.Right,
      Position.Left,
      input.sourceX + input.sourceW,
      input.targetX,
    ]);
  });

  test("source at right", () => {
    const input = {
      sourceW: 300,
      sourceX: 0,
      targetW: 300,
      targetX: 500,
    };
    expect(computeConnectionHandlePos(input)).toEqual([
      Position.Right,
      Position.Left,
      input.sourceX + input.sourceW,
      input.targetX,
    ]);
  });

  test("source at left", () => {
    const input = {
      sourceW: 300,
      sourceX: 500,
      targetW: 300,
      targetX: 0,
    };
    expect(computeConnectionHandlePos(input)).toEqual([
      Position.Left,
      Position.Right,
      input.sourceX,
      input.targetX + input.targetW,
    ]);
  });
});
