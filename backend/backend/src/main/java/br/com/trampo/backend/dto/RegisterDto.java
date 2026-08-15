package br.com.trampo.backend.dto;

public record RegisterDto(
        String email,
        String password,
        String name,
        String phone,
        String cpf,
        String city
) {
}
