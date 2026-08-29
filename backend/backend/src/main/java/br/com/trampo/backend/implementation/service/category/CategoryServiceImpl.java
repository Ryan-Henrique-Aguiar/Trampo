package br.com.trampo.backend.implementation.service.category;

import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.dto.CategoryDto;
import br.com.trampo.backend.infra.exception.CategoryNotFoundException;
import br.com.trampo.backend.port.dao.CategoryDao;
import br.com.trampo.backend.port.service.category.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements CategoryService {
    private final CategoryDao categoryDao;

    public CategoryServiceImpl(CategoryDao categoryDao) {
        this.categoryDao = categoryDao;
    }

    @Transactional(readOnly = true)
    @Override
    public List<CategoryDto> findAllCategories() {
        List<CategoryDto> categoriesDto = new ArrayList<>();
        for (Category category : categoryDao.findAll()) {
            CategoryDto categoryDto = new CategoryDto(
                    category.getId(),
                    category.getName(),
                    category.getIconUrl()
            );
            categoriesDto.add(categoryDto);
        }
        return categoriesDto;
    }

    @Transactional(readOnly = true)
    @Override
    public Category findCategoryById(Integer id) {
        return categoryDao.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Categoria não encontrada para o ID: " + id));
    }
}
