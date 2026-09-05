package br.com.trampo.backend.domain.notification;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.Ticket;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    private int id;
    private String message;
    private LocalDateTime createdAt;
    private Ticket ticket;
    private Boolean isRead = false;
    private Users user;

}
