package br.com.trampo.backend.port.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.UrgentTicket;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.CreateUrgentTicketDto;
import br.com.trampo.backend.dto.ticket.TicketDto;
import br.com.trampo.backend.dto.ticket.UrgentTicketDto;

import java.sql.SQLException;

public interface UrgentTicketService {
    UrgentTicketDto createUrgentTicket(CreateUrgentTicketDto createUrgentTicketDto, Users user) throws SQLException;
}
