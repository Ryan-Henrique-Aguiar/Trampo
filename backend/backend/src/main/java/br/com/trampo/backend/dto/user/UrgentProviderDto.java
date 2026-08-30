package br.com.trampo.backend.dto.user;

public record UrgentProviderDto(
        Integer id,
        String name,
        Double rating,
        String phone
) {
}
