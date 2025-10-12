import { createContext, useMemo, type ReactNode } from "react";

import type { TableDimensionProviderValue } from "@/types/table";

export const EnumDimensionContext = createContext<
  TableDimensionProviderValue | undefined
>(undefined);

interface EnumDimensionProviderProps {
  width: number;
  children: ReactNode;
}

const EnumDimensionProvider = ({
  children,
  width,
}: EnumDimensionProviderProps) => {
  const contextValue = useMemo(() => ({ width }), [width]);

  return (
    <EnumDimensionContext.Provider value={contextValue}>
      {children}
    </EnumDimensionContext.Provider>
  );
};

export default EnumDimensionProvider;
