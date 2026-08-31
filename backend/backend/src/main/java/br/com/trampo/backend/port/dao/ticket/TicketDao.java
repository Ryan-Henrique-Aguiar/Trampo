package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.ticket.Ticket;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public interface TicketDao {
    Ticket save(Ticket ticket) throws SQLException;

    Optional<Ticket> findById(int id) throws SQLException;

    List<Ticket> findAll() throws SQLException;

    List<Ticket> findByUserId(int userId) throws SQLException;
    List<Ticket> findAvailableForProvider(int providerId, String city, String state, Integer categoryId, BigDecimal minPrice, BigDecimal maxPrice) throws SQLException;

    void incrementProposalsCount(int ticketId);

    void updateStatus(int ticketId, StatusTicket status);

}
