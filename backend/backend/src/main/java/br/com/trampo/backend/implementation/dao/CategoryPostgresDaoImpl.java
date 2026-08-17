package br.com.trampo.backend.implementation.dao;

import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.port.dao.CategoryDao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class CategoryPostgresDaoImpl implements CategoryDao {
    private final Connection connection;

    public CategoryPostgresDaoImpl(Connection connection) {
        this.connection = connection;
    }

    @Override
    public Category save(Category category) {
        String sql = "INSERT INTO category (name, icon_url) VALUES (?, ?) RETURNING id";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, category.getName());
            stmt.setString(2, category.getIconUrl());
            //stmt.setString(2, category.getDescription());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    category.setId(rs.getInt("id"));
                }
            }
            return category;
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao salvar Categoria", e);
        }
    }

    @Override
    public List<Category> findAll(){
        List<Category> categories = new ArrayList<>();
        String sql = """
            SELECT id, name, icon_url
            FROM category
            ORDER BY name
        """;
        try(
            PreparedStatement stmt = connection.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();
        ){
            while(rs.next()){
                Category category = new Category();
                category.setId(rs.getInt("id"));
                category.setName(rs.getString("name"));
                category.setIconUrl(rs.getString("icon_url"));
                categories.add(category);
            }
            return categories;
        }catch (SQLException e){
            throw new RuntimeException("Erro ao buscar categorias.", e);
        }
    }

    @Override
    public Optional<Category> findById(Integer id) {
        String sql = "SELECT * FROM category WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Category category = new Category();
                    category.setId(rs.getInt("id"));
                    category.setName(rs.getString("name"));
                    category.setIconUrl(rs.getString("icon_url"));
                    return Optional.of(category);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar Categoria por ID", e);
        }
        return Optional.empty();
    }
}
