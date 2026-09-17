package br.com.trampo.backend.dto.review;

import java.time.LocalDateTime;

public record ReviewDto(
        Integer id,
        Integer score,
        String comment,
        Integer ticketId,
        Integer reviewedUserId,
        LocalDateTime createdAt
) {
}
