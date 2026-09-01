package br.com.trampo.backend.dto.ticket;

import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.dto.address.AddressDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;

public record UrgentTicketDto(
        Integer id,
        String code,
        String title,
        String description,
        LocalDateTime createdAt,
        LocalDateTime serviceDate,
        StatusTicket status,
        Integer providerId,
        Integer categoryId,
        @Validated
        @JsonProperty("address")
        AddressDto addressDto
) {
}
