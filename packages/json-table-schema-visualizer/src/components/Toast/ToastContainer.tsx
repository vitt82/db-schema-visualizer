import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";

import { useToast } from "../../contexts/ToastContext";

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 text-green-900 border-green-200";
      case "error":
        return "bg-red-50 text-red-900 border-red-200";
      case "warning":
        return "bg-yellow-50 text-yellow-900 border-yellow-200";
      case "info":
      default:
        return "bg-blue-50 text-blue-900 border-blue-200";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast: any) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-right-4 ${getStyles(
            toast.type as string,
          )}`}
        >
          <div className="flex-shrink-0">{getIcon(toast.type as string)}</div>
          <div className="flex-grow text-sm font-medium">{toast.message}</div>
          <button
            onClick={() => {
              removeToast(toast.id as string);
            }}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
