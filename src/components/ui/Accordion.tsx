"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-5 text-left"
          >
            <span className="font-medium text-[var(--text-body-lg)] pr-4">
              {item.question}
            </span>
            <svg
              className={cn(
                "w-5 h-5 shrink-0 text-muted transition-transform duration-200",
                openIndex === i && "rotate-180"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              openIndex === i ? "max-h-96 pb-5" : "max-h-0"
            )}
          >
            <p className="text-foreground/70 leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
