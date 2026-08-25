package br.com.trampo.backend.domain.ticket;

import br.com.trampo.backend.domain.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketPaymentMethod {
    private int id;
    private PaymentMethod paymentMethod;
    private Ticket ticket;

    public TicketPaymentMethod(PaymentMethod paymentMethod, Ticket ticket) {
        this.paymentMethod = paymentMethod;
        this.ticket = ticket;
    }
}
