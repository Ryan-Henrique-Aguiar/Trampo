package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.AvailableDay;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.ticket.AvailableDayDao;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class AvailableDayDaoImpl implements AvailableDayDao {

    private final DataSource dataSource;

    public AvailableDayDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public AvailableDay save(AvailableDay availableDay) {


        String sql = "INSERT INTO ticket_available_day (ticket_id, available_day) VALUES (?, ?) RETURNING id";

        try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, availableDay.getTicket().getId());
            stmt.setString(2, availableDay.getAvailableDay());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    availableDay.setId(rs.getInt("id"));
                }
            }
            return availableDay;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar dia disponível.", e);
        }
    }

    @Override
    public List<String> findByTicketId(Integer ticketId) {

        List<String> days = new ArrayList<>();
        String sql = "SELECT available_day FROM ticket_available_day WHERE ticket_id = ?";

        try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, ticketId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    days.add(rs.getString("available_day"));
                }
            }
            return days;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar dias disponíveis por ID do ticket.", e);
        }
    }
}