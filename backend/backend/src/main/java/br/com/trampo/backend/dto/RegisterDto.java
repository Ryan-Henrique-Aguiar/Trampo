package br.com.trampo.backend.dto;

import java.util.List;

public record RegisterDto(
        String email,
        String password,
        String name,
        String phone,
        String cpf,
        String city,
        String state,
        boolean provider,
        List<Integer> categoryIds
) {
}
