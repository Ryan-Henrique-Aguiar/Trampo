package br.com.trampo.backend.dto;

import java.time.LocalDate;

public record UserDto(Integer id,
                      String name,
                      Double rating,
                      boolean provider,
                      boolean availableForUrgency,
                      Integer createdServicesCount,
                      LocalDate serviceStartDate,
                      Integer completedServicesCount,
                      String city,
                      String state) {
}
