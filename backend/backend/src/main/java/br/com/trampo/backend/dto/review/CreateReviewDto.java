package br.com.trampo.backend.dto.review;

public record CreateReviewDto(
        Integer score,
        String comment
) {
}
