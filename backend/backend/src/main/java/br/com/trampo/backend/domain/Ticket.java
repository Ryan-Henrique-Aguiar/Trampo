package br.com.trampo.backend.domain;


import br.com.trampo.backend.domain.user.Client;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    private Integer id;
    private String title;
    private String description;
    private BigDecimal priceMin;
    private BigDecimal priceMax;

    private LocalDateTime createdAt;
    private LocalDateTime serviceDate;

    private String status;

    private Client client;
    private Address address;
    private Category category;

}

