package br.com.trampo.backend.domain.ticket;


import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

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


    // Construtor utilizado na criacao do ticket
    public Ticket(String code, String title, String description, double priceMax, Users client, Address address, Category category) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.priceMax = BigDecimal.valueOf(priceMax); // Converte de double para BigDecimal
        this.client = client;
        this.address = address;


        this.category = category;


        // Atribui valores padrao de criacao
        this.createdAt = LocalDateTime.now();
        this.status = StatusTicket.OPEN;
        this.proposalsCount = 0;
    }
}

