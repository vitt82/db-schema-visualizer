import { LayoutPanelLeftIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { useTablePositionContext } from "@/hooks/table";

const AutoArrangeTableButton = () => {
  const { resetPositions } = useTablePositionContext();

  return (
    <ToolbarButton onClick={resetPositions} title="Auto-arrange">
      <LayoutPanelLeftIcon />
    </ToolbarButton>
  );
};

export default AutoArrangeTableButton;
