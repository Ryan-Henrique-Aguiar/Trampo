package br.com.trampo.backend.dto.ticket;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public record TicketAvailableDayDto(@JsonValue String availableDay) {
    @JsonCreator
    public static TicketAvailableDayDto fromString(String value) {
        return new TicketAvailableDayDto(value);
    }
}
