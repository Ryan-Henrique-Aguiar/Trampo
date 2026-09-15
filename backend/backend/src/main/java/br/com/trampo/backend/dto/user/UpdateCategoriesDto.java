package br.com.trampo.backend.dto.user;

import java.util.List;

public record UpdateCategoriesDto(List<Integer> categoryIds) {
}
