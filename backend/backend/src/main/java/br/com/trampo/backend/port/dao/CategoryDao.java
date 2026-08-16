package br.com.trampo.backend.port.dao;

import br.com.trampo.backend.domain.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryDao {
    Category save(Category category);
    List<Category> findAll();
    Optional<Category> findById(Integer id);
}
