package br.com.trampo.backend.dto;

public record UserDto(String name,
                      double rating,
                      int completed_services_count) {
}
