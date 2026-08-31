package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.domain.ticket.TicketPaymentMethod;

import java.sql.SQLException;
import java.util.List;

public interface TicketPaymentMethodDao {
    TicketPaymentMethod save(TicketPaymentMethod ticketPaymentMethod) throws SQLException;

    void deleteByTicketId(Integer id) throws SQLException;

    List<PaymentMethod> findByTicketId(Integer id) throws SQLException;
}
