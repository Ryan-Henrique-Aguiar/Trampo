package br.com.trampo.backend.implementation.dao.users;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.port.dao.users.UsersDao;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;


public class UsersPostgresDaoImpl implements UsersDao {

    private final Connection connection;

    public UsersPostgresDaoImpl(Connection connection) {
        this.connection = connection;
    }

    private Users mapUser(ResultSet rs) throws SQLException {

        Users user = new Users();

        user.setId(rs.getInt("id"));
        user.setName(rs.getString("name"));
        user.setPassword(rs.getString("password"));
        user.setEmail(rs.getString("email"));
        user.setPhone(rs.getString("phone"));
        user.setNickname(rs.getString("nickname"));
        user.setCpf(rs.getString("cpf"));
        if (rs.getObject("rating") != null) {
            user.setRating(rs.getDouble("rating"));
        }

        user.setProvider(rs.getBoolean("is_provider"));
        user.setCreatedServicesCount(
                rs.getInt("created_services_count")
        );

        Date serviceDate = rs.getDate("service_start_date");

        if (serviceDate != null) {
            user.setServiceStartDate(serviceDate.toLocalDate());
        }

        user.setCompletedServicesCount(
                rs.getInt("completed_services_count")
        );

        user.setAvailableForUrgency(
                rs.getBoolean("is_available_for_urgency")
        );

        user.setCity(rs.getString("city"));
        user.setState(rs.getString("state"));

        return user;
    }

    @Override
    public Users save(Users users) {

        String sql = """
                INSERT INTO users (
                    name,
                    password,
                    email,
                    phone,
                    nickname,
                    cpf,
                    rating,
                    is_provider,
                    created_services_count,
                    service_start_date,
                    completed_services_count,
                    is_available_for_urgency,
                    city,
                    state
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """;

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setString(1, users.getName());
            stmt.setString(2, users.getPassword());
            stmt.setString(3, users.getEmail());
            stmt.setString(4, users.getPhone());
            stmt.setString(5, users.getNickname());
            stmt.setString(6, users.getCpf());

            if (users.getRating() != null) {
                stmt.setDouble(7, users.getRating());
            } else {
                stmt.setNull(7, Types.NUMERIC);
            }

            stmt.setBoolean(8, users.isProvider());

            stmt.setInt(9, users.getCreatedServicesCount() != null
                    ? users.getCreatedServicesCount()
                    : 0);

            if (users.getServiceStartDate() != null) {
                stmt.setDate(10, Date.valueOf(users.getServiceStartDate()));
            } else {
                stmt.setNull(10, Types.DATE);
            }
            stmt.setInt(11, users.getCompletedServicesCount() != null
                    ? users.getCompletedServicesCount()
                    : 0);
            

            stmt.setBoolean(12, users.isProvider() && users.isAvailableForUrgency());

            stmt.setString(13, users.getCity());
            stmt.setString(14, users.getState());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    users.setId(rs.getInt("id"));
                }
            }

            return users;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao salvar usuário.", e);
        }
    }

    @Override
    public Optional<Users> findById(long id) {

        String sql = "SELECT * FROM users WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setLong(1, id);

            try (ResultSet rs = stmt.executeQuery()) {

                if (rs.next()) {

                    Users user = new Users();

                    user.setId(rs.getInt("id"));
                    user.setName(rs.getString("name"));
                    user.setPassword(rs.getString("password"));
                    user.setEmail(rs.getString("email"));
                    user.setPhone(rs.getString("phone"));
                    user.setNickname(rs.getString("nickname"));
                    user.setCpf(rs.getString("cpf"));

                    if (rs.getObject("rating") != null) {
                        user.setRating(rs.getDouble("rating"));
                    }

                    user.setProvider(rs.getBoolean("is_provider"));

                    user.setCreatedServicesCount(rs.getInt("created_services_count"));

                    Date serviceDate = rs.getDate("service_start_date");
                    if (serviceDate != null) {
                        user.setServiceStartDate(serviceDate.toLocalDate());
                    }

                    user.setCompletedServicesCount(rs.getInt("completed_services_count"));

                    user.setAvailableForUrgency(rs.getBoolean("is_available_for_urgency"));

                    user.setCity(rs.getString("city"));
                    user.setState(rs.getString("state"));

                    return Optional.of(user);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar usuário.", e);
        }

        return Optional.empty();
    }

    @Override
    public Optional<Users> findByEmail(String email) {

        String sql = "SELECT * FROM users WHERE email = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {

                if (rs.next()) {
                    return Optional.of(mapUser(rs));
                }

                return Optional.empty();
            }

        } catch (SQLException e) {
            throw new RuntimeException(
                    "Erro ao buscar usuário por email.",
                    e
            );
        }
    }

    @Override
    public List<Users> findAll() {

        List<Users> users = new ArrayList<>();

        String sql = "SELECT * FROM users";

        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {

                Users user = new Users();

                user.setId(rs.getInt("id"));
                user.setName(rs.getString("name"));
                user.setPassword(rs.getString("password"));
                user.setEmail(rs.getString("email"));
                user.setPhone(rs.getString("phone"));
                user.setNickname(rs.getString("nickname"));
                user.setCpf(rs.getString("cpf"));

                if (rs.getObject("rating") != null) {
                    user.setRating(rs.getDouble("rating"));
                }

                user.setProvider(rs.getBoolean("is_provider"));
                user.setCreatedServicesCount(rs.getInt("created_services_count"));

                Date serviceDate = rs.getDate("service_start_date");
                if (serviceDate != null) {
                    user.setServiceStartDate(serviceDate.toLocalDate());
                }

                user.setCompletedServicesCount(rs.getInt("completed_services_count"));
                user.setAvailableForUrgency(rs.getBoolean("is_available_for_urgency"));

                user.setCity(rs.getString("city"));
                user.setState(rs.getString("state"));

                users.add(user);
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao listar usuários.", e);
        }

        return users;
    }
}