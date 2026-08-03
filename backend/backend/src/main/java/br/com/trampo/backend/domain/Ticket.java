package br.com.trampo.backend.domain;


import br.com.trampo.backend.domain.enums.StatusTicket;
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
    private String code;
    private String title;
    private String description;
    private BigDecimal priceMax;

    private LocalDateTime createdAt;
    private LocalDateTime serviceDate;

    private int proposalsCount;

    private StatusTicket status;

    private Users client;
    private Address address;
    private Category category;

}

