import React, { createContext, useContext, useState, useCallback } from "react";

interface RenameContextType {
  isOpen: boolean;
  groupId: string | null;
  groupName: string;
  openRenameModal: (groupId: string, groupName: string) => void;
  closeRenameModal: () => void;
}

const RenameGroupContext = createContext<RenameContextType | undefined>(undefined);

export const RenameGroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");

  const openRenameModal = useCallback((id: string, name: string) => {
    setGroupId(id);
    setGroupName(name);
    setIsOpen(true);
  }, []);

  const closeRenameModal = useCallback(() => {
    setIsOpen(false);
    setGroupId(null);
    setGroupName("");
  }, []);

  return (
    <RenameGroupContext.Provider value={{ isOpen, groupId, groupName, openRenameModal, closeRenameModal }}>
      {children}
    </RenameGroupContext.Provider>
  );
};

export const useRenameGroup = () => {
  const context = useContext(RenameGroupContext);
  if (context === undefined) {
    throw new Error("useRenameGroup must be used within RenameGroupProvider");
  }
  return context;
};
