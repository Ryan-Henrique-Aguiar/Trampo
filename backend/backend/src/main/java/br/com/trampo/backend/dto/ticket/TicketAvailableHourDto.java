package br.com.trampo.backend.dto.ticket;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public record TicketAvailableHourDto(@JsonValue String availableHour) {
    @JsonCreator
    public static TicketAvailableHourDto fromString(String value) {
        return new TicketAvailableHourDto(value);
    }
}
