package br.com.trampo.backend.mapper.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.dto.address.AddressDto;
import br.com.trampo.backend.dto.ticket.TicketDto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TicketMapper {

    public TicketDto toDto(Ticket ticket) {
        return toDto(ticket, List.of(), List.of(), List.of());
    }

    public TicketDto toDto(
            Ticket ticket,
            List<PaymentMethod> paymentMethods,
            List<String> availableDays,
            List<String> availableHours
    ) {
        return new TicketDto(
                ticket.getId(),
                ticket.getCode(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getCreatedAt(),
                ticket.getPriceMax(),
                ticket.getServiceDate(),
                ticket.getStatus(),
                ticket.getUser().getId(),
                ticket.getCategory().getId(),
                ticket.getProposalsCount(),
                toAddressDto(ticket.getAddress()),
                paymentMethods,
                availableDays,
                availableHours
        );
    }

    private AddressDto toAddressDto(Address address) {
        return new AddressDto(
                address.getId(),
                address.getStreet(),
                address.getNumber(),
                address.getNeighborhood(),
                address.getCity(),
                address.getState(),
                address.getZipCode(),
                address.getComplement()
        );
    }
}
