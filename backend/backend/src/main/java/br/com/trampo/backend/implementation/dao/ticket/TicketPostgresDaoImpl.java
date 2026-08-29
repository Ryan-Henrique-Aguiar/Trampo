package br.com.trampo.backend.implementation.dao.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class TicketPostgresDaoImpl implements TicketDao {

    private final DataSource dataSource;
    private final AddressDao addressDao;

    public TicketPostgresDaoImpl(DataSource dataSource, AddressDao addressDao) {
        this.dataSource = dataSource;
        this.addressDao = addressDao;
    }

    @Override
    public Ticket save(Ticket ticket) {
        Connection connection = DataSourceUtils.getConnection(dataSource);

        try {
            if (ticket.getAddress() != null &&
                    (ticket.getAddress().getId() == null || ticket.getAddress().getId() == 0)) {

                Address savedAddress = addressDao.save(ticket.getAddress());
                ticket.setAddress(savedAddress);
            }

            String sql = "INSERT INTO ticket (code, title, description, price_max, " +
                    "user_id, address_id, category_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id";

            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setString(1, ticket.getCode());
                stmt.setString(2, ticket.getTitle());
                stmt.setString(3, ticket.getDescription());
                stmt.setObject(4, ticket.getPriceMax(), Types.NUMERIC);
                stmt.setInt(5, ticket.getUser().getId());
                stmt.setInt(6, ticket.getAddress().getId());
                stmt.setInt(7, ticket.getCategory().getId());

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        ticket.setId(rs.getInt(1));
                    }
                }
            }

            return ticket;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar ticket no banco de dados.", e);
        }
    }

    @Override
    public Optional<Ticket> findById(int id) {
        Connection connection = DataSourceUtils.getConnection(dataSource);
        String sql = "SELECT t.*, a.street, a.number, a.neighborhood, a.city, a.state, a.zip_code, a.complement " +
                "FROM ticket t " +
                "INNER JOIN address a ON t.address_id = a.id " +
                "WHERE t.id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Ticket ticket = mapResultSetToTicket(rs);
                    return Optional.of(ticket);
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar ticket por ID.", e);
        }
    }

    @Override
    public List<Ticket> findAvailableForProvider(int providerId, String city, String state, Integer categoryId, BigDecimal minPrice, BigDecimal maxPrice) {
        Connection connection = DataSourceUtils.getConnection(dataSource);
        List<Ticket> tickets = new ArrayList<>();

        String sql = """
                SELECT DISTINCT
                    t.*,
                    a.street,
                    a.number,
                    a.neighborhood,
                    a.city,
                    a.state,
                    a.zip_code,
                    a.complement
                FROM ticket t
                INNER JOIN address a
                    ON a.id = t.address_id
                INNER JOIN user_category uc
                    ON uc.category_id = t.category_id
                   AND uc.user_id = ?
                WHERE t.status = 'OPEN'
                  AND t.user_id <> ?
                  AND LOWER(a.city) = LOWER(?)
                  AND a.state = ?
                  AND (? IS NULL OR t.category_id = ?)
                  AND (? IS NULL OR t.price_max >= ?)
                  AND (? IS NULL OR t.price_max <= ?)
                ORDER BY t.created_at DESC
                """;

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, providerId);
            stmt.setInt(2, providerId);
            stmt.setString(3, city);
            stmt.setString(4, state);

            if (categoryId != null) {
                stmt.setInt(5, categoryId);
                stmt.setInt(6, categoryId);
            } else {
                stmt.setNull(5, Types.INTEGER);
                stmt.setNull(6, Types.INTEGER);
            }

            if (minPrice != null) {
                stmt.setBigDecimal(7, minPrice);
                stmt.setBigDecimal(8, minPrice);
            } else {
                stmt.setNull(7, Types.NUMERIC);
                stmt.setNull(8, Types.NUMERIC);
            }

            if (maxPrice != null) {
                stmt.setBigDecimal(9, maxPrice);
                stmt.setBigDecimal(10, maxPrice);
            } else {
                stmt.setNull(9, Types.NUMERIC);
                stmt.setNull(10, Types.NUMERIC);
            }

            try (ResultSet resultSet = stmt.executeQuery()) {
                while (resultSet.next()) {
                    tickets.add(mapResultSetToTicket(resultSet));
                }
            }
            return tickets;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar tickets disponíveis.", e);
        }
    }

    @Override
    public List<Ticket> findAll() {
        Connection connection = DataSourceUtils.getConnection(dataSource);
        List<Ticket> tickets = new ArrayList<>();
        String sql = "SELECT t.*, a.street, a.number, a.neighborhood, a.city, a.state, a.zip_code, a.complement " +
                "FROM ticket t " +
                "INNER JOIN address a ON t.address_id = a.id";

        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                tickets.add(mapResultSetToTicket(rs));
            }
            return tickets;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar todos os tickets.", e);
        }
    }

    @Override
    public List<Ticket> findByUserId(int userId) {
        Connection connection = DataSourceUtils.getConnection(dataSource);
        List<Ticket> tickets = new ArrayList<>();

        String sql = """
                SELECT
                    t.*,
                    a.street,
                    a.number,
                    a.neighborhood,
                    a.city,
                    a.state,
                    a.zip_code,
                    a.complement
                FROM ticket t
                INNER JOIN address a ON a.id = t.address_id
                WHERE t.user_id = ?
                ORDER BY t.created_at DESC
                """;

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    tickets.add(mapResultSetToTicket(rs));
                }
            }
            return tickets;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar tickets por ID do usuário.", e);
        }
    }

    private Ticket mapResultSetToTicket(ResultSet rs) throws SQLException {
        Ticket ticket = new Ticket();
        ticket.setId(rs.getInt("id"));
        ticket.setCode(rs.getString("code"));
        ticket.setProposalsCount(rs.getInt("proposals_count"));
        ticket.setTitle(rs.getString("title"));
        ticket.setDescription(rs.getString("description"));
        ticket.setPriceMax(rs.getBigDecimal("price_max"));
        ticket.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());

        Timestamp serviceDate = rs.getTimestamp("service_date");
        if (serviceDate != null) {
            ticket.setServiceDate(serviceDate.toLocalDateTime());
        }

        ticket.setStatus(StatusTicket.valueOf(rs.getString("status")));

        Users user = new Users();
        user.setId(rs.getInt("user_id"));
        ticket.setUser(user);

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
}