package br.com.trampo.backend.port.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.UrgentTicket;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.TicketDto;

import java.sql.SQLException;

public interface UrgentTicketService {
    TicketDto createUrgentTicket(CreateTicketDto createTicketDto, Users user) throws SQLException;
}
