package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.AvailableHour;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.port.dao.ticket.AvailableHourDao;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AvailableHourDaoImpl implements AvailableHourDao {

    private final Connection connection;

    public AvailableHourDaoImpl(Connection connection) {
        this.connection = connection;
    }

    @Override
    public AvailableHour save(AvailableHour availableHour) throws SQLException {

        boolean originalAutoCommit = connection.getAutoCommit();

        try {
            connection.setAutoCommit(false); // Início da transação


            String sql = "INSERT INTO  ticket_available_hour (ticket_id, available_hour) VALUES (?, ?) RETURNING id ";

            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setInt(1, availableHour.getTicket().getId());
                // 1. Tratamento para converter a String no formato HH:mm ou HH:mm:ss para java.sql.Time
                String hourStr = availableHour.getAvailableHour();

                // Se a String vier só como "14:30", adiciona os segundos ":00" para o formato JDBC "HH:mm:ss"
                if (hourStr != null && hourStr.length() == 5) {
                    hourStr += ":00";
                }

                Time timeValue = Time.valueOf(hourStr);
                stmt.setTime(2, timeValue);

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        availableHour.setId(rs.getInt("id"));
                    }
                }
            }

            connection.commit(); // Efetiva no banco
            return availableHour;

        } catch (SQLException e) {
            connection.rollback(); // Cancela tudo se falhar
            throw e;
        } finally {
            connection.setAutoCommit(originalAutoCommit);
        }

    }

    @Override
    public List<String> findByTicketId(Integer ticketId) throws SQLException {
        List<String> hours = new ArrayList<>();
        // O TO_CHAR formata a coluna TIME do Postgres para o formato "HH:mm" (ex: "08:00")
        String sql = "SELECT TO_CHAR(available_hour, 'HH24:MI') AS formatted_hour FROM ticket_available_hour WHERE ticket_id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, ticketId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    hours.add(rs.getString("formatted_hour"));
                }
            }
        }
        return hours;
    }

}
