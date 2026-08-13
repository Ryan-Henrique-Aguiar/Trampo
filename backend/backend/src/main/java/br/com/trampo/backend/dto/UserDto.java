package br.com.trampo.backend.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDto {
    private String name;
    private double rating;
    private int completed_services_count;
}
