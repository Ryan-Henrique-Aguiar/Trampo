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

public class UrgentTicketPostgresDaoImpl implements UrgentTicketDao {

    private final DataSource dataSource;

    public UrgentTicketPostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public List<UrgentTicket> findByUserId(int userId, int page, int size) {
        String sql = """
                SELECT t.*, a.street, a.number, a.neighborhood,
                       a.city, a.state, a.zip_code, a.complement
                FROM urgent_ticket t
                INNER JOIN address a ON a.id = t.address_id
                WHERE t.user_id = ?
                ORDER BY t.created_at DESC, t.id DESC
                LIMIT ? OFFSET ?
                """;
        List<UrgentTicket> tickets = new ArrayList<>();

        try (Connection connection = dataSource.getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            stmt.setInt(2, size + 1);
            stmt.setInt(3, page * size);
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
