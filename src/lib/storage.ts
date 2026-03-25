import { Review } from "./types";

const STORAGE_KEY = "reviewreply_reviews";

export function getReviews(): Review[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveReview(review: Review): void {
  const reviews = getReviews();
  reviews.unshift(review);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function updateReview(id: string, updates: Partial<Review>): void {
  const reviews = getReviews();
  const index = reviews.findIndex((r) => r.id === id);
  if (index !== -1) {
    reviews[index] = { ...reviews[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  }
}

export function deleteReview(id: string): void {
  const reviews = getReviews().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}
