import { useState, useEffect } from "react";
import { Zap, Waves } from "lucide-react";

import ToolbarButton from "../Button";

import { connectionTypeStore, type ConnectionType } from "@/stores/connectionTypeStore";

const ConnectionTypeToggle = () => {
  const [connectionType, setConnectionType] = useState<ConnectionType>('smoothstep');

  useEffect(() => {
    setConnectionType(connectionTypeStore.getConnectionType());
    const unsubscribe = connectionTypeStore.subscribe((type) => {
      setConnectionType(type);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    const newType: ConnectionType = connectionType === 'smoothstep' ? 'bezier' : 'smoothstep';
    connectionTypeStore.setConnectionType(newType);
  };

  return (
    <ToolbarButton
      onClick={handleToggle}
      title={`Connection Type: ${connectionType === 'smoothstep' ? 'Smoothstep (Angular)' : 'Bezier (Curves)'}`}
    >
      {connectionType === 'smoothstep' ? <Waves size={20} /> : <Zap size={20} />}
    </ToolbarButton>
  );
};

export default ConnectionTypeToggle;
