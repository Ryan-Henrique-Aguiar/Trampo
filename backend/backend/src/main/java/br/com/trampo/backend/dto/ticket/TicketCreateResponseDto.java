package br.com.trampo.backend.dto.ticket;

import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.dto.address.CreateAddressDto;

import java.util.List;

public record TicketCreateResponseDto(
        String title,
        String description
) {
}
