package br.com.trampo.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Users {
    private Integer id;
    private String name;
    private String password;
    private String email;
    private String phone;
    private String nickname;
    private String cpf;
    private Double rating;

    private boolean provider;
    private boolean availableForUrgency;

    private Integer createdServicesCount;

    private LocalDate serviceStartDate;

    private Integer completedServicesCount;

    private String city;
    private String state;

}
