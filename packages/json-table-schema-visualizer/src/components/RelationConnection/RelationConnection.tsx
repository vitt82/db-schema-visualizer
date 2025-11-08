import { useMemo, useState, useEffect } from "react";

import ConnectionPath from "./ConnectionPath";

import type { RelationItem } from "@/types/relation";
import type { XYPosition } from "@/types/positions";

import { useRelationsCoords } from "@/hooks/relationConnection";
import { computeConnectionPathWithSymbols } from "@/utils/computeConnectionPaths";
import { connectionControlPointsStore } from "@/stores/connectionControlPoints";

interface RelationConnectionProps {
  source: RelationItem;
  target: RelationItem;
}

const RelationConnection = ({ source, target }: RelationConnectionProps) => {
  const { sourcePosition, sourceXY, targetPosition, targetXY } =
    useRelationsCoords(source, target);

  const { x: sourceX, y: sourceY } = sourceXY;
  const { x: targetX, y: targetY } = targetXY;

  const relationOwner =
    source.relation === "1" ? source.tableName : target.tableName;

  const [midpoint, setMidpoint] = useState<XYPosition | undefined>();

  // Load midpoint from store and subscribe to changes
  useEffect(() => {
    const savedPoints = connectionControlPointsStore.getControlPoints(
      source.tableName,
      source.fieldNames[0],
      target.tableName,
      target.fieldNames[0],
      relationOwner
    );

    if (savedPoints.length > 0) {
      setMidpoint({ x: savedPoints[0].x, y: savedPoints[0].y });
    } else {
      setMidpoint(undefined);
    }

    // Poll for changes from store (triggered by ConnectionPath drag)
    const interval = setInterval(() => {
      const current = connectionControlPointsStore.getControlPoints(
        source.tableName,
        source.fieldNames[0],
        target.tableName,
        target.fieldNames[0],
        relationOwner
      );

      if (current.length > 0) {
        setMidpoint({ x: current[0].x, y: current[0].y });
      } else {
        setMidpoint(undefined);
      }
    }, 50); // Poll every 50ms (less aggressive than 16ms)

    return () => {
      clearInterval(interval);
    };
  }, [source.tableName, source.fieldNames, target.tableName, target.fieldNames, relationOwner]);

  const linePath = useMemo(() => {
    return computeConnectionPathWithSymbols({
      targetXY,
      sourceXY,
      sourcePosition,
      targetPosition,
      relationSource: source.relation,
      relationTarget: target.relation,
      midpoint,
    });
  }, [sourcePosition, targetPosition, sourceX, targetX, sourceY, targetY, midpoint]);

  return (
    <>
      <ConnectionPath
        path={linePath}
        sourceTableName={source.tableName}
        sourceFieldName={source.fieldNames[0]}
        targetTableName={target.tableName}
        targetFieldName={target.fieldNames[0]}
        relationOwner={relationOwner}
      />
    </>
  );
};

export default RelationConnection;
