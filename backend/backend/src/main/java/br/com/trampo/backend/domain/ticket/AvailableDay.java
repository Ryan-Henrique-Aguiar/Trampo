package br.com.trampo.backend.domain.ticket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AvailableDay {
    private int id;
    private String availableDay;

    private Ticket ticket;

    public AvailableDay(String s, Ticket newTicket) {
        this.availableDay = s;
        this.ticket = newTicket;
    }
}
