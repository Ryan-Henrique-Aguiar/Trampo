package br.com.trampo.backend.dto.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.dto.address.CreateAddressDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.validation.annotation.Validated;

import java.util.List;

public record CreateTicketDto(
        String title,
        String description,
        double priceMax,
        Integer categoryId,
        List<TicketAvailableHourDto> availableHours,
        List<TicketAvailableDayDto> availableDays,
        List<PaymentMethod> paymentMethods,
        
        @Validated
        @JsonProperty("address")
        CreateAddressDto addressDto) {
}
