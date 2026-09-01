package br.com.trampo.backend.dto.ticket;

import br.com.trampo.backend.dto.address.CreateAddressDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.NonNull;
import org.springframework.validation.annotation.Validated;

public record CreateUrgentTicketDto(

        @NonNull
        String title,
        @NonNull
        String description,
        @NonNull
        Integer categoryId,
        @NonNull
        Integer providerId,
        @Validated
        @JsonProperty("address")
        CreateAddressDto addressDto) {
}
