package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.TicketPaymentMethod;
import br.com.trampo.backend.port.dao.ticket.TicketPaymentMethodDao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class TicketPaymentMethodDaoImpl implements TicketPaymentMethodDao {

    private final Connection connection;

    public TicketPaymentMethodDaoImpl(Connection connection) {
        this.connection = connection;
    }

    @Override
    public TicketPaymentMethod save(TicketPaymentMethod ticketPaymentMethod) throws SQLException {
        boolean originalAutoCommit = connection.getAutoCommit();

        try {
            connection.setAutoCommit(false);

            String sql = "INSERT INTO ticket_payment_method (ticket_id, payment_method) VALUES (?, ?) RETURNING id";

            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setInt(1, ticketPaymentMethod.getTicket().getId());
                stmt.setString(2, ticketPaymentMethod.getPaymentMethod().name());

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        ticketPaymentMethod.setId(rs.getInt("id"));
                    }
                }
            }

            connection.commit();
            return ticketPaymentMethod;
        } catch (SQLException e) {
            connection.rollback();
            throw e;
        } finally {
            connection.setAutoCommit(originalAutoCommit);
        }
    }
}
