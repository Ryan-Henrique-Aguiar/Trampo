package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.AvailableHour;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.ticket.AvailableHourDao;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AvailableHourDaoImpl implements AvailableHourDao {

    private final DataSource dataSource;

    public AvailableHourDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public AvailableHour save(AvailableHour availableHour) {


        try {
            String sql = "INSERT INTO ticket_available_hour (ticket_id, available_hour) VALUES (?, ?) RETURNING id";

            try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setInt(1, availableHour.getTicket().getId());

                String hourStr = availableHour.getAvailableHour();
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

            return availableHour;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao inserir available_hour", e);
        }
    }

    @Override
    public void deleteByTicketId(Integer ticketId) {
        String sql = "DELETE FROM ticket_available_hour WHERE ticket_id = ?";

        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, ticketId);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao remover horários disponíveis do ticket.", e);
        }
    }

    @Override
    public List<String> findByTicketId(Integer ticketId) {
        List<String> hours = new ArrayList<>();

        String sql = "SELECT TO_CHAR(available_hour, 'HH24:MI') AS formatted_hour FROM ticket_available_hour WHERE ticket_id = ?";

        try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, ticketId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    hours.add(rs.getString("formatted_hour"));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar horário disponível por ID do ticket", e);
        }
        return hours;
    }
}
