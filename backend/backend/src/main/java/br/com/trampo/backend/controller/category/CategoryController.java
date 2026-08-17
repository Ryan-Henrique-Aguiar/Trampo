package br.com.trampo.backend.controller.category;
import br.com.trampo.backend.dto.CategoryDto;
import br.com.trampo.backend.port.service.category.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService){
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDto>> findAll() {
        return ResponseEntity.ok(categoryService.findAllCategories());
    }
}
