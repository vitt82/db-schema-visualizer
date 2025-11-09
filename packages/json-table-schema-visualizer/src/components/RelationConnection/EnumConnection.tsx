/* eslint-disable import/order */
import { useMemo, useState, useEffect } from "react";

import ConnectionPath from "./ConnectionPath";

import eventEmitter from "@/events-emitter";
import {
  computeTableDragEventName,
  computeEnumDragEventName,
} from "@/utils/eventName";
import { computeConnectionPathWithSymbols } from "@/utils/computeConnectionPaths";
import { computeConnectionHandlePos } from "@/utils/computeConnectionHandlePositions";
import { tableCoordsStore } from "@/stores/tableCoords";
import { enumCoordsStore } from "@/stores/enumCoords";
import { connectionTypeStore, type ConnectionType } from "@/stores/connectionTypeStore";
import { useRelationsColsY } from "@/hooks/relationConnection";
import { useTableWidthStoredValue } from "@/hooks/tableWidthStore";
import { useGetEnum } from "@/hooks/enums";
import { useGetEnumMinWidth } from "@/hooks/enum";

import { TABLE_HEADER_HEIGHT, TABLE_DEFAULT_MIN_WIDTH } from "@/constants/sizing";

import type { XYPosition } from "@/types/positions";
import { Position } from "@/types/positions";
import type { RelationItem } from "@/types/relation";

interface EnumConnectionProps {
  sourceTableName: string;
  sourceFieldName: string;
  enumName: string;
}

