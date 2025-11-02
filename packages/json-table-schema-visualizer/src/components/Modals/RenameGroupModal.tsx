import { useState, useEffect } from "react";

import { useRenameGroup } from "@/contexts/RenameGroupContext";
import { useThemeColors } from "@/hooks/theme";
import { tableGroupsStore } from "@/stores/tableGroups";

const RenameGroupModal = () => {
  const { isOpen, groupId, groupName, closeRenameModal } = useRenameGroup();
  const themeColors = useThemeColors();
  const [inputValue, setInputValue] = useState(groupName);

  useEffect(() => {
    setInputValue(groupName);
  }, [groupName]);

  const handleSave = () => {
    const newName = inputValue.trim();
    if (newName !== "" && newName !== groupName && groupId !== null) {
      const group = Array.from(tableGroupsStore.getAllGroups().values()).find((g) => g.id === groupId);
      if (group != null) {
        tableGroupsStore.setGroup({
          ...group,
          name: newName,
        });
      }
    }
    closeRenameModal();
  };

  const handleCancel = () => {
    closeRenameModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        style={{
          backgroundColor: themeColors.bg === "white" ? "#FFFFFF" : "#2D3748",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          minWidth: "300px",
        }}
      >
        <h3
          style={{
            margin: "0 0 15px 0",
            color: themeColors.bg === "white" ? "#000000" : "#FFFFFF",
            fontSize: "18px",
          }}
        >
          Renombrar grupo
        </h3>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxSizing: "border-box",
            marginBottom: "15px",
            color: "#000000",
            backgroundColor: "#FFFFFF",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handleCancel}
            style={{
              padding: "8px 16px",
              backgroundColor: "#E0E0E0",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              color: "#000000",
              fontSize: "14px",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2196F3",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              color: "#FFFFFF",
              fontSize: "14px",
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameGroupModal;
