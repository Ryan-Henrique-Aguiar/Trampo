package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.UrgentTicket;
import br.com.trampo.backend.port.dao.ticket.UrgentTicketDao;

import java.sql.SQLException;

public class UrgentTicketPostgresDaoImpl implements UrgentTicketDao {
    @Override
    public UrgentTicket save(UrgentTicket urgentTicket) throws SQLException {
        return null;
    }
}
