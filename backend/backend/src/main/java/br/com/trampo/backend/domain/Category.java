package br.com.trampo.backend.domain;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Category {
    private Integer id;
    private String name;
    private String iconUrl;

    public Category(String name, String iconUrl) {
        this.name = name;
        this.iconUrl = iconUrl;
    }
}
