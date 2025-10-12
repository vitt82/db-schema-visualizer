import type { JSONTableEnum, JSONTableTable } from "shared/types/tableSchema";

import EnumConnection from "@/components/RelationConnection/EnumConnection";

interface EnumConnectionsProps {
  tables: JSONTableTable[];
  enums: JSONTableEnum[];
}

const EnumConnections = ({ tables, enums }: EnumConnectionsProps) => {
  const connections: Array<{
    tableName: string;
    fieldName: string;
    enumName: string;
  }> = [];

  tables.forEach((t) => {
    t.fields.forEach((f) => {
      if (f.type?.is_enum) {
        connections.push({
          tableName: t.name,
          fieldName: f.name,
          enumName: f.type.type_name,
        });
      }
    });
  });

  return (
    <>
      {connections.map((c) => {
        const key = `${c.tableName}-${c.fieldName}-enum-${c.enumName}`;
        return (
          <EnumConnection
            key={key}
            sourceTableName={c.tableName}
            sourceFieldName={c.fieldName}
            enumName={c.enumName}
          />
        );
      })}
    </>
  );
};

export default EnumConnections;
