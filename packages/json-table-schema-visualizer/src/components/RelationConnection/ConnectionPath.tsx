import { useState, useRef, useEffect } from "react";
import { Path, Group, Circle } from "react-konva";

import type Konva from "konva";

import { useThemeColors } from "@/hooks/theme";
import { useTablesInfo } from "@/hooks/table";
import { useTableColor } from "@/hooks/tableColor";
import {
  connectionControlPointsStore,
  type ControlPoint,
} from "@/stores/connectionControlPoints";

interface ConnectionPathProps {
  path: string;
  sourceTableName: string;
  targetTableName: string;
  relationOwner: string;
}

const CONTROL_POINT_RADIUS = 8;

const ConnectionPath = ({
  path,
  sourceTableName,
  targetTableName,
  relationOwner,
}: ConnectionPathProps) => {
  const themeColors = useThemeColors();
  const { hoveredTableName } = useTablesInfo();
  const sourceTableColors = useTableColor(relationOwner);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const pathRef = useRef<Konva.Path>(null);
  const groupRef = useRef<Konva.Group>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  // Cargar control points al montar
  useEffect(() => {
    const points = connectionControlPointsStore.getControlPoints(
      sourceTableName,
      targetTableName,
      relationOwner
    );
    setControlPoints(points);
  }, [sourceTableName, targetTableName, relationOwner]);

  const highlight =
    hoveredTableName === sourceTableName ||
    hoveredTableName === targetTableName ||
    isHovered;

  const strokeColor = highlight
    ? sourceTableColors?.regular ?? themeColors.connection.active
    : themeColors.connection.default;

  // Generar path dashed con control points
  const dashedPath = isEditing && controlPoints.length > 0 ? generateDashedPath(path, controlPoints) : null;

  const handlePathClick = (e: Konva.KonvaEventObject<MouseEvent>): void => {
    const stage = e.currentTarget.getStage();
    if (stage == null) return;

    const pointerPos = stage.getPointerPosition();
    if (pointerPos == null) return;

    // Si ya estamos editando, crear nuevo punto de control
    if (isEditing) {
      connectionControlPointsStore.addControlPoint(
        sourceTableName,
        targetTableName,
        relationOwner,
        { x: pointerPos.x, y: pointerPos.y }
      );

      const newPoints = connectionControlPointsStore.getControlPoints(
        sourceTableName,
        targetTableName,
        relationOwner
      );
      setControlPoints(newPoints);
    } else {
      // Entrar en modo edición
      setIsEditing(true);
      stageRef.current = stage;
    }
  };

  const handleControlPointDragStart = (): void => {
    const stage = pathRef.current?.getStage();
    if (stage != null) {
      stageRef.current = stage;
    }
  };

  const handleControlPointDragMove = (pointId: string, x: number, y: number): void => {
    connectionControlPointsStore.moveControlPoint(
      sourceTableName,
      targetTableName,
      relationOwner,
      pointId,
      { x, y }
    );

    setControlPoints((prev) =>
      prev.map((p) => (p.id === pointId ? { ...p, x, y } : p))
    );
  };

  const handleControlPointDragEnd = (): void => {
    // Los puntos ya se guardaron en handleControlPointDragMove
  };

  // Escuchar clicks fuera para salir del modo edición
  useEffect(() => {
    if (!isEditing) return;

    const handleDocClick = (e: MouseEvent): void => {
      // Si clickeó fuera del canvas, salir del modo edición
      const stage = stageRef.current;
      if (stage == null) return;

      const container = stage.container();
      if (container == null || !container.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };

    document.addEventListener("click", handleDocClick);
    return (): void => {
      document.removeEventListener("click", handleDocClick);
    };
  }, [isEditing]);

  return (
    <Group ref={groupRef}>
      {/* Línea principal */}
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
        cursor={isEditing ? "crosshair" : "pointer"}
      />

      {/* Línea punteada con control points (solo cuando estamos editando) */}
      {isEditing && controlPoints.length > 0 && (
        <>
          {/* Renderizar línea punteada */}
          <Path
            data={dashedPath ?? path}
            strokeWidth={2}
            stroke={strokeColor}
            dash={[5, 5]}
            opacity={0.6}
            listening={false}
          />

          {/* Renderizar círculos de control */}
          {controlPoints.map((point) => (
            <DraggableControlPoint
              key={point.id}
              point={point}
              pointRadius={CONTROL_POINT_RADIUS}
              strokeColor={strokeColor}
              backgroundColor={themeColors.bg}
              onDragStart={handleControlPointDragStart}
              onDragMove={(x, y) => {
                handleControlPointDragMove(point.id, x, y);
              }}
              onDragEnd={handleControlPointDragEnd}
            />
          ))}
        </>
      )}
    </Group>
  );
};

interface DraggableControlPointProps {
  point: ControlPoint;
  pointRadius: number;
  strokeColor: string;
  backgroundColor: string;
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
}

const DraggableControlPoint = ({
  point,
  pointRadius,
  strokeColor,
  backgroundColor,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableControlPointProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);

  const handleMouseDown = (): void => {
    setIsDragging(true);
    onDragStart();
  };

  useEffect(() => {
    if (!isDragging) return;

    const stage = stageRef.current;
    if (stage == null) return;

    const handleMouseMove = (): void => {
      const pointerPos = stage.getPointerPosition();
      if (pointerPos == null) return;
      onDragMove(pointerPos.x, pointerPos.y);
    };

    const handleMouseUp = (): void => {
      setIsDragging(false);
      onDragEnd();
      document.removeEventListener("pointermove", handleMouseMove);
      document.removeEventListener("pointerup", handleMouseUp);
    };

    document.addEventListener("pointermove", handleMouseMove);
    document.addEventListener("pointerup", handleMouseUp);

    return (): void => {
      document.removeEventListener("pointermove", handleMouseMove);
      document.removeEventListener("pointerup", handleMouseUp);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  return (
    <Circle
      ref={(node) => {
        if (node != null) {
          stageRef.current = node.getStage();
        }
      }}
      x={point.x}
      y={point.y}
      radius={pointRadius}
      fill={backgroundColor}
      stroke={strokeColor}
      strokeWidth={2}
      onMouseDown={handleMouseDown}
      onMouseEnter={(e): void => {
        const stage = e.currentTarget.getStage();
        const container = stage?.container();
        if (container != null) {
          // eslint-disable-next-line no-param-reassign
          container.style.cursor = isDragging ? "grabbing" : "grab";
        }
      }}
      onMouseLeave={(e): void => {
        const stage = e.currentTarget.getStage();
        const container = stage?.container();
        if (container != null) {
          // eslint-disable-next-line no-param-reassign
          container.style.cursor = "default";
        }
      }}
    />
  );
};

// Helper: generar path dashed que incluya los control points
function generateDashedPath(originalPath: string, controlPoints: ControlPoint[]): string {
  if (controlPoints.length === 0) return originalPath;

  // Parse del path original para extraer el segmento principal
  const pathParts = originalPath.split(' ').filter(Boolean);
  let mainPathEndIndex = pathParts.length;
  
  for (let i = 1; i < pathParts.length; i++) {
    if (pathParts[i] === 'M' && i > 0) {
      mainPathEndIndex = i;
      break;
    }
  }

  const mainPathParts = pathParts.slice(0, mainPathEndIndex);
  const symbolParts = pathParts.slice(mainPathEndIndex);

  let modifiedPath = mainPathParts.join(' ');
  
  // Agregar líneas a través de cada control point
  if (controlPoints.length > 0) {
    const lastPointMatch = mainPathParts[mainPathParts.length - 1]?.match(/[-\d.]+/g);
    
    if (lastPointMatch != null && lastPointMatch.length >= 2) {
      for (const point of controlPoints) {
        modifiedPath += ` L ${point.x} ${point.y}`;
      }
    }
  }

  return `${modifiedPath} ${symbolParts.join(' ')}`;
}

export default ConnectionPath;
