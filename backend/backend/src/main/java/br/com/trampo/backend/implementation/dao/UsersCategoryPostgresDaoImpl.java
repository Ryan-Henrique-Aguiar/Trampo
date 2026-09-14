package br.com.trampo.backend.implementation.dao;

import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.UsersCategoryDao;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class UsersCategoryPostgresDaoImpl implements UsersCategoryDao {

    private final DataSource dataSource;

    public UsersCategoryPostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(Integer userId, Integer categoryId) {
        String sql = """
                INSERT INTO user_category (user_id, category_id)
                VALUES (?, ?)
                """;

        try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            stmt.setInt(2, categoryId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao associar categoria ao usuário.", e);
        }
    }

    @Override
    public List<Integer> findCategoryIdsByUserId(Integer userId) {
        String sql = "SELECT category_id FROM user_category WHERE user_id = ? ORDER BY category_id";
        List<Integer> categoryIds = new ArrayList<>();

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, userId);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    categoryIds.add(resultSet.getInt("category_id"));
                }
            }
            return categoryIds;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar categorias do usuário.", e);
        }
    }

    @Override
    public void updateCategoriesAndActivateProvider(Integer userId, List<Integer> categoryIds) {
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE users SET is_provider = TRUE WHERE id = ?")) {
                    statement.setInt(1, userId);
                    statement.executeUpdate();
                }

                try (PreparedStatement statement = connection.prepareStatement(
                        "DELETE FROM user_category WHERE user_id = ?")) {
                    statement.setInt(1, userId);
                    statement.executeUpdate();
                }

                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO user_category (user_id, category_id) VALUES (?, ?)")) {
                    for (Integer categoryId : categoryIds) {
                        statement.setInt(1, userId);
                        statement.setInt(2, categoryId);
                        statement.executeUpdate();
                    }
                }

                connection.commit();
            } catch (SQLException e) {
                connection.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar categorias do prestador.", e);
        }
    }
}
