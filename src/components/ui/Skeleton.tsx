"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-button)] bg-border/50",
        className
      )}
    />
  );
}

/** Card-shaped skeleton */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-[var(--radius-card)] p-5 space-y-3",
        className
      )}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Stat card skeleton */
export function SkeletonStat() {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-card)] p-4 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-12" />
    </div>
  );
}

/** Chart area skeleton */
export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-[var(--radius-card)] p-5 space-y-4",
        className
      )}
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-[250px] w-full rounded-[var(--radius-card)]" />
    </div>
  );
}

/** Review card skeleton */
export function SkeletonReview() {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-card)] p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}
