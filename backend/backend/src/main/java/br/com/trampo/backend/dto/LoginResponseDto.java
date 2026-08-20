package br.com.trampo.backend.dto;

public record LoginResponseDto(String token, UserDto user) {
}
