package br.com.trampo.backend.dto.ticket;

import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.dto.address.AddressDto;
import br.com.trampo.backend.dto.address.CreateAddressDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record UrgentTicketDto(
        String code,
        String title,
        String description,
        Integer categoryId,
        LocalDateTime createdAt,
        LocalDateTime serviceDate,
        @Validated
        @JsonProperty("address")
        AddressDto addressDto
) {
}