const EnumConnection = ({
  sourceTableName,
  sourceFieldName,
  enumName,
}: EnumConnectionProps) => {
  // State for reactive coordinates
  const [sourceTableCoords, setSourceTableCoords] = useState(() =>
    tableCoordsStore.getCoords(sourceTableName),
  );
  const [targetEnumCoords, setTargetEnumCoords] = useState(() =>
    enumCoordsStore.getCoords(enumName),
  );
  const [connectionType, setConnectionType] = useState<ConnectionType>('bezier');

  // compute source col index y
  const fakeSource: RelationItem = {
    tableName: sourceTableName,
    fieldNames: [sourceFieldName],
    relation: "?",
  };
  const fakeTarget: RelationItem = {
    tableName: enumName,
    fieldNames: [""],
    relation: "?",
  };

  const [sourceColY] = useRelationsColsY(fakeSource, fakeTarget);

  const sourceTableWidth = useTableWidthStoredValue(sourceTableName);
  
  // Get enum object and compute its width
  const enumObj = useGetEnum(enumName);
  const targetWidth = enumObj ? useGetEnumMinWidth(enumObj) : TABLE_DEFAULT_MIN_WIDTH;

  // Event names for drag events
  const sourceTableDragEventName = computeTableDragEventName(sourceTableName);
  const targetEnumDragEventName = computeEnumDragEventName(enumName);

  // Listen to table drag events
  useEffect(() => {
    const coordsUpdater = (coords: any): void => {
      setSourceTableCoords(coords as unknown as XYPosition);
    };

    eventEmitter.on(sourceTableDragEventName, coordsUpdater);
    return () => {
      eventEmitter.removeListener(sourceTableDragEventName, coordsUpdater);
    };
  }, [sourceTableDragEventName]);

  // Listen to enum drag events
  useEffect(() => {
    const coordsUpdater = (coords: any): void => {
      setTargetEnumCoords(coords as unknown as XYPosition);
    };

    eventEmitter.on(targetEnumDragEventName, coordsUpdater);
    return () => {
      eventEmitter.removeListener(targetEnumDragEventName, coordsUpdater);
    };
  }, [targetEnumDragEventName]);

  // Subscribe to connection type changes
  useEffect(() => {
    setConnectionType(connectionTypeStore.getConnectionType());
    const unsubscribe = connectionTypeStore.subscribe((type) => {
      setConnectionType(type);
    });
    return unsubscribe;
  }, []);

  const [sourcePosition, targetPosition, finalSourceX, finalTargetX] =
    computeConnectionHandlePos({
      sourceW: sourceTableWidth,
      sourceX: sourceTableCoords.x,
      targetW: targetWidth,
      targetX: targetEnumCoords.x,
    });

  // Force-correct anchoring for enums: sometimes computed anchors pick the
  // left side of the enum even when the enum is placed on the left of the
  // source table (which would make the line go behind the enum). To avoid
  // that visual glitch, prefer anchoring the enum on its right side when its
  // center is to the left of the table center (and viceversa).
  let resolvedSourcePosition = sourcePosition;
  let resolvedTargetPosition = targetPosition;
  let resolvedFinalSourceX = finalSourceX;
  let resolvedFinalTargetX = finalTargetX;

  try {
    const sourceCenter = sourceTableCoords.x + sourceTableWidth / 2;
    const targetCenter = targetEnumCoords.x + targetWidth / 2;

    // eslint-disable-next-line no-console
    console.debug("EnumConnection:", enumName, {
      sourceCenter,
      targetCenter,
      sourceTableWidth,
      targetWidth,
      enumObj: enumObj?.name,
    });

    if (targetCenter < sourceCenter) {
      // enum is left of table -> attach enum on RIGHT side
      resolvedTargetPosition = Position.Right;
      resolvedFinalTargetX = targetEnumCoords.x + targetWidth;
      // attach table on LEFT side
      resolvedSourcePosition = Position.Left;
      resolvedFinalSourceX = sourceTableCoords.x;
      // eslint-disable-next-line no-console
      console.debug("  → enum LEFT of table, using RIGHT anchor");
    } else if (targetCenter > sourceCenter) {
      // enum is right of table -> attach enum on LEFT side
      resolvedTargetPosition = Position.Left;
      resolvedFinalTargetX = targetEnumCoords.x;
      resolvedSourcePosition = Position.Right;
      resolvedFinalSourceX = sourceTableCoords.x + sourceTableWidth;
      // eslint-disable-next-line no-console
      console.debug("  → enum RIGHT of table, using LEFT anchor");
    }
  } catch (err) {
    // fallback to computed values on any error
    // eslint-disable-next-line no-console
    console.debug("EnumConnection: failed to resolve centers", err);
  }

  const sourceXY = { x: resolvedFinalSourceX, y: sourceColY + sourceTableCoords.y };

  // Ajustar el cálculo de targetY para conectar al centro del encabezado
  // targetEnumCoords are top-left; default to header center for side connections
  let targetY = targetEnumCoords.y + TABLE_HEADER_HEIGHT / 2;
  // when connecting from left or right, anchor vertically to header center
  if (
    (resolvedTargetPosition === Position.Left || resolvedTargetPosition === Position.Right) &&
    enumObj != null
  ) {
    // top-left + header offset
    targetY = targetEnumCoords.y + TABLE_HEADER_HEIGHT / 2; // Conectar al centro del encabezado
  }

  const targetXY = { x: resolvedFinalTargetX, y: targetY };

  const linePath = useMemo(
    () =>
      computeConnectionPathWithSymbols({
        targetXY,
        sourceXY,
        sourcePosition: resolvedSourcePosition,
        targetPosition: resolvedTargetPosition,
        relationSource: "?",
        relationTarget: "?",
        connectionType,
      }),
    [
      sourceXY.x,
      sourceXY.y,
      targetXY.x,
      targetXY.y,
      resolvedSourcePosition,
      resolvedTargetPosition,
      connectionType,
    ],
  );

  return (
    <ConnectionPath
      path={linePath}
      sourceTableName={sourceTableName}
      sourceFieldName={sourceFieldName}
      targetTableName={enumName}
      targetFieldName=""
      relationOwner={sourceTableName}
    />
  );
};

export default EnumConnection;
