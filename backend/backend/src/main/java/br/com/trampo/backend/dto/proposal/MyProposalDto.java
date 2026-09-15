package br.com.trampo.backend.dto.proposal;

import br.com.trampo.backend.dto.ticket.TicketDto;

public record MyProposalDto(
        ProposalDto proposal,
        TicketDto ticket
) {
}
