package br.com.trampo.backend.port.dao;

import br.com.trampo.backend.domain.Category;

import java.util.Optional;

public interface CategoryDao {
    Category save(Category category);

    Optional<Category> findById(Integer id);
}
