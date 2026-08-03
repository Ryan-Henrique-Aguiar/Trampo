package br.com.trampo.backend.implementation.dao;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Ticket;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.TicketDao;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class TicketPostgresDaoImpl implements TicketDao {
    private final Connection connection;
    private final AddressDao addressDao;


    public TicketPostgresDaoImpl(Connection connection, AddressDao addressDao) {
        this.connection = connection;
        this.addressDao = addressDao;

    }


    @Override
    public Ticket save(Ticket ticket) throws SQLException {
        boolean originalAutoCommit = connection.getAutoCommit();

        try {
            connection.setAutoCommit(false); // Início da transação

            // 1. Se o Endereço for novo (id == null ou 0), salva primeiro para obter o id
            if (ticket.getAddress() != null && ticket.getAddress().getId() == 0) {
                Address savedAddress = addressDao.saveWithConnection(ticket.getAddress(), connection);
                ticket.setAddress(savedAddress);
            }

            // 2. Insere o Ticket com a FK address_id vinculada
            String sql = "INSERT INTO ticket (code ,title, description, price_max, " +
                    "service_date, user_id, address_id, category_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id";

            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setString(1, ticket.getCode());
                stmt.setString(2, ticket.getTitle());
                stmt.setString(3, ticket.getDescription());
                stmt.setObject(4, ticket.getPriceMax(), Types.NUMERIC);
                stmt.setTimestamp(5, ticket.getServiceDate() != null ? Timestamp.valueOf(ticket.getServiceDate()) : null);
                stmt.setInt(6, ticket.getClient().getId());
                stmt.setInt(7, ticket.getAddress().getId());
                stmt.setInt(8, ticket.getCategory().getId());

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        ticket.setId(rs.getInt(1));
                    }
                }
            }

            connection.commit(); // Efetiva no banco
            return ticket;

        } catch (SQLException e) {
            connection.rollback(); // Cancela tudo se falhar
            throw e;
        } finally {
            connection.setAutoCommit(originalAutoCommit);
        }
    }

    @Override
    public Optional<Ticket> findById(int id) throws SQLException {
        // Query com INNER JOIN para trazer os dados do Ticket e do Address juntos
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
        }
        return Optional.empty();
    }

    @Override
    public List<Ticket> findAll() throws SQLException {
        List<Ticket> tickets = new ArrayList<>();
        String sql = "SELECT t.*, a.street, a.number, a.neighborhood, a.city, a.state, a.zip_code, a.complement " +
                "FROM ticket t " +
                "INNER JOIN address a ON t.address_id = a.id";

        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                tickets.add(mapResultSetToTicket(rs));
            }
        }
        return tickets;
    }

    // Helper method para mapear o ResultSet para a entidade Java
    private Ticket mapResultSetToTicket(ResultSet rs) throws SQLException {
        Ticket ticket = new Ticket();
        ticket.setId(rs.getInt("id"));
        ticket.setTitle(rs.getString("title"));
        ticket.setDescription(rs.getString("description"));
        ticket.setPriceMax(rs.getBigDecimal("price_max"));
        ticket.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());

        Timestamp serviceDate = rs.getTimestamp("service_date");
        if (serviceDate != null) {
            ticket.setServiceDate(serviceDate.toLocalDateTime());
        }

        ticket.setStatus(StatusTicket.valueOf(rs.getString("status")));


        Users client = new Users();
        client.setId(rs.getInt("client_id"));
        ticket.setClient(client);

        Category category = new Category();
        category.setId(rs.getInt("category_id"));
        ticket.setCategory(category);

        // Monta o objeto Address vindo dos campos do JOIN
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
