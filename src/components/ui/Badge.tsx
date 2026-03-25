import { cn } from "@/lib/utils";
import { Sentiment } from "@/lib/types";

interface BadgeProps {
  sentiment: Sentiment;
  label: string;
  className?: string;
}

export default function Badge({ sentiment, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
        {
          "bg-sentiment-positive-bg text-sentiment-positive": sentiment === "positive",
          "bg-sentiment-neutral-bg text-sentiment-neutral": sentiment === "neutral",
          "bg-sentiment-negative-bg text-sentiment-negative": sentiment === "negative",
        },
        className
      )}
    >
      <span
        className={cn("w-2 h-2 rounded-full", {
          "bg-sentiment-positive": sentiment === "positive",
          "bg-sentiment-neutral": sentiment === "neutral",
          "bg-sentiment-negative": sentiment === "negative",
        })}
      />
      {label}
    </span>
  );
}
