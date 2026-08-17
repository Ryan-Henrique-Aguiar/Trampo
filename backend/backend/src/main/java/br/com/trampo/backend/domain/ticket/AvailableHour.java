package br.com.trampo.backend.domain.ticket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AvailableHour {
    private int id;
    private String availableHour;

    private Ticket ticket;

    public AvailableHour(String s, Ticket newTicket) {
        this.availableHour = s;
        this.ticket = newTicket;
    }
}
