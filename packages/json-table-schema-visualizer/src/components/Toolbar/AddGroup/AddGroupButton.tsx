import { Square } from "lucide-react";

import ToolbarButton from "../Button";

import { tableGroupsStore } from "@/stores/tableGroups";

const AddGroupButton = () => {
  const handleAddGroup = () => {
    const groupId = `group_${Date.now()}`;
    const newGroup = {
      id: groupId,
      name: `Grupo ${tableGroupsStore.getAllGroups().size + 1}`,
      tableNames: [],
      x: 100,
      y: 100,
      width: 500,
      height: 400,
    };

    console.log("[AddGroupButton] Creating new group:", newGroup);
    tableGroupsStore.createGroup(newGroup);
  };

  return (
    <ToolbarButton onClick={handleAddGroup} title="Agregar grupo">
      <Square />
    </ToolbarButton>
  );
};

export default AddGroupButton;
