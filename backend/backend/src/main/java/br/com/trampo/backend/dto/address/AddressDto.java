package br.com.trampo.backend.dto.address;

public record AddressDto(
        Integer id,
        String street,
        String number,
        String neighborhood,
        String city,
        String state,
        String zipCode,
        String complement
) {
}