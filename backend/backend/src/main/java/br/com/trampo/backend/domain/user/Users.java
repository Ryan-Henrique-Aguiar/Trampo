package br.com.trampo.backend.domain.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

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
}
