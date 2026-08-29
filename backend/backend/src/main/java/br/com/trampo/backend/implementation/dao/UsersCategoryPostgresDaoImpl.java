package br.com.trampo.backend.implementation.dao;

import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.UsersCategoryDao;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class UsersCategoryPostgresDaoImpl implements UsersCategoryDao {

    private final DataSource dataSource;

    public UsersCategoryPostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(Integer userId, Integer categoryId) {
        ;

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
}