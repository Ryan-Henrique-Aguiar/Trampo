package br.com.trampo.backend.implementation.dao;

import br.com.trampo.backend.domain.user.Client;
import br.com.trampo.backend.port.dao.ClientDao;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ClientPostgresDaoImpl implements ClientDao {
    private final Connection connection;

    public ClientPostgresDaoImpl(Connection connection) {
        this.connection = connection;
    }

    @Override
    public Client save(Client client) {
        String sqlUser = "INSERT INTO users (name, password, email, phone, nickname, cpf, rating) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id";

        String sqlClient = "INSERT INTO client (user_id, created_tickets_count) VALUES (?, ?)";

        try {
            // Desativa auto-commit para controlar a transação manualmente
            connection.setAutoCommit(false);

            int userId;

            // 1. Inserir em 'users' e pegar o ID gerado
            try (PreparedStatement stmtUser = connection.prepareStatement(sqlUser)) {
                stmtUser.setString(1, client.getName());
                stmtUser.setString(2, client.getPassword());
                stmtUser.setString(3, client.getEmail());
                stmtUser.setString(4, client.getPhone());
                stmtUser.setString(5, client.getNickname());
                stmtUser.setString(6, client.getCpf());
                stmtUser.setObject(7, client.getRating(), Types.NUMERIC);

                try (ResultSet rs = stmtUser.executeQuery()) {
                    if (rs.next()) {
                        userId = rs.getInt(1);
                        client.setId(userId);
                    } else {
                        throw new SQLException("Falha ao criar usuário, ID não retornado.");
                    }
                }
            }

            // 2. Inserir em 'client' usando o ID gerado
            try (PreparedStatement stmtClient = connection.prepareStatement(sqlClient)) {
                stmtClient.setInt(1, userId);
                stmtClient.setInt(2, client.getCreatedTicketsCount());
                stmtClient.executeUpdate();
            }

            // Confirma a transação se tudo deu certo
            connection.commit();
            return client;

        } catch (SQLException e) {
            try {
                // Em caso de erro, desfaz as alterações no banco
                connection.rollback();
            } catch (SQLException rollbackEx) {
                rollbackEx.printStackTrace();
            }
            throw new RuntimeException("Erro ao salvar cliente no banco de dados", e);
        } finally {
            try {
                connection.setAutoCommit(true);
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public Optional<Client> findById(long id) {
        String sql = "SELECT u.*, c.created_tickets_count FROM users u " +
                "INNER JOIN client c ON u.id = c.user_id WHERE u.id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, (int) id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Client client = new Client();
                    client.setId(rs.getInt("id"));
                    client.setName(rs.getString("name"));
                    client.setEmail(rs.getString("email"));
                    client.setCpf(rs.getString("cpf"));
                    client.setCreatedTicketsCount(rs.getInt("created_tickets_count"));
                    return Optional.of(client);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar cliente por ID", e);
        }

        return Optional.empty();
    }

    @Override
    public List<Client> findAll() {
        return new ArrayList<>();
    }
}
