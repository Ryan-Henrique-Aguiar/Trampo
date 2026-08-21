package br.com.trampo.backend.port.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.TicketDto;

import java.util.List;

public interface TicketService {
    TicketDto createTicket(CreateTicketDto createTicketDto, Users user);
    List<TicketDto> getMyTickets(Users user);
}
