import { useState, useRef, useEffect } from "react";
import { Path, Group, Circle } from "react-konva";

import type Konva from "konva";

import { useThemeColors } from "@/hooks/theme";
import { useTablesInfo } from "@/hooks/table";
import { useTableColor } from "@/hooks/tableColor";
import { connectionControlPointsStore } from "@/stores/connectionControlPoints";

interface ConnectionPathProps {
  path: string;
  sourceTableName: string;
  sourceFieldName: string;
  targetTableName: string;
  targetFieldName: string;
  relationOwner: string;
}

const CONTROL_POINT_RADIUS = 5;
const CONTROL_POINT_HIT_RADIUS = 14;

interface Point { x: number; y: number }

const ConnectionPath = ({
  path,
  sourceTableName,
  sourceFieldName,
  targetTableName,
  targetFieldName,
  relationOwner,
}: ConnectionPathProps) => {
  const themeColors = useThemeColors();
  const { hoveredTableName } = useTablesInfo();
  const sourceTableColors = useTableColor(relationOwner);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [midPoint, setMidPoint] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pathRef = useRef<Konva.Path>(null);
  const groupRef = useRef<Konva.Group>(null);

  // Load saved midpoint on mount
  useEffect(() => {
    const savedPoints = connectionControlPointsStore.getControlPoints(
      sourceTableName,
      sourceFieldName,
      targetTableName,
      targetFieldName,
      relationOwner
    );

    if (savedPoints.length > 0) {
      setMidPoint({ x: savedPoints[0].x, y: savedPoints[0].y });
    }
  }, [sourceTableName, sourceFieldName, targetTableName, targetFieldName, relationOwner]);

  const highlight =
    hoveredTableName === sourceTableName ||
    hoveredTableName === targetTableName ||
    isHovered;

  const strokeColor = highlight
    ? sourceTableColors?.regular ?? themeColors.connection.active
    : themeColors.connection.default;

  const handleMidPointDragMove = (x: number, y: number): void => {
    setMidPoint({ x, y });

    const savedPoints = connectionControlPointsStore.getControlPoints(
      sourceTableName,
      sourceFieldName,
      targetTableName,
      targetFieldName,
      relationOwner
    );

    if (savedPoints.length > 0) {
      connectionControlPointsStore.moveControlPoint(
        sourceTableName,
        sourceFieldName,
        targetTableName,
        targetFieldName,
        relationOwner,
        savedPoints[0].id,
        { x, y }
      );
    } else {
      connectionControlPointsStore.addControlPoint(
        sourceTableName,
        sourceFieldName,
        targetTableName,
        targetFieldName,
        relationOwner,
        { x, y }
      );
    }
  };

  const handleMidPointDragEnd = (): void => {
    setIsDragging(false);
  };

  const handlePathClick = (e: Konva.KonvaEventObject<MouseEvent>): void => {
    e.cancelBubble = true;

    if (!isEditing) {
      setIsEditing(true);

      // Save initial midpoint if not already saved
      const savedPoints = connectionControlPointsStore.getControlPoints(
        sourceTableName,
        sourceFieldName,
        targetTableName,
        targetFieldName,
        relationOwner
      );

      if (savedPoints.length === 0 && midPoint != null) {
        connectionControlPointsStore.addControlPoint(
          sourceTableName,
          sourceFieldName,
          targetTableName,
          targetFieldName,
          relationOwner,
          midPoint
        );
      }

      try { groupRef.current?.moveToTop(); } catch {}
    }
  };

  // Exit edit mode with ESC key only
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setIsEditing(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return (): void => { document.removeEventListener("keydown", handleKeyDown); };
  }, [isEditing]);

  return (
    <Group ref={groupRef}>
      {/* Main line */}
      <Path
        ref={pathRef}
        data={path}
        onMouseEnter={(): void => {
          setIsHovered(true);
        }}
        onMouseLeave={(): void => {
          setIsHovered(false);
        }}
        onClick={handlePathClick}
        strokeWidth={isHovered ? 3 : 2}
        stroke={strokeColor}
        cursor={isEditing ? "default" : "pointer"}
      />

      {/* Edit mode control point */}
      {isEditing && midPoint != null && (
        <MidPointControl
          x={midPoint.x}
          y={midPoint.y}
          radius={CONTROL_POINT_RADIUS}
          strokeColor={strokeColor}
          backgroundColor={themeColors.bg}
          isDragging={isDragging}
          onDragMove={handleMidPointDragMove}
          onDragEnd={handleMidPointDragEnd}
        />
      )}
    </Group>
  );
};

interface MidPointControlProps {
  x: number;
  y: number;
  radius: number;
  strokeColor: string;
  backgroundColor: string;
  isDragging: boolean;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
}

const MidPointControl = ({
  x,
  y,
  radius,
  strokeColor,
  backgroundColor,
  isDragging,
  onDragMove,
  onDragEnd,
}: MidPointControlProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const circleRef = useRef<Konva.Circle>(null);

  // Use Konva's built-in drag handling
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>): void => {
    const node = e.target as Konva.Circle;
    onDragMove(node.x(), node.y());
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>): void => {
    e.cancelBubble = true;
    // Just mark that we're starting drag, don't call the mouse down
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>): void => {
    e.cancelBubble = true;
    onDragEnd();
  };

  const displayRadius = isHovered || isDragging ? radius + 3 : radius;

  return (
    <Group>
      {/* Draggable control circle */}
      <Circle
        ref={circleRef}
        x={x}
        y={y}
        radius={CONTROL_POINT_HIT_RADIUS}
        fill="transparent"
        draggable
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={(): void => {
          setIsHovered(true);
          const container = circleRef.current?.getStage()?.container();
          if (container != null) {
            container.style.cursor = isDragging ? "grabbing" : "grab";
          }
        }}
        onMouseLeave={(): void => {
          setIsHovered(false);
          const container = circleRef.current?.getStage()?.container();
          if (container != null) {
            container.style.cursor = "default";
          }
        }}
      />

      {/* Visual circle indicator */}
      <Circle
        x={x}
        y={y}
        radius={displayRadius}
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth={isHovered || isDragging ? 3 : 2}
        listening={false}
      />
    </Group>
  );
};

export default ConnectionPath;
