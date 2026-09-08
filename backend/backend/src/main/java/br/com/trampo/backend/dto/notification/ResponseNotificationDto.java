package br.com.trampo.backend.dto.notification;

import java.time.LocalDateTime;

public record ResponseNotificationDto(
        Integer id,
        String message,
        LocalDateTime createdAt,
        int ticketId
) {
}
