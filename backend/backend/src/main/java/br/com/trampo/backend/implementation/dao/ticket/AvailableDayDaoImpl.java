package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.port.dao.ticket.AvailableDayDao;
import org.apache.logging.log4j.internal.annotation.SuppressFBWarnings;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AvailableDayDaoImpl implements AvailableDayDao {

    private final Connection connection;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
    public AvailableDayDaoImpl(Connection connection) {
        this.connection = connection;
    }


    @Override
    public AvailableDay save(AvailableDay availableDay) throws SQLException {

        boolean originalAutoCommit = connection.getAutoCommit();

        try {
            connection.setAutoCommit(false); // Início da transação


            String sql = "INSERT INTO  ticket_available_day (ticket_id, available_day) VALUES (?, ?) RETURNING id ";

            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setInt(1, availableDay.getTicket().getId());
                stmt.setString(2, availableDay.getAvailableDay());

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        availableDay.setId(rs.getInt("id"));
                    }
                }
            }

            connection.commit(); // Efetiva no banco
            return availableDay;

        } catch (SQLException e) {
            connection.rollback(); // Cancela tudo se falhar
            throw e;
        } finally {
            connection.setAutoCommit(originalAutoCommit);
        }

    }

    @Override
    public List<String> findByTicketId(Integer ticketId) throws SQLException {
        List<String> days = new ArrayList<>();
        String sql = "SELECT available_day FROM ticket_available_day WHERE ticket_id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, ticketId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    days.add(rs.getString("available_day"));
                }
            }
        }
        return days;
    }
}
