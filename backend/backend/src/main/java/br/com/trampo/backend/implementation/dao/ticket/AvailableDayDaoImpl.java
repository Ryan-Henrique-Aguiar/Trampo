package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.port.dao.ticket.AvailableDayDao;

import java.sql.*;

public class AvailableDayDaoImpl implements AvailableDayDao {

    private final Connection connection;

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
}
