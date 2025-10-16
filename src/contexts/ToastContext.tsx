"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Toast } from "../components/Toast";

interface ToastContextType {
  showToast: (message: string, type: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error") => {
    setMessage(message);
    setType(type);
    setIsVisible(true);
  };

  const hideToast = () => {
    setIsVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={message} type={type} isVisible={isVisible} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
