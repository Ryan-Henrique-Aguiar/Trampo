package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.ticket.TicketPaymentMethod;

import java.sql.SQLException;

public interface TicketPaymentMethodDao {
    TicketPaymentMethod save(TicketPaymentMethod ticketPaymentMethod) throws SQLException;
}
