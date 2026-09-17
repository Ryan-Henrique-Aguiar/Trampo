export interface Review {
  id: number;
  score: number;
  comment: string | null;
  ticketId: number;
  reviewedUserId: number;
  createdAt: string;
}

export interface ReviewStatus {
  canReview: boolean;
  alreadyReviewed: boolean;
}
