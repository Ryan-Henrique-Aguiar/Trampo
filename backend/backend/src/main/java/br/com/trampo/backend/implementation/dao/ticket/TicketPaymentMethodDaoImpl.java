package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.domain.ticket.TicketPaymentMethod;
import br.com.trampo.backend.port.dao.ticket.TicketPaymentMethodDao;
import org.apache.logging.log4j.internal.annotation.SuppressFBWarnings;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TicketPaymentMethodDaoImpl implements TicketPaymentMethodDao {

    private final Connection connection;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
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
    
    @Override
    public List<PaymentMethod> findByTicketId(Integer ticketId) throws SQLException {
        List<PaymentMethod> paymentMethods = new ArrayList<>();
        String sql = "SELECT payment_method FROM ticket_payment_method WHERE ticket_id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, ticketId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    paymentMethods.add(PaymentMethod.valueOf(rs.getString("payment_method")));
                }
            }
        }
        return paymentMethods;
    }
}
