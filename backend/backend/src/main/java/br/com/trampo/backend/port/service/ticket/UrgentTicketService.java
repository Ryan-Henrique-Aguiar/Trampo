package br.com.trampo.backend.port.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.ticket.CreateUrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UrgentTicketDto;

import java.sql.SQLException;
import java.util.List;

public interface UrgentTicketService {
    List<UrgentTicketDto> getMyUrgentTickets(Users user);
    UrgentTicketDto createUrgentTicket(CreateUrgentTicketDto createUrgentTicketDto, Users user) throws SQLException;
}
