package br.com.trampo.backend.mapper.proposal;

import br.com.trampo.backend.domain.ticket.Proposal;
import br.com.trampo.backend.dto.proposal.ProposalDto;
import org.springframework.stereotype.Component;

@Component
public class ProposalMapper {

    public ProposalDto toDto(Proposal proposal) {
        return new ProposalDto(
                proposal.getId(),
                proposal.getPriceRange(),
                proposal.getStatus(),
                proposal.getProfessional().getId(),
                proposal.getProfessional().getName(),
                proposal.getProfessional().getPhone(),
                proposal.getTicket().getId()
        );
    }
}
