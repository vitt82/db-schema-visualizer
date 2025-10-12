import { useEffect, useState } from "react";
import { type JSONTableSchema } from "shared/types/tableSchema";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import { stageStateStore } from "json-table-schema-visualizer/src/stores/stagesState";
import { detailLevelStore } from "json-table-schema-visualizer/src/stores/detailLevelStore";
import { enumCoordsStore } from "json-table-schema-visualizer/src/stores/enumCoords";

import { type SetSchemaCommandPayload } from "../../extension/types/webviewCommand";

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
      stageStateStore.switchTo(message.key);
      detailLevelStore.switchTo(message.key);

      setSchemaKey(message.key);
    }

    setSchema(message.payload);
  };

  useEffect(() => {
    window.addEventListener("message", updater);

    return () => {
      window.removeEventListener("message", updater);
      // save current table position
      tableCoordsStore.saveCurrentStore();
      // save current enums positions as well
      enumCoordsStore.saveCurrentStore();
    };
  }, []);

  return { schema, key: schemaKey };
};
