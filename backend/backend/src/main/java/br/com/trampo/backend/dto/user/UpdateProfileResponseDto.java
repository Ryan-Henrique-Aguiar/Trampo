package br.com.trampo.backend.dto.user;

import br.com.trampo.backend.dto.UserDto;

public record UpdateProfileResponseDto(UserDto user, String token) {
}
