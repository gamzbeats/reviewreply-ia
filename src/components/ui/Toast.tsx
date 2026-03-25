"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-[var(--sentiment-positive-bg)] text-[var(--sentiment-positive)] border-[var(--sentiment-positive)]",
  error: "bg-[var(--sentiment-negative-bg)] text-[var(--sentiment-negative)] border-[var(--sentiment-negative)]",
  info: "bg-card text-foreground border-border",
  warning: "bg-[var(--sentiment-neutral-bg)] text-[var(--sentiment-neutral)] border-[var(--sentiment-neutral)]",
};

const icons: Record<ToastType, string> = {
  success: "\u2713",
  error: "\u2717",
  info: "\u2139",
  warning: "\u26A0",
};

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-button)] border shadow-lg",
        "animate-[slideIn_0.2s_ease-out]",
        typeStyles[type]
      )}
    >
      <span className="text-lg font-bold leading-none">{icons[type]}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-current opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
      >
        &times;
      </button>
    </div>
  );
}
