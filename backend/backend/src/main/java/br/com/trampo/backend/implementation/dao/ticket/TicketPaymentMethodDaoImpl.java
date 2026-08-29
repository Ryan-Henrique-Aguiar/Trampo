package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.enums.PaymentMethod;
import br.com.trampo.backend.domain.ticket.TicketPaymentMethod;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.ticket.TicketPaymentMethodDao;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TicketPaymentMethodDaoImpl implements TicketPaymentMethodDao {

    private final DataSource dataSource;

    public TicketPaymentMethodDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public TicketPaymentMethod save(TicketPaymentMethod ticketPaymentMethod) {

        try {
            String sql = "INSERT INTO ticket_payment_method (ticket_id, payment_method) VALUES (?, ?) RETURNING id";

            try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setInt(1, ticketPaymentMethod.getTicket().getId());
                stmt.setString(2, ticketPaymentMethod.getPaymentMethod().name());

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        ticketPaymentMethod.setId(rs.getInt("id"));
                    }
                }
            }
            return ticketPaymentMethod;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar método de pagamento do ticket.", e);
        }
    }

    @Override
    public List<PaymentMethod> findByTicketId(Integer ticketId) {

        List<PaymentMethod> paymentMethods = new ArrayList<>();
        String sql = "SELECT payment_method FROM ticket_payment_method WHERE ticket_id = ?";

        try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, ticketId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    paymentMethods.add(PaymentMethod.valueOf(rs.getString("payment_method")));
                }
            }
            return paymentMethods;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar métodos de pagamento por ID do ticket.", e);
        }
    }
}