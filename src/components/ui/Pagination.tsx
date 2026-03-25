"use client";

import Button from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        &larr;
      </Button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-muted text-sm">...</span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "primary" : "ghost"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        &rarr;
      </Button>
    </div>
  );
}
