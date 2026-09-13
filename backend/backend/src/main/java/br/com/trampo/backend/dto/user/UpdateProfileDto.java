package br.com.trampo.backend.dto.user;

public record UpdateProfileDto(String name, String email, String cpf, String phone) {
}
