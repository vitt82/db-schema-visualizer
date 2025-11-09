import { useMemo, useState, useEffect } from "react";

import ConnectionPath from "./ConnectionPath";

import type { RelationItem } from "@/types/relation";
import type { XYPosition } from "@/types/positions";

import { useRelationsCoords } from "@/hooks/relationConnection";
import { computeConnectionPathWithSymbols } from "@/utils/computeConnectionPaths";
import { connectionControlPointsStore } from "@/stores/connectionControlPoints";
import { connectionTypeStore, type ConnectionType } from "@/stores/connectionTypeStore";

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

  const [waypoints, setWaypoints] = useState<XYPosition[]>([]);
  const [connectionType, setConnectionType] = useState<ConnectionType>('bezier');

  // Load waypoints from store and subscribe to changes
  useEffect(() => {
    const savedPoints = connectionControlPointsStore.getControlPoints(
      source.tableName,
      source.fieldNames[0],
      target.tableName,
      target.fieldNames[0],
      relationOwner
    );

    if (savedPoints.length > 0) {
      setWaypoints(savedPoints.map((p) => ({ x: p.x, y: p.y })));
    } else {
      setWaypoints([]);
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
        setWaypoints(current.map((p) => ({ x: p.x, y: p.y })));
      } else {
        setWaypoints([]);
      }
    }, 30); // Poll every 30ms for smoother updates

    return () => {
      clearInterval(interval);
    };
  }, [source.tableName, source.fieldNames, target.tableName, target.fieldNames, relationOwner]);

  // Subscribe to connection type changes
  useEffect(() => {
    setConnectionType(connectionTypeStore.getConnectionType());
    const unsubscribe = connectionTypeStore.subscribe((type) => {
      setConnectionType(type);
    });
    return unsubscribe;
  }, []);

  const linePath = useMemo(() => {
    return computeConnectionPathWithSymbols({
      targetXY,
      sourceXY,
      sourcePosition,
      targetPosition,
      relationSource: source.relation,
      relationTarget: target.relation,
      waypoints: connectionType === 'smoothstep' && waypoints.length > 0 ? waypoints : undefined,
      connectionType,
    });
  }, [sourcePosition, targetPosition, sourceX, targetX, sourceY, targetY, waypoints, connectionType]);

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
