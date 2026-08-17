package br.com.trampo.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {
    private Integer id;
    private String street;
    private String number;
    private String neighborhood;
    private String city;
    private String state;
    private String zipCode;
    private String complement;

    private Users user;

    // Construtor para criação de novos endereços
    public Address(String street, String number, String neighborhood, String city, String state, String zipcode, String complement, Users user) {
        this.street = street;
        this.number = number;
        this.neighborhood = neighborhood;
        this.city = city;
        this.state = state;
        this.zipCode = zipcode;
        this.complement = complement;
        this.user = user;
    }
}
