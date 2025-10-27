import {
  createContext,
  useMemo,
  useEffect,
  type PropsWithChildren,
} from "react";

import type {
  JSONTableRef,
  JSONTableTable,
  JSONTableEnum,
} from "shared/types/tableSchema";
import type { TablesPositionsContextValue } from "@/types/dimension";

import { tableCoordsStore } from "@/stores/tableCoords";
import { enumCoordsStore } from "@/stores/enumCoords";

export const TablesPositionsContext =
  createContext<TablesPositionsContextValue | null>(null);

interface TablesPositionsProviderProps extends PropsWithChildren {
  tables: JSONTableTable[];
  refs: JSONTableRef[];
  enums: JSONTableEnum[];
}

const TablesPositionsProvider = ({
  tables,
  refs,
  enums,
  children,
}: TablesPositionsProviderProps) => {
  const resetPositions = () => {
    tableCoordsStore.resetPositions(tables, refs);
    // reset enum positions as well
    enumCoordsStore.resetPositions(tables, refs, enums);
  };

  // Compute a lightweight structural fingerprint so we only recompute layout when the
  // actual schema structure changes (tables/refs/enums added/removed or renamed).
  const computeStructureFingerprint = (
    tablesList: JSONTableTable[],
    refsList: JSONTableRef[],
    enumsList: JSONTableEnum[],
  ) => {
    const tableNames = tablesList.map((t) => t.name).sort();
    const enumNames = enumsList.map((e) => e.name).sort();
    const refsPairs = refsList
      .map((r) => {
        const a = r.endpoints[0].tableName;
        const b = r.endpoints[1].tableName;
        return `${a}->${b}`;
      })
      .sort();

    return JSON.stringify({ tableNames, enumNames, refsPairs });
  };

  // Only reset layout when the structural fingerprint changes. Respect user preference
  // provided via window.EXTENSION_DEFAULT_CONFIG.autoLayoutOnStructuralChange.
  useEffect(() => {
    const autoLayoutPref = (window as any).EXTENSION_DEFAULT_CONFIG
      ?.autoLayoutOnStructuralChange;

    const lastFingerprintRef: { current?: string } = {} as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key = "__tablesPositionsFingerprint" as any;
    lastFingerprintRef.current = (TablesPositionsProvider as any)[key] as
      | string
      | undefined;

    const fingerprint = computeStructureFingerprint(tables, refs, enums);

    // If there are already coordinates loaded (e.g., from persistence), don't override them on first render
    const currentSize = tableCoordsStore.getCurrentStoreValue().size;

    if (lastFingerprintRef.current !== fingerprint) {
      // Only auto-reset if user preference allows it. Otherwise, skip.
      if (autoLayoutPref !== false) {
        // eslint-disable-next-line no-console
        console.debug(
          "TablesPositionsProvider: structural change detected, applying resetPositions with merge",
          { prev: lastFingerprintRef.current, next: fingerprint, currentSize },
        );
        // resetPositions now merges with persisted and current positions
        resetPositions();
      } else {
        // eslint-disable-next-line no-console
        console.debug(
          "TablesPositionsProvider: autoLayoutOnStructuralChange disabled, skipping resetPositions",
          { prev: lastFingerprintRef.current, next: fingerprint, currentSize },
        );
      }
      (TablesPositionsProvider as any)[key] = fingerprint;
    }

    return () => {};
  }, [tables, refs, enums]);

  const contextValue = useMemo(() => ({ resetPositions }), [resetPositions]);

  return (
    <TablesPositionsContext.Provider value={contextValue}>
      {children}
    </TablesPositionsContext.Provider>
  );
};

export default TablesPositionsProvider;
