import { useContext } from "react";
import { type JSONTableEnum } from "shared/types/tableSchema";

import { EnumDimensionContext } from "@/providers/EnumDimension";
import { TABLE_DEFAULT_MIN_WIDTH } from "@/constants/sizing";
import { createEnumItemText } from "@/utils/createEnumItemText";
import { computeTextSize } from "@/utils/computeTextSize";

export const useGetEnumMinWidth = (enumObj: JSONTableEnum): number => {
  const titleSize = computeTextSize(`Enum ${enumObj.name}`);
  const itemsSize = enumObj.values.map((v) =>
    computeTextSize(createEnumItemText(v.name)),
  );

  const maxW = Math.max(...itemsSize.map((s) => s.width), titleSize.width);

  return Math.max(maxW + 32, TABLE_DEFAULT_MIN_WIDTH);
};

export const useEnumWidth = (): number => {
  const contextValue = useContext(EnumDimensionContext);

  return contextValue?.width ?? TABLE_DEFAULT_MIN_WIDTH;
};
