package br.com.trampo.backend.port.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.ticket.CreateUrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UpdateTicketStatusDto;
import br.com.trampo.backend.dto.common.PageDto;
import br.com.trampo.backend.domain.enums.StatusTicket;

import java.sql.SQLException;
import java.util.List;

public interface UrgentTicketService {
    PageDto<UrgentTicketDto> getMyUrgentTickets(Users user, List<StatusTicket> statuses, int page, int size);
    PageDto<UrgentTicketDto> getMyProvidedUrgentTickets(Users user, List<StatusTicket> statuses, int page, int size);
    UrgentTicketDto createUrgentTicket(CreateUrgentTicketDto createUrgentTicketDto, Users user) throws SQLException;
    UrgentTicketDto updateStatus(int ticketId, UpdateTicketStatusDto data, Users user);
}
