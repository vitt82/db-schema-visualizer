import PropTypes from "prop-types";

import ThemeToggler from "./ThemeToggler/ThemeToggler";
import DetailLevelToggle from "./DetailLevelToggle/DetailLevelToggle";
import FitToViewButton from "./FitToView/FitToView";
import RefreshButton from "./Refresh/RefreshButton";

const Toolbar = ({ onFitToView }: { onFitToView: () => void }) => {
  return (
    <div className="flex absolute [&_svg]:w-5 [&_svg]:h-5 px-6 py-1 bottom-14 text-sm bg-gray-100 dark:bg-gray-700 shadow-lg rounded-2xl">
      <DetailLevelToggle />
      <FitToViewButton onClick={onFitToView} />
      <RefreshButton />
      <hr className="w-px h-6 mx-4 my-1 bg-gray-300" />
      <ThemeToggler />
    </div>
  );
};

Toolbar.propTypes = {
  onFitToView: PropTypes.func.isRequired,
};

export default Toolbar;
