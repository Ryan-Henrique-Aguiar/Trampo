package br.com.trampo.backend.dto.user;

public record UpdatePasswordDto(String currentPassword, String newPassword) {
}
