package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.ticket.UrgentTicket;
import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.ticket.UrgentTicketDao;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class UrgentTicketPostgresDaoImpl implements UrgentTicketDao {

    private final DataSource dataSource;

    public UrgentTicketPostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public List<UrgentTicket> findByUserId(int userId, List<StatusTicket> statuses, int page, int size) {
        String sql = """
                SELECT t.*, a.street, a.number, a.neighborhood,
                       a.city, a.state, a.zip_code, a.complement
                FROM urgent_ticket t
                INNER JOIN address a ON a.id = t.address_id
                WHERE t.user_id = ?
                """;
        return findTickets(sql, userId, statuses, page, size);
    }

    @Override
    public List<UrgentTicket> findByProviderId(int providerId, List<StatusTicket> statuses, int page, int size) {
        String sql = """
                SELECT t.*, a.street, a.number, a.neighborhood,
                       a.city, a.state, a.zip_code, a.complement
                FROM urgent_ticket t
                INNER JOIN address a ON a.id = t.address_id
                WHERE t.provider_id = ?
                  AND t.status IN ('IN_PROGRESS', 'COMPLETED')
                """;
        return findTickets(sql, providerId, statuses, page, size);
    }

    private List<UrgentTicket> findTickets(String sql, int userId, List<StatusTicket> statuses, int page, int size) {
        if (statuses != null && !statuses.isEmpty()) {
            sql += " AND t.status IN (" + "?,".repeat(statuses.size()).replaceAll(",$", "") + ")";
        }
        sql += """
                ORDER BY t.created_at DESC, t.id DESC
                LIMIT ? OFFSET ?
                """;
        List<UrgentTicket> tickets = new ArrayList<>();

        try (Connection connection = dataSource.getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            int parameter = 2;
            if (statuses != null && !statuses.isEmpty()) {
                for (StatusTicket status : statuses) stmt.setString(parameter++, status.name());
            }
            stmt.setInt(parameter++, size + 1);
            stmt.setInt(parameter, page * size);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    tickets.add(mapResultSetToUrgentTicket(rs));
                }
            }
            return tickets;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar tickets urgentes.", e);
        }
    }

    @Override
    public Optional<UrgentTicket> findById(int id) {
        String sql = """
                SELECT t.*, a.street, a.number, a.neighborhood,
                       a.city, a.state, a.zip_code, a.complement
                FROM urgent_ticket t
                INNER JOIN address a ON a.id = t.address_id
                WHERE t.id = ?
                """;
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, id);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return Optional.of(mapResultSetToUrgentTicket(resultSet));
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar ticket urgente.", e);
        }
    }

    @Override
    public boolean updateStatus(int id, StatusTicket currentStatus, StatusTicket newStatus) {
        String updateTicket = """
                UPDATE urgent_ticket
                SET status = ?,
                    service_date = CASE WHEN ? = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE service_date END
                WHERE id = ? AND status = ?
                RETURNING provider_id
                """;
        String updateProvider = """
                UPDATE users
                SET completed_services_count = COALESCE(completed_services_count, 0) + 1
                WHERE id = ?
                """;

        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                int providerId;
                try (PreparedStatement statement = connection.prepareStatement(updateTicket)) {
                    statement.setString(1, newStatus.name());
                    statement.setString(2, newStatus.name());
                    statement.setInt(3, id);
                    statement.setString(4, currentStatus.name());
                    try (ResultSet resultSet = statement.executeQuery()) {
                        if (!resultSet.next()) {
                            connection.rollback();
                            return false;
                        }
                        providerId = resultSet.getInt("provider_id");
                    }
                }

                if (newStatus == StatusTicket.COMPLETED) {
                    try (PreparedStatement statement = connection.prepareStatement(updateProvider)) {
                        statement.setInt(1, providerId);
                        statement.executeUpdate();
                    }
                }

                connection.commit();
                return true;
            } catch (SQLException e) {
                connection.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar status do ticket urgente.", e);
        }
    }

    private UrgentTicket mapResultSetToUrgentTicket(ResultSet rs) throws SQLException {
        UrgentTicket ticket = new UrgentTicket();
        ticket.setId(rs.getInt("id"));
        ticket.setCode(rs.getString("code"));
        ticket.setTitle(rs.getString("title"));
        ticket.setDescription(rs.getString("description"));
        ticket.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        Timestamp serviceDate = rs.getTimestamp("service_date");
        if (serviceDate != null) {
            ticket.setServiceDate(serviceDate.toLocalDateTime());
        }
        ticket.setStatus(StatusTicket.valueOf(rs.getString("status")));

        Users user = new Users();
        user.setId(rs.getInt("user_id"));
        ticket.setUser(user);
        Users provider = new Users();
        provider.setId(rs.getInt("provider_id"));
        ticket.setProvider(provider);
        Category category = new Category();
        category.setId(rs.getInt("category_id"));
        ticket.setCategory(category);

        Address address = new Address();
        address.setId(rs.getInt("address_id"));
        address.setStreet(rs.getString("street"));
        address.setNumber(rs.getString("number"));
        address.setNeighborhood(rs.getString("neighborhood"));
        address.setCity(rs.getString("city"));
        address.setState(rs.getString("state"));
        address.setZipCode(rs.getString("zip_code"));
        address.setComplement(rs.getString("complement"));
        ticket.setAddress(address);
        return ticket;
    }


    @Override
    public UrgentTicket save(UrgentTicket urgentTicket) {


        String sql = "INSERT INTO urgent_ticket (code, title, description, user_id, provider_id, category_id, address_id) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, created_at, status";

        try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, urgentTicket.getCode());
            stmt.setString(2, urgentTicket.getTitle());
            stmt.setString(3, urgentTicket.getDescription());
            stmt.setInt(4, urgentTicket.getUser().getId());
            stmt.setInt(5, urgentTicket.getProvider().getId());
            stmt.setInt(6, urgentTicket.getCategory().getId());
            stmt.setInt(7, urgentTicket.getAddress().getId());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    urgentTicket.setId(rs.getInt("id"));

                    if (rs.getTimestamp("created_at") != null) {
                        urgentTicket.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                    }

                    urgentTicket.setStatus(StatusTicket.valueOf(rs.getString("status")));
                }
            }
            return urgentTicket;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar ticket urgente.", e);
        }
    }
}
