package br.com.trampo.backend.dto.address;

public record CreateAddressDto(String street,
                               String number,
                               String neighborhood,
                               String city,
                               String state,
                               String zipCode,
                               String complement) {
}
