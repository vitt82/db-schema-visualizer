import { useEffect, useState } from "react";

import { type JSONTableSchema } from "shared/types/tableSchema";
import { type JSONTableGroup } from "shared/types/tableGroup";

import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import { stageStateStore } from "json-table-schema-visualizer/src/stores/stagesState";
import { detailLevelStore } from "json-table-schema-visualizer/src/stores/detailLevelStore";
import { enumCoordsStore } from "json-table-schema-visualizer/src/stores/enumCoords";
import { tableGroupsStore } from "json-table-schema-visualizer/src/stores/tableGroups";

import { type SetSchemaCommandPayload, WebviewCommand } from "../../extension/types/webviewCommand";

export const useSchema = (): {
  schema: JSONTableSchema | null;
  key: string | null;
} => {
  const [schema, setSchema] = useState<JSONTableSchema | null>(null);
  const [schemaKey, setSchemaKey] = useState<string | null>(null);

  const updater = (e: MessageEvent): void => {
    const message = e.data as SetSchemaCommandPayload;
    if (
      !(message.type === "setSchema" && typeof message.payload === "object")
    ) {
      return;
    }

    if (message.key !== schemaKey) {
      // Get persisted groups from EXTENSION_PERSISTED_DATA
      const persistedData = (window as any).EXTENSION_PERSISTED_DATA ?? {};
      const groupsKey = `tableGroups:${message.key}`;
      const persistedGroups = persistedData[groupsKey] ?? [];
      console.log("[useSchema] Loading groups for key:", message.key, "persisted groups found:", Array.isArray(persistedGroups) ? persistedGroups.length : 0);
      
      // update stores
      tableCoordsStore.switchTo(
        message.key,
        message.payload.tables,
        message.payload.refs,
      );
      // switch enum coords store too (keep enums positions per schema key)
      enumCoordsStore.switchTo(
        message.key,
        message.payload.tables,
        message.payload.refs,
        message.payload.enums ?? [],
      );
      // switch table groups store (keep groups per schema key)
      // FIXED: Use persisted groups if available (they have priority over schema groups)
      // because user may have created/modified groups in the UI
      let persistedGroupsArray: JSONTableGroup[] = [];
      if (Array.isArray(persistedGroups)) {
        if (
          persistedGroups.length > 0 &&
          Array.isArray(persistedGroups[0]) &&
          (persistedGroups[0] as unknown[]).length === 2
        ) {
          persistedGroupsArray = (persistedGroups as Array<[string, JSONTableGroup]>).map(([, group]) => group);
        } else {
          persistedGroupsArray = persistedGroups as JSONTableGroup[];
        }
      }

      const groupsToUse: JSONTableGroup[] = persistedGroupsArray.length > 0
        ? persistedGroupsArray
        : (message.payload.groups ?? []);
      
      console.log("[useSchema] Using groups:", groupsToUse.length > 0 ? "persisted from storage" : "from schema payload");
      
      tableGroupsStore.switchTo(
        message.key,
        groupsToUse,
      );
      stageStateStore.switchTo(message.key);
      detailLevelStore.switchTo(message.key);

      setSchemaKey(message.key);
    }

    setSchema(message.payload);
    // notify extension host that schema was received and processed
    const getVsCodeApi = (): { postMessage: (m: unknown) => void } | undefined => {
      const win = window as unknown as Record<string, unknown>;
      const maybeApi = (win as any).vsCodeWebviewAPI;
      if (maybeApi != null && typeof (maybeApi as { postMessage?: unknown }).postMessage === "function") {
        return maybeApi as { postMessage: (m: unknown) => void };
      }

      const maybeAcquire = (win as any).acquireVsCodeApi;
      if (typeof maybeAcquire === "function") {
        try {
          return (maybeAcquire as () => { postMessage: (m: unknown) => void })();
        } catch {
          return undefined;
        }
      }

      return undefined;
    };

    try {
      const api = getVsCodeApi();
      if (api != null && typeof api.postMessage === "function") {
        const tablesCount = Array.isArray(message.payload?.tables) ? message.payload.tables.length : 0;
        const enumsCount = Array.isArray(message.payload?.enums) ? message.payload.enums.length : 0;
        const sampleTables = Array.isArray(message.payload?.tables)
          ? message.payload.tables.slice(0, 5).map((t: any) => t.name ?? t.key ?? "<unnamed>")
          : [];

        api.postMessage({
          command: WebviewCommand.SCHEMA_RECEIVED,
          message: JSON.stringify({
            key: message.key,
            ok: true,
            tables: tablesCount,
            enums: enumsCount,
            sampleTables,
          }),
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("useSchema: failed to post SCHEMA_RECEIVED ack", err);
    }
  };

  useEffect(() => {
    window.addEventListener("message", updater);

    return () => {
      window.removeEventListener("message", updater);
      // save current table position
      tableCoordsStore.saveCurrentStore();
      // save current enums positions as well
      enumCoordsStore.saveCurrentStore();
      // save current groups as well
      tableGroupsStore.saveCurrentStore();
    };
  }, []);

  return { schema, key: schemaKey };
};
