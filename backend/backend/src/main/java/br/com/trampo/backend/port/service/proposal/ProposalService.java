package br.com.trampo.backend.port.service.proposal;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.proposal.CreateProposalDto;
import br.com.trampo.backend.dto.proposal.ProposalDto;

import java.util.List;

public interface ProposalService {
    ProposalDto create(CreateProposalDto dto, Users user);

    List<ProposalDto> findByTicketId(int ticketId, Users user);

    ProposalDto accept(int proposalId, Users user);

    ProposalDto reject(int proposalId, Users user);
}
