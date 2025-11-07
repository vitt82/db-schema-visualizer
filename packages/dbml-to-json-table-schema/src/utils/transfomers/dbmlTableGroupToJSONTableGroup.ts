import type { JSONTableGroup } from "shared/types/tableGroup";

interface DBMLTableGroup {
  name: string;
  tables: Array<{
    name: string;
    schema?: { name?: string };
  }>;
  color?: string;
  note?: string;
}

export const dbmlTableGroupToJSONTableGroup = (
  dbmlGroup: DBMLTableGroup,
  index: number
): JSONTableGroup => {
  const tableNames = dbmlGroup.tables.map((table) => {
    // Si la tabla tiene un schema, usa "schemaName.tableName", sino solo "tableName"
    if (table.schema?.name) {
      return `${table.schema.name}.${table.name}`;
    }
    return table.name;
  });

  return {
    id: `group_${index}_${dbmlGroup.name.replace(/\s+/g, "_")}`,
    name: dbmlGroup.name,
    color: dbmlGroup.color,
    tableNames,
    enumNames: [], // DBML no parece soportar enums en grupos por ahora
  };
};
