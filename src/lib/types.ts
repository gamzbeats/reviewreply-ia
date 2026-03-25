export type Sentiment = "positive" | "neutral" | "negative";
export type ReviewSource = "google" | "tripadvisor" | "yelp" | "other";
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  author: string;
  source: ReviewSource;
  rating: Rating;
  content: string;
  sentiment: Sentiment;
  sentimentScore: number;
  createdAt: string;
  response?: GeneratedResponse;
}

export interface GeneratedResponse {
  id: string;
  reviewId: string;
  content: string;
  generatedAt: string;
  copied: boolean;
}

export interface AnalyzeRequest {
  content: string;
  rating: number;
  author: string;
  locale: string;
}

export interface AnalyzeResponse {
  sentiment: Sentiment;
  sentimentScore: number;
  response: string;
}

export interface TrendIssue {
  theme: string;
  count: number;
  severity: "high" | "medium" | "low";
  examples: string[];
}

export interface TrendSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  relatedThemes: string[];
}

export interface TrendsAnalysisResponse {
  issues: TrendIssue[];
  suggestions: TrendSuggestion[];
  summary: string;
  totalReviews: number;
  negativeCount: number;
}
