package br.com.trampo.backend.domain.ticket;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class UrgentTicket {
    private Integer id;
    private String code;
    private String title;
    private String description;

    private LocalDateTime createdAt;
    private LocalDateTime serviceDate;
    private StatusTicket status;
    private Users user;
    private Users provider;
    private Address address;
    private Category category;


    public UrgentTicket(String code, String title, String description, Users user, Users provider, Address address, Category category) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.user = user;
        this.provider = provider;
        this.address = address;

        this.category = category;

        this.createdAt = LocalDateTime.now();
        this.status = StatusTicket.IN_PROGRESS;
    }
}
