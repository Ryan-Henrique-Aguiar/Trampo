package br.com.trampo.backend.port.service.category;

import br.com.trampo.backend.dto.CategoryDto;

import java.util.List;

public interface CategoryService {
    List<CategoryDto> findAllCategories();
}
