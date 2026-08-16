package br.com.trampo.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Users implements UserDetails {
    private Integer id;
    private String name;
    private String password;
    private String email;
    private String phone;
    private String nickname;
    private String cpf;
    private Double rating;

    private boolean provider = false;
    private boolean availableForUrgency = false;

    private Integer createdServicesCount;

    private LocalDate serviceStartDate;

    private Integer completedServicesCount;

    private String city;
    private String state;

    private List<Category> categories = new ArrayList<>();

    // Construtor para o metodo Register
    public Users(String email, String password, String name, String cpf, String phone, String city, String state, boolean isProvider) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.cpf = cpf;
        this.phone = phone;
        this.city = city;
        this.state = state;
        this.provider = provider;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }
}
