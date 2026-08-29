package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.ticket.UrgentTicket;

import java.sql.SQLException;

public interface UrgentTicketDao {

    UrgentTicket save(UrgentTicket urgentTicket) throws SQLException;
}
