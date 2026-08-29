package br.com.trampo.backend.dto.ticket;

import br.com.trampo.backend.dto.address.CreateAddressDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.validation.annotation.Validated;

public record CreateUrgentTicketDto(
        String title,
        String description,
        Integer categoryId,
        @Validated
        @JsonProperty("address")
        CreateAddressDto addressDto) {
}
