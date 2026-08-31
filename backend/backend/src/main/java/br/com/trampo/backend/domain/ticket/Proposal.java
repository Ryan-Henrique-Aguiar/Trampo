package br.com.trampo.backend.domain.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusProposal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Proposal {
    private Integer id;
    private BigDecimal priceRange;
    private StatusProposal status;
    private Users professional;
    private Ticket ticket;

    public Proposal(BigDecimal priceRange, Users professional, Ticket ticket) {
        this.priceRange = priceRange;
        this.status = StatusProposal.PENDING;
        this.professional = professional;
        this.ticket = ticket;
    }
}
