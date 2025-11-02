import { useRef, useState, useEffect } from "react";
import { Group, Rect, Text as KonvaText, Circle } from "react-konva";
import type Konva from "konva";


import type { JSONTableGroup } from "shared/types/tableGroup";

import { useThemeColors } from "@/hooks/theme";
import { PADDINGS } from "@/constants/sizing";
import { tableGroupsStore } from "@/stores/tableGroups";
import { tableCoordsStore } from "@/stores/tableCoords";
import { enumCoordsStore } from "@/stores/enumCoords";
import eventEmitter from "@/events-emitter";
import { computeTableDragEventName, computeEnumDragEventName } from "@/utils/eventName";

interface TableGroupProps {
  group: JSONTableGroup & { x: number; y: number; width: number; height: number };
}

const HANDLE_RADIUS = 8;

const TableGroup = ({ group }: TableGroupProps) => {
  const themeColors = useThemeColors();
  const groupRef = useRef<Konva.Group>(null);
  const [position, setPosition] = useState({ x: group.x, y: group.y });
  const [dimensions, setDimensions] = useState({ width: group.width, height: group.height });
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const lastPositionRef = useRef({ x: group.x, y: group.y });

  useEffect(() => {
    setPosition({ x: group.x, y: group.y });
    setDimensions({ width: group.width, height: group.height });
    lastPositionRef.current = { x: group.x, y: group.y };
  }, [group.x, group.y, group.width, group.height]);

  useEffect(() => {
    // Detectar cuando una tabla o enum se está arrastrando para resaltar el grupo
    const handleDragStart = () => {
      setIsHighlighted(true);
    };
    
    const handleDragEnd = () => {
      setIsHighlighted(false);
    };

    eventEmitter.on("table:dragstart", handleDragStart);
    eventEmitter.on("table:dragend", handleDragEnd);
    eventEmitter.on("enum:dragstart", handleDragStart);

    return () => {
      eventEmitter.off("table:dragstart", handleDragStart);
      eventEmitter.off("table:dragend", handleDragEnd);
      eventEmitter.off("enum:dragstart", handleDragStart);
    };
  }, []);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>): void => {
    if (isResizing) return;
    
    const node = e.currentTarget as Konva.Group;
    const stage = node.getStage();
    if (stage == null) return;

    const newPos = { x: node.x(), y: node.y() };
    const deltaX = newPos.x - lastPositionRef.current.x;
    const deltaY = newPos.y - lastPositionRef.current.y;

    // Buscar y mover las tablas directamente en el Stage (síncrono)
    group.tableNames.forEach((tableName) => {
      // Buscar el nodo de la tabla por su nombre (asumiendo que tiene un name property)
      const tableNode = stage.find(`.table-${tableName}`)[0] as Konva.Group | undefined;
      if (tableNode != null) {
        const newTableX = tableNode.x() + deltaX;
        const newTableY = tableNode.y() + deltaY;
        tableNode.x(newTableX);
        tableNode.y(newTableY);
        
        // Emitir evento para que las conexiones se actualicen
        eventEmitter.emit(computeTableDragEventName(tableName), { x: newTableX, y: newTableY });
      }
    });

    // Buscar y mover los enums directamente en el Stage (síncrono)
    const enumNames = group.enumNames ?? [];
    enumNames.forEach((enumName) => {
      const enumNode = stage.find(`.enum-${enumName}`)[0] as Konva.Group | undefined;
      if (enumNode != null) {
        const newEnumX = enumNode.x() + deltaX;
        const newEnumY = enumNode.y() + deltaY;
        enumNode.x(newEnumX);
        enumNode.y(newEnumY);
        
        // Emitir evento para que las conexiones de enums se actualicen
        eventEmitter.emit(computeEnumDragEventName(enumName), { x: newEnumX, y: newEnumY });
      }
    });

    lastPositionRef.current = newPos;
    stage.batchDraw(); // Redibujar todo de una vez
  };

  const handleDragEnd = (): void => {
    const node = groupRef.current;
    if (node == null) return;

    const stage = node.getStage();
    if (stage == null) return;

    const finalPos = { x: node.x(), y: node.y() };

    // Guardar las posiciones finales de todas las tablas en el store
    group.tableNames.forEach((tableName) => {
      const tableNode = stage.find(`.table-${tableName}`)[0] as Konva.Group | undefined;
      if (tableNode != null) {
        const tablePos = { x: tableNode.x(), y: tableNode.y() };
        tableCoordsStore.setCoords(tableName, tablePos);
      }
    });

    // Guardar las posiciones finales de todos los enums en el store
    const enumNames = group.enumNames ?? [];
    enumNames.forEach((enumName) => {
      const enumNode = stage.find(`.enum-${enumName}`)[0] as Konva.Group | undefined;
      if (enumNode != null) {
        const enumPos = { x: enumNode.x(), y: enumNode.y() };
        enumCoordsStore.setCoords(enumName, enumPos);
      }
    });

    setPosition(finalPos);
    lastPositionRef.current = finalPos;
    tableGroupsStore.setGroupDimensions(group.id, finalPos);
    tableGroupsStore.saveCurrentStore();
    tableCoordsStore.saveCurrentStore();
  };

  const handleResizeStart = (): void => {
    setIsResizing(true);
  };

  const handleResizeDrag = (e: Konva.KonvaEventObject<DragEvent>, corner: 'se' | 'sw' | 'ne' | 'nw'): void => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (stage == null) return;

    const pointerPos = stage.getPointerPosition();
    if (pointerPos == null) return;

    let newWidth = dimensions.width;
    let newHeight = dimensions.height;
    let newX = position.x;
    let newY = position.y;

    switch (corner) {
      case 'se':
        newWidth = Math.max(200, pointerPos.x - position.x);
        newHeight = Math.max(150, pointerPos.y - position.y);
        break;
      case 'sw':
        newWidth = Math.max(200, position.x + dimensions.width - pointerPos.x);
        newHeight = Math.max(150, pointerPos.y - position.y);
        newX = pointerPos.x;
        break;
      case 'ne':
        newWidth = Math.max(200, pointerPos.x - position.x);
        newHeight = Math.max(150, position.y + dimensions.height - pointerPos.y);
        newY = pointerPos.y;
        break;
      case 'nw':
        newWidth = Math.max(200, position.x + dimensions.width - pointerPos.x);
        newHeight = Math.max(150, position.y + dimensions.height - pointerPos.y);
        newX = pointerPos.x;
        newY = pointerPos.y;
        break;
    }

    setDimensions({ width: newWidth, height: newHeight });
    setPosition({ x: newX, y: newY });
    
    if (groupRef.current != null) {
      groupRef.current.x(newX);
      groupRef.current.y(newY);
    }
  };

  const handleResizeEnd = (): void => {
    tableGroupsStore.setGroupDimensions(group.id, {
      ...position,
      ...dimensions,
    });
    tableGroupsStore.saveCurrentStore();
    setIsResizing(false);
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar el grupo "${group.name}"?`)) {
      tableGroupsStore.deleteGroup(group.id);
    }
  };

  const handleTitleDblClick = () => {
    const newName = prompt("Nuevo nombre del grupo:", group.name);
    if (newName != null && newName.trim() !== "") {
      tableGroupsStore.setGroup({
        ...group,
        name: newName.trim(),
      });
    }
  };

  const backgroundColor = group.color ?? (themeColors.bg === "white" ? "#FFF3E0" : "#2C2416");
  const borderColor = group.color ?? (themeColors.bg === "white" ? "#FF9800" : "#FFB74D");
  const textColor = themeColors.text[900];

  return (
    <Group
      ref={groupRef}
      x={position.x}
      y={position.y}
      draggable={!isResizing}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (groupRef.current != null) groupRef.current.moveToBottom();
      }}
    >
      {/* Fondo del grupo */}
      <Rect
        x={0}
        y={0}
        width={dimensions.width}
        height={dimensions.height}
        fill={backgroundColor}
        stroke={isHighlighted ? "#4CAF50" : borderColor}
        strokeWidth={isHighlighted ? 4 : 2}
        cornerRadius={PADDINGS.sm}
        opacity={isHighlighted ? 0.5 : 0.3}
        listening={false}
      />

      {/* Título del grupo */}
      <Rect
        x={0}
        y={0}
        width={dimensions.width}
        height={30}
        fill={borderColor}
        cornerRadius={[PADDINGS.sm, PADDINGS.sm, 0, 0]}
        opacity={0.6}
        onDblClick={handleTitleDblClick}
      />

      <KonvaText
        x={PADDINGS.md}
        y={8}
        text={`${group.name} (${group.tableNames.length} tabla${group.tableNames.length !== 1 ? 's' : ''}${(group.enumNames?.length ?? 0) > 0 ? `, ${group.enumNames?.length ?? 0} enum${(group.enumNames?.length ?? 0) !== 1 ? 's' : ''}` : ''})`}
        fontSize={14}
        fontStyle="bold"
        fill={textColor}
        onDblClick={handleTitleDblClick}
      />

      {/* Botón eliminar */}
      <Group
        x={dimensions.width - 25}
        y={5}
        onClick={handleDelete}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'default';
        }}
      >
        <Circle
          radius={10}
          fill="#f44336"
          stroke="#fff"
          strokeWidth={2}
        />
        <KonvaText
          x={-4}
          y={-7}
          text="×"
          fontSize={16}
          fontStyle="bold"
          fill="#fff"
        />
      </Group>

      {/* Resize handles */}
      <Circle
        x={dimensions.width}
        y={dimensions.height}
        radius={HANDLE_RADIUS}
        fill={borderColor}
        stroke="#fff"
        strokeWidth={2}
        draggable
        onDragStart={handleResizeStart}
        onDragMove={(e) => {
          handleResizeDrag(e, 'se');
        }}
        onDragEnd={handleResizeEnd}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'nwse-resize';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'default';
        }}
      />

      <Circle
        x={0}
        y={dimensions.height}
        radius={HANDLE_RADIUS}
        fill={borderColor}
        stroke="#fff"
        strokeWidth={2}
        draggable
        onDragStart={handleResizeStart}
        onDragMove={(e) => {
          handleResizeDrag(e, 'sw');
        }}
        onDragEnd={handleResizeEnd}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'nesw-resize';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'default';
        }}
      />

      <Circle
        x={dimensions.width}
        y={0}
        radius={HANDLE_RADIUS}
        fill={borderColor}
        stroke="#fff"
        strokeWidth={2}
        draggable
        onDragStart={handleResizeStart}
        onDragMove={(e) => {
          handleResizeDrag(e, 'ne');
        }}
        onDragEnd={handleResizeEnd}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'nesw-resize';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'default';
        }}
      />

      <Circle
        x={0}
        y={0}
        radius={HANDLE_RADIUS}
        fill={borderColor}
        stroke="#fff"
        strokeWidth={2}
        draggable
        onDragStart={handleResizeStart}
        onDragMove={(e) => {
          handleResizeDrag(e, 'nw');
        }}
        onDragEnd={handleResizeEnd}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'nwse-resize';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = 'default';
        }}
      />
    </Group>
  );
};

export default TableGroup;
