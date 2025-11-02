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
  onRequestRename?: (groupId: string, currentName: string) => void;
}

const HANDLE_RADIUS = 8;

const TableGroup = ({ group, onRequestRename }: TableGroupProps) => {
  const themeColors = useThemeColors();
  const groupRef = useRef<Konva.Group>(null);
  const [position, setPosition] = useState({ x: group.x, y: group.y });
  const [dimensions, setDimensions] = useState({ width: group.width, height: group.height });
  const [isResizing, setIsResizing] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const lastPositionRef = useRef({ x: group.x, y: group.y });
  const resizeStartRef = useRef<
    { x: number; y: number; width: number; height: number; mouseX: number; mouseY: number } | null
  >(null);
  const resizingCornerRef = useRef<"se" | "sw" | "ne" | "nw" | null>(null);

  useEffect(() => {
    setPosition({ x: group.x, y: group.y });
    setDimensions({ width: group.width, height: group.height });
    lastPositionRef.current = { x: group.x, y: group.y };
  }, [group.x, group.y, group.width, group.height]);

  useEffect(() => {
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

    group.tableNames.forEach((tableName) => {
      const tableNode = stage.find(`.table-${tableName}`)[0] as Konva.Group | undefined;
      if (tableNode != null) {
        const newTableX = tableNode.x() + deltaX;
        const newTableY = tableNode.y() + deltaY;
        tableNode.x(newTableX);
        tableNode.y(newTableY);
        eventEmitter.emit(computeTableDragEventName(tableName), { x: newTableX, y: newTableY });
      }
    });

    const enumNames = group.enumNames ?? [];
    enumNames.forEach((enumName) => {
      const enumNode = stage.find(`.enum-${enumName}`)[0] as Konva.Group | undefined;
      if (enumNode != null) {
        const newEnumX = enumNode.x() + deltaX;
        const newEnumY = enumNode.y() + deltaY;
        enumNode.x(newEnumX);
        enumNode.y(newEnumY);
        eventEmitter.emit(computeEnumDragEventName(enumName), { x: newEnumX, y: newEnumY });
      }
    });

    lastPositionRef.current = newPos;
    stage.batchDraw();
  };

  const handleDragEnd = (): void => {
    const node = groupRef.current;
    if (node == null) return;

    const stage = node.getStage();
    if (stage == null) return;

    const finalPos = { x: node.x(), y: node.y() };

    group.tableNames.forEach((tableName) => {
      const tableNode = stage.find(`.table-${tableName}`)[0] as Konva.Group | undefined;
      if (tableNode != null) {
        const tablePos = { x: tableNode.x(), y: tableNode.y() };
        tableCoordsStore.setCoords(tableName, tablePos);
      }
    });

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

  const handleResizeMouseDown = (corner: "se" | "sw" | "ne" | "nw", e: Konva.KonvaEventObject<MouseEvent>): void => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    e.evt.preventDefault();
    
    const stage = groupRef.current?.getStage();
    if (stage == null || groupRef.current == null) return;
    
    const pointerPos = stage.getPointerPosition();
    if (pointerPos == null) return;

    setIsResizing(true);
    resizingCornerRef.current = corner;
    resizeStartRef.current = {
      x: groupRef.current.x(),
      y: groupRef.current.y(),
      width: dimensions.width,
      height: dimensions.height,
      mouseX: pointerPos.x,
      mouseY: pointerPos.y,
    };

    const handleMouseMove = (): void => {
      if (resizeStartRef.current == null || resizingCornerRef.current == null) return;
      const currentPos = stage.getPointerPosition();
      if (currentPos == null) return;

      const startPos = resizeStartRef.current;
      const deltaX = currentPos.x - startPos.mouseX;
      const deltaY = currentPos.y - startPos.mouseY;

      let newWidth = startPos.width;
      let newHeight = startPos.height;
      let newX = startPos.x;
      let newY = startPos.y;

      switch (resizingCornerRef.current) {
        case "se":
          newWidth = Math.max(200, startPos.width + deltaX);
          newHeight = Math.max(150, startPos.height + deltaY);
          break;
        case "sw":
          newWidth = Math.max(200, startPos.width - deltaX);
          newHeight = Math.max(150, startPos.height + deltaY);
          newX = startPos.x + (startPos.width - newWidth);
          break;
        case "ne":
          newWidth = Math.max(200, startPos.width + deltaX);
          newHeight = Math.max(150, startPos.height - deltaY);
          newY = startPos.y + (startPos.height - newHeight);
          break;
        case "nw":
          newWidth = Math.max(200, startPos.width - deltaX);
          newHeight = Math.max(150, startPos.height - deltaY);
          newX = startPos.x + (startPos.width - newWidth);
          newY = startPos.y + (startPos.height - newHeight);
          break;
      }

      if (groupRef.current != null) {
        groupRef.current.x(newX);
        groupRef.current.y(newY);
      }
      
      setDimensions({ width: newWidth, height: newHeight });
      stage.batchDraw();
    };

    const handleMouseUp = (): void => {
      if (groupRef.current != null) {
        const finalX = groupRef.current.x();
        const finalY = groupRef.current.y();
        
        setPosition({ x: finalX, y: finalY });
        
        tableGroupsStore.setGroupDimensions(group.id, {
          x: finalX,
          y: finalY,
          width: dimensions.width,
          height: dimensions.height,
        });
        tableGroupsStore.saveCurrentStore();
      }
      
      resizeStartRef.current = null;
      resizingCornerRef.current = null;
      setIsResizing(false);
      
      stage.off("mousemove", handleMouseMove);
      stage.off("mouseup", handleMouseUp);
    };

    stage.on("mousemove", handleMouseMove);
    stage.on("mouseup", handleMouseUp);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(`¿Eliminar el grupo "${group.name}"?`);
    if (confirmed) {
      tableGroupsStore.deleteGroup(group.id);
    }
  };

  const handleTitleDblClick = () => {
    onRequestRename?.(group.id, group.name);
  };

  const backgroundColor = group.color ?? (themeColors.bg === "white" ? "#E3F2FD" : "#1A2332");
  const borderColor = group.color ?? (themeColors.bg === "white" ? "#2196F3" : "#42A5F5");
  const textColor = themeColors.bg === "white" ? "#000000" : "#FFFFFF";

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

      <Rect
        x={0}
        y={0}
        width={dimensions.width}
        height={40}
        fill={borderColor}
        cornerRadius={[PADDINGS.sm, PADDINGS.sm, 0, 0]}
        opacity={0.8}
        onDblClick={handleTitleDblClick}
      />

      <KonvaText
        x={PADDINGS.md}
        y={12}
        text={`${group.name} (${group.tableNames.length} tabla${group.tableNames.length !== 1 ? "s" : ""}${(group.enumNames?.length ?? 0) > 0 ? `, ${group.enumNames?.length ?? 0} enum${(group.enumNames?.length ?? 0) !== 1 ? "s" : ""}` : ""})`}
        fontSize={16}
        fontStyle="bold"
        fill={textColor}
        onDblClick={handleTitleDblClick}
      />

      <Group
        x={dimensions.width - 30}
        y={8}
        onClick={handleDelete}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "pointer";
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "default";
        }}
      >
        <Circle radius={10} fill="#f44336" stroke="#fff" strokeWidth={2} />
        <KonvaText x={-4} y={-7} text="×" fontSize={16} fontStyle="bold" fill="#fff" />
      </Group>

      <Circle
        x={dimensions.width}
        y={dimensions.height}
        radius={HANDLE_RADIUS}
        fill={borderColor}
        stroke="#fff"
        strokeWidth={2}
        onMouseDown={(e) => { handleResizeMouseDown("se", e); }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "nwse-resize";
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "default";
        }}
      />

      <Circle
        x={0}
        y={dimensions.height}
        radius={HANDLE_RADIUS}
        fill={borderColor}
        stroke="#fff"
        strokeWidth={2}
        onMouseDown={(e) => { handleResizeMouseDown("sw", e); }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "nesw-resize";
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "default";
        }}
      />

      <Circle
        x={dimensions.width}
        y={0}
        radius={HANDLE_RADIUS}
        fill={borderColor}
        stroke="#fff"
        strokeWidth={2}
        onMouseDown={(e) => { handleResizeMouseDown("ne", e); }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "nesw-resize";
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "default";
        }}
      />

      <Circle
        x={0}
        y={0}
        radius={HANDLE_RADIUS}
        fill={borderColor}
        stroke="#fff"
        strokeWidth={2}
        onMouseDown={(e) => { handleResizeMouseDown("nw", e); }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "nwse-resize";
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container != null) container.style.cursor = "default";
        }}
      />
    </Group>
  );
};

export default TableGroup;
