package br.com.trampo.backend.port.dao.proposal;

import br.com.trampo.backend.domain.enums.StatusProposal;
import br.com.trampo.backend.domain.ticket.Proposal;

import java.util.List;
import java.util.Optional;

public interface ProposalDao {
    Proposal save(Proposal proposal);

    Optional<Proposal> findById(int id);

    List<Proposal> findByTicketId(int ticketId);

    List<Proposal> findByTicketIdAndProfessionalId(int ticketId, int professionalId);

    boolean existsByTicketIdAndProfessionalId(int ticketId, int professionalId);

    boolean canProfessionalPropose(int ticketId, int professionalId);

    Proposal updateStatus(Proposal proposal, StatusProposal status);

    void rejectOtherPending(int ticketId, int acceptedProposalId);
}
