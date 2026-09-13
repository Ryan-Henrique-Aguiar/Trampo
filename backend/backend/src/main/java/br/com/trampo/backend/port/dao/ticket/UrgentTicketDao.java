package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.ticket.UrgentTicket;

import java.sql.SQLException;
import java.util.List;

public interface UrgentTicketDao {

    UrgentTicket save(UrgentTicket urgentTicket) throws SQLException;
    List<UrgentTicket> findByUserId(int userId) throws SQLException;
}
