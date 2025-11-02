import { Group, Rect } from "react-konva";
import { useEffect, useMemo, useRef } from "react";

import TableHeader from "./TableHeader";
import Column from "./Column/Column";

import type { JSONTableTable } from "shared/types/tableSchema";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";

import {
  COLUMN_HEIGHT,
  PADDINGS,
  TABLE_COLOR_HEIGHT,
  TABLE_HEADER_HEIGHT,
} from "@/constants/sizing";
import { useThemeColors } from "@/hooks/theme";
import eventEmitter from "@/events-emitter";
import { computeTableDragEventName } from "@/utils/eventName";
import {
  useTableDefaultPosition,
  useTablesInfo,
  useTableWidth,
} from "@/hooks/table";
import { tableCoordsStore } from "@/stores/tableCoords";
import { useTableDetailLevel } from "@/hooks/tableDetailLevel";
import { TableDetailLevel } from "@/types/tableDetailLevel";
import { filterByDetailLevel } from "@/utils/filterByDetailLevel";
import computeFieldDisplayTypeName from "@/utils/getFieldType";
import { tableGroupsStore } from "@/stores/tableGroups";

interface TableProps extends JSONTableTable {}

const Table = ({ fields, name }: TableProps) => {
  const themeColors = useThemeColors();
  const { detailLevel } = useTableDetailLevel();
  const tableRef = useRef<null | Konva.Group>(null);
  const { setHoveredTableName } = useTablesInfo();
  const { x: tableX, y: tableY } = useTableDefaultPosition(name);
  const tablePreferredWidth = useTableWidth();
  
  const visibleFields = useMemo(() => {
    return filterByDetailLevel(fields, detailLevel);
  }, [detailLevel, fields]);
  
  useEffect(() => {
    if (tableRef.current != null) {
      tableRef.current.x(tableX);
      tableRef.current.y(tableY);
      eventEmitter.emit(tableDragEventName, { x: tableX, y: tableY });
    }
  }, [tableX, tableY]);

  const tableHeight =
    TABLE_COLOR_HEIGHT +
    COLUMN_HEIGHT +
    visibleFields.length * COLUMN_HEIGHT +
    PADDINGS.sm;

  const tableDragEventName = computeTableDragEventName(name);

  const propagateCoordinates = (node: Konva.Group) => {
    const tableCoords = { x: node.x(), y: node.y() };
    eventEmitter.emit(tableDragEventName, tableCoords);
    tableCoordsStore.setCoords(name, tableCoords);
  };

  const handleOnDrag = (event: KonvaEventObject<DragEvent>) => {
    event.currentTarget.moveToTop();
    propagateCoordinates(event.target as Konva.Group);
  };

  const handleOnDragStart = () => {
    eventEmitter.emit("table:dragstart");
  };

  const handleOnDragEnd = (event: KonvaEventObject<DragEvent>) => {
    eventEmitter.emit("table:dragend");
    
    const node = event.target as Konva.Group;
    const tablePos = { x: node.x(), y: node.y() };
    
    // Verificar si la tabla está dentro de algún grupo
    const groups = tableGroupsStore.getAllGroups();
    let foundGroupId: string | null = null;

    groups.forEach((group, groupId) => {
      // Verificar si el centro de la tabla está dentro del grupo
      const tableCenterX = tablePos.x + tablePreferredWidth / 2;
      const tableCenterY = tablePos.y + tableHeight / 2;

      const isInside =
        tableCenterX >= group.x &&
        tableCenterX <= group.x + group.width &&
        tableCenterY >= group.y &&
        tableCenterY <= group.y + group.height;

      if (isInside) {
        foundGroupId = groupId;
      }
    });

    if (foundGroupId !== null) {
      // Verificar si la tabla ya está en otro grupo y removerla
      groups.forEach((group, groupId) => {
        if (group.tableNames.includes(name) && groupId !== foundGroupId) {
          tableGroupsStore.removeTableFromGroup(groupId, name);
        }
      });

      // Agregar la tabla al grupo si no está ya
      const targetGroup = groups.get(foundGroupId);
      if (targetGroup != null && !targetGroup.tableNames.includes(name)) {
        tableGroupsStore.addTableToGroup(foundGroupId, name);
        // eslint-disable-next-line no-console
        console.log(`Tabla "${name}" agregada al grupo "${targetGroup.name}"`);
      }
    } else {
      // Si no está en ningún grupo, removerla de todos
      groups.forEach((group, groupId) => {
        if (group.tableNames.includes(name)) {
          tableGroupsStore.removeTableFromGroup(groupId, name);
          // eslint-disable-next-line no-console
          console.log(`Tabla "${name}" removida del grupo "${group.name}"`);
        }
      });
    }
  };

  const handleOnHover = () => {
    setHoveredTableName(name);
  };

  const handleOnBlur = () => {
    setHoveredTableName(null);
  };

  const moveTableToTop = () => {
    if (tableRef.current != null) {
      tableRef.current.moveToTop();
    }
  };

  return (
    <Group
      ref={tableRef}
      name={`table-${name}`}
      draggable
      onDragStart={handleOnDragStart}
      onDragMove={handleOnDrag}
      onDragEnd={handleOnDragEnd}
      width={tablePreferredWidth}
      height={tableHeight}
      onMouseEnter={handleOnHover}
      onMouseLeave={handleOnBlur}
      onClick={moveTableToTop}
    >
      <Rect
        shadowBlur={PADDINGS.xs}
        shadowOpacity={0.2}
        shadowColor={themeColors.table.shadow}
        height={tableHeight}
        width={tablePreferredWidth}
        fill={themeColors.table.bg}
        cornerRadius={PADDINGS.sm}
      />

      <TableHeader title={name} />
      {detailLevel !== TableDetailLevel.HeaderOnly ? (
        <Group y={TABLE_HEADER_HEIGHT}>
          {visibleFields.map((field, index) => (
            <Column
              key={field.name}
              colName={field.name}
              tableName={name}
              isEnum={field.type.is_enum}
              type={computeFieldDisplayTypeName(field)}
              isPrimaryKey={field.pk}
              offsetY={index * COLUMN_HEIGHT}
              relationalTables={field.relational_tables}
              note={field.note}
            />
          ))}
        </Group>
      ) : (
        <></>
      )}
    </Group>
  );
};

export default Table;
