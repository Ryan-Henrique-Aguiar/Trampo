package br.com.trampo.backend.dto.ticket;

import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.dto.address.AddressDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record TicketDto(
        Integer id,
        String code,
        String title,
        String description,
        LocalDateTime createdAt,
        BigDecimal priceMax,
        LocalDateTime serviceDate,
        StatusTicket status,
        Integer userId,
        Integer categoryId,
        Integer proposalsCount,
        AddressDto address,
        List<PaymentMethod> paymentMethods,
        List<String> availableDays,
        List<String> availableHours
) {
}