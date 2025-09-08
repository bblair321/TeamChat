import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      position: options.position || "top-right",
      ...options,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback(
    (message, options = {}) => {
      return addToast(message, "success", options);
    },
    [addToast]
  );

  const showError = useCallback(
    (message, options = {}) => {
      return addToast(message, "error", { duration: 7000, ...options });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      return addToast(message, "warning", options);
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message, options = {}) => {
      return addToast(message, "info", options);
    },
    [addToast]
  );

  const showNetworkError = useCallback(
    (message, options = {}) => {
      return addToast(message, "network", { duration: 0, ...options }); // Network errors don't auto-dismiss
    },
    [addToast]
  );

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNetworkError,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position || "top-right";
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div key={position} className="fixed z-50 pointer-events-none">
          {positionToasts.map((toast, index) => (
            <div
              key={toast.id}
              className="pointer-events-auto"
              style={{
                marginBottom: index > 0 ? "0.5rem" : "0",
                zIndex: 50 + index,
              }}
            >
              <Toast
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                position={toast.position}
                onClose={() => onRemove(toast.id)}
              />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
