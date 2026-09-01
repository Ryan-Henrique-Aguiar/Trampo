package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.domain.ticket.Ticket;

import java.sql.SQLException;
import java.util.List;

public interface AvailableDayDao {
    AvailableDay save(AvailableDay availableDay) throws SQLException;

    void deleteByTicketId(Integer id) throws SQLException;

    List<String> findByTicketId(Integer id) throws SQLException;
}
