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
    private String zip_code;
    private String complement;

}
