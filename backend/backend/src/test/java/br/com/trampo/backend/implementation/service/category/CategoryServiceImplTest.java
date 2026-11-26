package br.com.trampo.backend.implementation.service.category;

import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.dto.CategoryDto;
import br.com.trampo.backend.infra.exception.CategoryNotFoundException;
import br.com.trampo.backend.port.dao.CategoryDao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryDao categoryDao;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    void shouldListAllCategories() {
        Category eletrica = new Category(1, "Elétrica", "eletrica.svg");
        Category pintura = new Category(2, "Pintura", "pintura.svg");
        when(categoryDao.findAll()).thenReturn(List.of(eletrica, pintura));

        List<CategoryDto> resultado = categoryService.findAllCategories();

        assertEquals(2, resultado.size());
        assertEquals(new CategoryDto(1, "Elétrica", "eletrica.svg"), resultado.get(0));
        assertEquals(new CategoryDto(2, "Pintura", "pintura.svg"), resultado.get(1));
        verify(categoryDao).findAll();
    }

    @Test
    void shouldFindCategoryById() {
        Category categoria = new Category(1, "Elétrica", "eletrica.svg");
        when(categoryDao.findById(1)).thenReturn(Optional.of(categoria));

        Category resultado = categoryService.findCategoryById(1);

        assertSame(categoria, resultado);
        verify(categoryDao).findById(1);
    }

    @Test
    void shouldRejectNonexistentCategory() {
        when(categoryDao.findById(99)).thenReturn(Optional.empty());

        CategoryNotFoundException exception = assertThrows(
                CategoryNotFoundException.class,
                () -> categoryService.findCategoryById(99)
        );

        assertEquals("Categoria não encontrada para o ID: 99", exception.getMessage());
        verify(categoryDao).findById(99);
    }
}
