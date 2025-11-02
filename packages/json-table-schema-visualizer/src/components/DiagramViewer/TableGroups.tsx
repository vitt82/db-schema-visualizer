import { useEffect, useState } from "react";

import type { JSONTableGroup } from "shared/types/tableGroup";

import { tableGroupsStore } from "@/stores/tableGroups";

import TableGroup from "../TableGroup/TableGroup";

interface TableGroupsProps {
  groups: JSONTableGroup[];
}

const TableGroups = ({ groups }: TableGroupsProps) => {
  const [groupsMap, setGroupsMap] = useState<Map<string, JSONTableGroup & { x: number; y: number; width: number; height: number }>>(new Map());

  useEffect(() => {
    tableGroupsStore.initGroups(groups);
    setGroupsMap(new Map(tableGroupsStore.getAllGroups()));

    // Suscribirse a cambios en el store
    const handleGroupsChanged = () => {
      setGroupsMap(new Map(tableGroupsStore.getAllGroups()));
    };

    const unsubscribe = tableGroupsStore.subscribe(handleGroupsChanged);

    return unsubscribe;
  }, [groups]);

  return (
    <>
      {Array.from(groupsMap.values()).map((group) => (
        <TableGroup key={group.id} group={group} />
      ))}
    </>
  );
};

export default TableGroups;
