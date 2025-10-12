import { ExpandIcon } from "lucide-react";

import ToolbarButton from "../Button";

interface FitToViewButtonProps {
  onClick: () => void;
}

const FitToViewButton = ({ onClick }: FitToViewButtonProps) => {
  return (
    <ToolbarButton onClick={onClick} title="Fit-to-view">
      <ExpandIcon />
    </ToolbarButton>
  );
};

export default FitToViewButton;
