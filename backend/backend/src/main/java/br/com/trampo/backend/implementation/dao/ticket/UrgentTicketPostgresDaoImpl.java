package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.UrgentTicket;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.ticket.UrgentTicketDao;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.sql.*;

public class UrgentTicketPostgresDaoImpl implements UrgentTicketDao {

    private final DataSource dataSource;

    public UrgentTicketPostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }


    @Override
    public UrgentTicket save(UrgentTicket urgentTicket) {
        Connection connection = DataSourceUtils.getConnection(dataSource);

        String sql = "INSERT INTO urgent_ticket (code, title, description, user_id, category_id, address_id) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, created_at, status";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, urgentTicket.getCode());
            stmt.setString(2, urgentTicket.getTitle());
            stmt.setString(3, urgentTicket.getDescription());
            stmt.setInt(4, urgentTicket.getUser().getId());
            stmt.setInt(5, urgentTicket.getCategory().getId());
            stmt.setInt(6, urgentTicket.getAddress().getId());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    urgentTicket.setId(rs.getInt("id"));

                    if (rs.getTimestamp("created_at") != null) {
                        urgentTicket.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                    }
                }
            }
            return urgentTicket;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar ticket urgente.", e);
        }
    }
}
