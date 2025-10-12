import {
  type JSONTableEnum,
  type JSONTableRef,
  type JSONTableTable,
} from "shared/types/tableSchema";

import EmptyTableMessage from "../Messages/EmptyTableMessage";

import Tables from "./Tables";
import Enums from "./Enums";
import EnumConnections from "./EnumConnections";
import RelationsConnections from "./Connections";
import DiagramWrapper from "./DiagramWrapper";

import TablesPositionsProvider from "@/providers/TablesPositionsProvider";
import MainProviders from "@/providers/MainProviders";
import TableLevelDetailProvider from "@/providers/TableDetailLevelProvider";

interface DiagramViewerProps {
  tables: JSONTableTable[];
  refs: JSONTableRef[];
  enums: JSONTableEnum[];
}

const DiagramViewer = ({ refs, tables, enums }: DiagramViewerProps) => {
  if (tables.length === 0) {
    return <EmptyTableMessage />;
  }

  return (
    <TableLevelDetailProvider>
      <TablesPositionsProvider tables={tables} refs={refs} enums={enums}>
        <MainProviders tables={tables} enums={enums}>
          <DiagramWrapper>
            <RelationsConnections refs={refs} />
            <EnumConnections tables={tables} enums={enums} />

            <Tables tables={tables} />
            <Enums enums={enums} />
          </DiagramWrapper>
        </MainProviders>
      </TablesPositionsProvider>
    </TableLevelDetailProvider>
  );
};

export default DiagramViewer;
