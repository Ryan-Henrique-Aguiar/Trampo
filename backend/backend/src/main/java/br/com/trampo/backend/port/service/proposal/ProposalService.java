package br.com.trampo.backend.port.service.proposal;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusProposal;
import br.com.trampo.backend.dto.proposal.CreateProposalDto;
import br.com.trampo.backend.dto.proposal.MyProposalDto;
import br.com.trampo.backend.dto.proposal.ProposalDto;
import br.com.trampo.backend.dto.common.PageDto;

import java.util.List;

public interface ProposalService {
    ProposalDto create(CreateProposalDto dto, Users user);

    List<ProposalDto> findByTicketId(int ticketId, Users user);

    PageDto<MyProposalDto> findMyProposals(Users user, List<StatusProposal> statuses, int page, int size);

    ProposalDto accept(int proposalId, Users user);

    ProposalDto reject(int proposalId, Users user);
}
