package br.com.trampo.backend.implementation.dao;

import br.com.trampo.backend.port.dao.UsersCategoryDao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class UsersCategoryPostgresDaoImpl implements UsersCategoryDao {
    private final Connection connection;

    public UsersCategoryPostgresDaoImpl(Connection connection) {
        this.connection = connection;
    }

    @Override
    public void save(Integer userId, Integer categoryId) {
        String sql = """
                INSERT INTO user_category (user_id, category_id)
                VALUES (?, ? )
                """;
        try(PreparedStatement stmt = connection.prepareStatement(sql)){
            stmt.setInt(1, userId);
            stmt.setInt(2, categoryId);
            stmt.executeUpdate();
        }catch (SQLException e){
            throw new RuntimeException("Erro ao associar categoria ao usuaro",e );
        }
    }
}
