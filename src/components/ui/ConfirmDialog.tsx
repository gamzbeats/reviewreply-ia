"use client";

import Modal from "./Modal";
import Button from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-muted text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          className={
            variant === "danger"
              ? "bg-[var(--sentiment-negative)] hover:bg-red-600 text-white"
              : ""
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
