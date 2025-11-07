import { type RawDatabase } from "@dbml/core/types/model_structure/database";
import { type JSONTableSchema } from "shared/types/tableSchema";

import { createEnumsSet } from "../createEnumsSet";
import { createRelationalTalesMap } from "../createRelationalTalesMap";

import { dbmlEnumToJSONTableEnum } from "./dbmlEnumToJSONTableEnum";
import { dbmlRefToJSONTableRef } from "./dbmlRefToJSONTableRef";
import { dbmlTableToJSONTableTable } from "./dbmlTableToJSONTableTable";
import { dbmlTableGroupToJSONTableGroup } from "./dbmlTableGroupToJSONTableGroup";

export const dbmlSchemaToJSONTableSchema = ({
  refs,
  enums,
  tables,
  tableGroups = [],
}: RawDatabase): JSONTableSchema => {
  const relationalFieldMap = createRelationalTalesMap(refs);
  const enumsMap = createEnumsSet(enums);

  const jsonTableRefs = refs.map(dbmlRefToJSONTableRef);
  const jsonTableEnums = enums.map(dbmlEnumToJSONTableEnum);
  const jsonTableTables = tables.map((table) =>
    dbmlTableToJSONTableTable(table, relationalFieldMap, enumsMap),
  );
  const jsonTableGroups = tableGroups.map((group, index) =>
    dbmlTableGroupToJSONTableGroup(group, index),
  );

  return {
    refs: jsonTableRefs,
    enums: jsonTableEnums,
    tables: jsonTableTables,
    groups: jsonTableGroups,
  };
};
