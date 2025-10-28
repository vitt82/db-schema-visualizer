import { Group, Rect, Text as KonvaText } from "react-konva";
import { useEffect, useRef } from "react";

import type { JSONTableEnum } from "shared/types/tableSchema";
import type Konva from "konva";

import {
  PADDINGS,
  TABLE_COLOR_HEIGHT,
  TABLE_HEADER_HEIGHT,
} from "@/constants/sizing";
import { useEnumWidth } from "@/hooks/enum";
import { useThemeColors } from "@/hooks/theme";
import eventEmitter from "@/events-emitter";
import { enumCoordsStore } from "@/stores/enumCoords";
import { computeEnumDragEventName } from "@/utils/eventName";

interface EnumProps extends JSONTableEnum {}

const Enum = ({ name, values }: EnumProps) => {
  const themeColors = useThemeColors();
  const enumRef = useRef<any>(null);
  const width = useEnumWidth();

  const enumHeight =
    TABLE_COLOR_HEIGHT + TABLE_HEADER_HEIGHT + values.length * 24 + PADDINGS.sm;

  useEffect(() => {
    // set initial position from store
    const pos = enumCoordsStore.getCoords(name);
    if (enumRef.current != null) {
      enumRef.current.x(pos.x);
      enumRef.current.y(pos.y);
    }

    const handleReset = (map: Map<string, { x: number; y: number }>) => {
      const p = map.get(name);
      if (p != null && enumRef.current != null) {
        enumRef.current.x(p.x);
        enumRef.current.y(p.y);
      }
    };

    eventEmitter.on("enumCoords:resetEnumsPositions", handleReset);

    return () => {
      eventEmitter.off("enumCoords:resetEnumsPositions", handleReset);
    };
  }, [name]);

  return (
    <Group
      ref={enumRef}
      draggable
      onDragMove={(e) => {
        const node = e.currentTarget as Konva.Group;
        const coords = { x: node.x(), y: node.y() };
        // debug
        // eslint-disable-next-line no-console
        console.debug("enum: onDragMove", name, coords);
        eventEmitter.emit(computeEnumDragEventName(name), coords);
        enumCoordsStore.setCoords(name, coords);
        // Force immediate save to persistence to avoid race conditions
        try {
          // eslint-disable-next-line no-console
          console.debug("enum: force save coords", name, coords);
          enumCoordsStore.saveCurrentStore();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("enum: failed to save coords", err);
        }
      }}
      onClick={() => {
        if (enumRef.current != null) enumRef.current.moveToTop();
      }}
    >
      <Rect
        shadowBlur={PADDINGS.xs}
        shadowOpacity={0.2}
        shadowColor={themeColors.table.shadow}
        height={enumHeight}
        width={width}
        fill={themeColors.enumBg ?? themeColors.table.bg}
        cornerRadius={PADDINGS.sm}
      />

      <KonvaText
        x={PADDINGS.md}
        y={PADDINGS.sm}
        fontStyle="bold"
        text={name}
        fill={themeColors.tableHeader?.fg ?? themeColors.white}
      />

      <Group y={TABLE_HEADER_HEIGHT}>
        {values.map((v, idx) => (
          <KonvaText
            key={v.name}
            x={PADDINGS.md}
            y={idx * 24 + PADDINGS.xs}
            text={v.name}
            fill={themeColors.enumItem}
          />
        ))}
      </Group>
    </Group>
  );
};

export default Enum;
