package br.com.trampo.backend.dto;

import java.time.LocalDate;

public record UserDto(Integer id,
                      String name,
                      String email,
                      String phone,
                      String cpf,
                      Double rating,
                      boolean provider,
                      boolean availableForUrgency,
                      Integer createdServicesCount,
                      LocalDate serviceStartDate,
                      Integer completedServicesCount,
                      String city,
                      String state) {
}
