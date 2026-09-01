package br.com.trampo.backend.dto.ticket;

import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.dto.address.CreateAddressDto;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

public record UpdateTicketDto(
        String title,
        String description,
        BigDecimal priceMax,
        List<TicketAvailableHourDto> availableHours,
        List<TicketAvailableDayDto> availableDays,
        List<PaymentMethod> paymentMethods,
        @JsonProperty("address")
        CreateAddressDto addressDto
) {
}
