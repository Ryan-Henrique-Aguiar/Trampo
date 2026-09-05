package br.com.trampo.backend.dto.notification;

import java.time.LocalDateTime;

public record ResponseNotificationDto(
        String message,
        LocalDateTime createdAt,
        int ticketId
) {
}
