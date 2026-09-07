package br.com.trampo.backend.dto.notification;

public record CreateNotificationDto(
        String message,
        Integer ticketId
) {
}
