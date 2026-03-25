"use client";

import { Review } from "@/lib/types";
import ReviewCard from "./ReviewCard";

interface ReviewListProps {
  reviews: Review[];
  onUpdate: (review: Review) => void;
  onDelete: (id: string) => void;
}

export default function ReviewList({ reviews, onUpdate, onDelete }: ReviewListProps) {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
