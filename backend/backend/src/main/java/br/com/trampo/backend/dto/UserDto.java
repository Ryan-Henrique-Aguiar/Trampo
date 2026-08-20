package br.com.trampo.backend.dto;

import br.com.trampo.backend.domain.Category;

import java.util.List;

public record UserDto(String name,
                      double rating,
                      int completed_services_count,
                      boolean is_Provider,
                      List<Category> categoryId) {
}
