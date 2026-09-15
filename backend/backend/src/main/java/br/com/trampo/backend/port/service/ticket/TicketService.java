package br.com.trampo.backend.port.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.common.PageDto;
import br.com.trampo.backend.dto.ticket.TicketDto;
import br.com.trampo.backend.dto.ticket.UpdateTicketDto;
import br.com.trampo.backend.dto.ticket.UpdateTicketStatusDto;

import java.math.BigDecimal;
import java.util.List;

public interface TicketService {
    TicketDto createTicket(CreateTicketDto createTicketDto, Users user);

    PageDto<TicketDto> getMyTickets(
            Users user,
            List<StatusTicket> statuses,
            int page,
            int size
    );

    PageDto<TicketDto> getAvailableTickets(
            Users user,
            Integer categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            int page,
            int size
    );

    TicketDto updateTicket(int ticketId, UpdateTicketDto updateTicketDto, Users user);

    TicketDto updateStatus(int ticketId, UpdateTicketStatusDto updateTicketStatusDto, Users user);

    Ticket findTicketById(int ticketId);
}
