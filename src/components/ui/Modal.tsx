"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Modal({ open, onClose, title, size = "md", children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        className={cn(
          "bg-card rounded-[var(--radius-card)] shadow-xl w-full animate-[modalIn_0.15s_ease-out]",
          {
            "max-w-sm": size === "sm",
            "max-w-md": size === "md",
            "max-w-lg": size === "lg",
          }
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition-colors text-xl leading-none"
            >
              &times;
            </button>
          </div>
        )}
        <div className={cn("px-6 pb-6", !title && "pt-6")}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
