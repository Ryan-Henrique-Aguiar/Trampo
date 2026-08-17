package br.com.trampo.backend.port.service.category;

import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.dto.CategoryDto;

import java.util.List;
import java.util.Optional;

public interface CategoryService {
    List<CategoryDto> findAllCategories();

    Category findCategoryById(Integer id);
}
