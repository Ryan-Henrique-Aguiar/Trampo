package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.AvailableHour;
import br.com.trampo.backend.domain.ticket.Ticket;

import java.sql.SQLException;

public interface AvailableHourDao {
    AvailableHour save(AvailableHour availableHour) throws SQLException;
}
