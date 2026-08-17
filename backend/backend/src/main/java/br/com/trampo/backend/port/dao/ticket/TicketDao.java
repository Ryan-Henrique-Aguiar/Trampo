package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.Ticket;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public interface TicketDao {
    Ticket save(Ticket ticket) throws SQLException;

    Optional<Ticket> findById(int id) throws SQLException;

    List<Ticket> findAll() throws SQLException;
}
