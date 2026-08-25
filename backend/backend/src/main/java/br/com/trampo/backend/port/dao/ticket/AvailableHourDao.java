package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.AvailableHour;
import br.com.trampo.backend.domain.ticket.Ticket;

import java.sql.SQLException;
import java.util.List;

public interface AvailableHourDao {
    AvailableHour save(AvailableHour availableHour) throws SQLException;

    List<String> findByTicketId(Integer id) throws SQLException;
}
