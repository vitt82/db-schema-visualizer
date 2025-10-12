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
import { useRelationsColsY } from "@/hooks/relationConnection";
import { useTableWidthStoredValue } from "@/hooks/tableWidthStore";
import { useGetEnum } from "@/hooks/enums";

import { TABLE_HEADER_HEIGHT } from "@/constants/sizing";

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
  const targetWidth = useTableWidthStoredValue(enumName); // Use same hook, assume enum width is stored

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

  const [sourcePosition, targetPosition, finalSourceX, finalTargetX] =
    computeConnectionHandlePos({
      sourceW: sourceTableWidth,
      sourceX: sourceTableCoords.x,
      targetW: targetWidth,
      targetX: targetEnumCoords.x,
    });

  const sourceXY = { x: finalSourceX, y: sourceColY + sourceTableCoords.y };

  // Ajustar el cálculo de targetY para conectar al centro del encabezado
  // targetEnumCoords are top-left; default to header center for side connections
  let targetY = targetEnumCoords.y + TABLE_HEADER_HEIGHT / 2;
  const enumObj = useGetEnum(enumName);
  // when connecting from left or right, anchor vertically to header center
  if (
    (targetPosition === Position.Left || targetPosition === Position.Right) &&
    enumObj != null
  ) {
    // top-left + header offset
    targetY = targetEnumCoords.y + TABLE_HEADER_HEIGHT / 2; // Conectar al centro del encabezado
  }

  const targetXY = { x: finalTargetX, y: targetY };

  const linePath = useMemo(
    () =>
      computeConnectionPathWithSymbols({
        targetXY,
        sourceXY,
        sourcePosition,
        targetPosition,
        relationSource: "?",
        relationTarget: "?",
      }),
    [
      sourceXY.x,
      sourceXY.y,
      targetXY.x,
      targetXY.y,
      sourcePosition,
      targetPosition,
    ],
  );

  return (
    <ConnectionPath
      path={linePath}
      sourceTableName={sourceTableName}
      targetTableName={enumName}
      relationOwner={sourceTableName}
    />
  );
};

export default EnumConnection;
