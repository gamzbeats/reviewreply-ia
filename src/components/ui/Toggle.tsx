"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export default function Toggle({ checked, onChange, disabled, label, description }: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div>
        {label && <p className="text-sm font-medium">{label}</p>}
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          checked ? "bg-primary" : "bg-border",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </label>
  );
}
