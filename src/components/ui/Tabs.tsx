"use client";

import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-background rounded-[var(--radius-button)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-[var(--radius-button)] transition-colors",
            activeTab === tab.value
              ? "bg-card font-medium text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
