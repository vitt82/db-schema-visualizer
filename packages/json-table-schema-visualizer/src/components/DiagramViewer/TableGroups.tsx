import { useEffect, useState } from "react";

import TableGroup from "../TableGroup/TableGroup";

import type { JSONTableGroup } from "shared/types/tableGroup";

import { useRenameGroup } from "@/contexts/RenameGroupContext";
import { tableGroupsStore } from "@/stores/tableGroups";

interface TableGroupsProps {
  groups: JSONTableGroup[];
}

// Nota importante sobre persistencia:
// - La carga inicial desde .DBML se realiza en useSchema() vía tableGroupsStore.switchTo(key, initial)
// - Aquí NO debemos volver a inicializar el store con el prop `groups`,
//   pues sobreescribiría lo recuperado del almacenamiento persistente.
// - En su lugar, simplemente reflejamos el contenido actual del store y nos suscribimos a cambios.
const TableGroups = ({ groups }: TableGroupsProps) => {
  const { openRenameModal } = useRenameGroup();
  const [groupsMap, setGroupsMap] = useState<Map<string, JSONTableGroup & { x: number; y: number; width: number; height: number }>>(new Map());

  useEffect(() => {
    // Si el store está vacío y el esquema trae grupos, inicializamos una sola vez
    if (tableGroupsStore.getAllGroups().size === 0 && Array.isArray(groups) && groups.length > 0) {
      tableGroupsStore.initGroups(groups);
    }

    // Establecer estado inicial desde el store (ya sea cargado desde .DBML o recién inicializado)
    setGroupsMap(new Map(tableGroupsStore.getAllGroups()));

    // Suscripción a cambios del store
    const handleGroupsChanged = () => {
      setGroupsMap(new Map(tableGroupsStore.getAllGroups()));
    };

    const unsubscribe = tableGroupsStore.subscribe(handleGroupsChanged);
    return unsubscribe;
  }, [groups]);

  return (
    <>
      {Array.from(groupsMap.values()).map((group) => (
        <TableGroup 
          key={group.id} 
          group={group}
          onRequestRename={(groupId, groupName) => {
            openRenameModal(groupId, groupName);
          }}
        />
      ))}
    </>
  );
};

export default TableGroups;
