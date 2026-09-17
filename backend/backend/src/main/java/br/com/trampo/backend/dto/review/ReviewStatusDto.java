package br.com.trampo.backend.dto.review;

public record ReviewStatusDto(
        boolean canReview,
        boolean alreadyReviewed
) {
}
