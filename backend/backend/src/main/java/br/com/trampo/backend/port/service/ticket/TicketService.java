package br.com.trampo.backend.port.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.TicketCreateResponseDto;

public interface TicketService {
    TicketCreateResponseDto createTicket(CreateTicketDto createTicketDto, Users user);
}
