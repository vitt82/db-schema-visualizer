import type { JSONTableGroup } from "shared/types/tableGroup";
import {
  type JSONTableEnum,
  type JSONTableRef,
  type JSONTableTable,
} from "shared/types/tableSchema";

import EmptyTableMessage from "../Messages/EmptyTableMessage";
import DiagramWrapper from "./DiagramWrapper";
import Enums from "./Enums";
import EnumConnections from "./EnumConnections";
import RelationsConnections from "./Connections";
import TableGroups from "./TableGroups";
import Tables from "./Tables";
import RenameGroupModal from "../Modals/RenameGroupModal";

import MainProviders from "@/providers/MainProviders";
import TableLevelDetailProvider from "@/providers/TableDetailLevelProvider";
import TablesPositionsProvider from "@/providers/TablesPositionsProvider";
import { RenameGroupProvider } from "@/contexts/RenameGroupContext";

interface DiagramViewerProps {
  tables: JSONTableTable[];
  refs: JSONTableRef[];
  enums: JSONTableEnum[];
  groups?: JSONTableGroup[];
  schemaKey?: string | null;
}

const DiagramViewer = ({ refs, tables, enums, groups = [], schemaKey }: DiagramViewerProps) => {
  if (tables.length === 0) {
    return <EmptyTableMessage />;
  }

  // post a small health report to the extension host to confirm rendering
  try {
    const win = window as unknown as Record<string, unknown>;
    const maybeApi = (win as any).vsCodeWebviewAPI ?? (typeof (win as any).acquireVsCodeApi === "function" ? (win as any).acquireVsCodeApi() : undefined);
    if (maybeApi != null && typeof maybeApi.postMessage === "function") {
      const sampleTables = Array.isArray(tables) ? tables.slice(0, 5).map((t: any) => t.name ?? t.key ?? "<unnamed>") : [];
      maybeApi.postMessage({
        command: "WEBVIEW_RENDERED",
        message: JSON.stringify({ key: schemaKey ?? null, tables: tables.length, enums: Array.isArray(enums) ? enums.length : 0, sampleTables }),
      });
    }
  } catch (err) {
    // ignore
  }

  return (
    <RenameGroupProvider>
      <TableLevelDetailProvider>
        <TablesPositionsProvider tables={tables} refs={refs} enums={enums}>
          <MainProviders tables={tables} enums={enums}>
            <DiagramWrapper>
              <TableGroups groups={groups} />
              <RelationsConnections refs={refs} />
              <EnumConnections tables={tables} enums={enums} />

              <Tables tables={tables} />
              <Enums enums={enums} />
            </DiagramWrapper>
            <RenameGroupModal />
          </MainProviders>
        </TablesPositionsProvider>
      </TableLevelDetailProvider>
    </RenameGroupProvider>
  );
};

export default DiagramViewer;
