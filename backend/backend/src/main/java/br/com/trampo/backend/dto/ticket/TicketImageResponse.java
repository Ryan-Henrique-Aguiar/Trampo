package br.com.trampo.backend.dto.ticket;

import java.time.LocalDateTime;

public record TicketImageResponse(
        Integer id,
        String fileName,
        String contentType,
        String url,
        LocalDateTime createdAt
) {
}
