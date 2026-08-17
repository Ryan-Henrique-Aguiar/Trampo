package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.domain.ticket.Ticket;

import java.sql.SQLException;

public interface AvailableDayDao {
    AvailableDay save(AvailableDay availableDay) throws SQLException;
}
