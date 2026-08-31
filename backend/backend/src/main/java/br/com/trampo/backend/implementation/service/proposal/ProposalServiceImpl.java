package br.com.trampo.backend.implementation.service.proposal;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusProposal;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.ticket.Proposal;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.dto.proposal.CreateProposalDto;
import br.com.trampo.backend.dto.proposal.ProposalDto;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;
import br.com.trampo.backend.mapper.proposal.ProposalMapper;
import br.com.trampo.backend.port.dao.proposal.ProposalDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.service.proposal.ProposalService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;

@Service
public class ProposalServiceImpl implements ProposalService {

    private final ProposalDao proposalDao;
    private final TicketDao ticketDao;
    private final ProposalMapper proposalMapper;

    public ProposalServiceImpl(
            ProposalDao proposalDao,
            TicketDao ticketDao,
            ProposalMapper proposalMapper
    ) {
        this.proposalDao = proposalDao;
        this.ticketDao = ticketDao;
        this.proposalMapper = proposalMapper;
    }

    @Transactional
    @Override
    public ProposalDto create(CreateProposalDto dto, Users user) {
        validateAuthenticatedUser(user);

        if (!user.isProvider()) {
            throw new UnauthorizedUserException("Apenas prestadores podem enviar propostas.");
        }

        if (dto == null || dto.ticketId() == null || dto.priceRange() == null) {
            throw new InvalidRequestException("Ticket e valor da proposta são obrigatórios.");
        }

        if (dto.priceRange().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("O valor da proposta deve ser maior que zero.");
        }

        Ticket ticket = findTicket(dto.ticketId());

        if (ticket.getStatus() != StatusTicket.OPEN) {
            throw new InvalidRequestException("Apenas tickets abertos podem receber propostas.");
        }

        if (dto.priceRange().compareTo(ticket.getPriceMax()) > 0) {
            throw new InvalidRequestException("O valor da proposta não pode ultrapassar o orçamento máximo do ticket.");
        }

        if (!proposalDao.canProfessionalPropose(ticket.getId(), user.getId())) {
            throw new UnauthorizedUserException("Prestador não pode enviar proposta para este ticket.");
        }

        if (proposalDao.existsByTicketIdAndProfessionalId(ticket.getId(), user.getId())) {
            throw new InvalidRequestException("Prestador já enviou uma proposta para este ticket.");
        }

        Proposal proposal = proposalDao.save(
                new Proposal(dto.priceRange(), user, ticket)
        );
        ticketDao.incrementProposalsCount(ticket.getId());

        return proposalMapper.toDto(proposal);
    }

    @Transactional(readOnly = true)
    @Override
    public List<ProposalDto> findByTicketId(int ticketId, Users user) {
        validateAuthenticatedUser(user);
        Ticket ticket = findTicket(ticketId);

        List<Proposal> proposals;

        if (ticket.getUser().getId().equals(user.getId())) {
            proposals = proposalDao.findByTicketId(ticketId);
        } else if (user.isProvider()) {
            proposals = proposalDao.findByTicketIdAndProfessionalId(ticketId, user.getId());
        } else {
            throw new UnauthorizedUserException("Usuário não pode consultar as propostas deste ticket.");
        }

        return proposals.stream()
                .map(proposalMapper::toDto)
                .toList();
    }

    @Transactional
    @Override
    public ProposalDto accept(int proposalId, Users user) {
        validateAuthenticatedUser(user);
        Proposal proposal = findProposal(proposalId);
        Ticket ticket = findTicket(proposal.getTicket().getId());

        validateTicketOwner(ticket, user);

        if (ticket.getStatus() != StatusTicket.OPEN) {
            throw new InvalidRequestException("Apenas tickets abertos podem aceitar propostas.");
        }

        validatePendingProposal(proposal);

        Proposal updatedProposal = proposalDao.updateStatus(proposal, StatusProposal.ACCEPTED);
        proposalDao.rejectOtherPending(ticket.getId(), proposalId);
        ticketDao.updateStatus(ticket.getId(), StatusTicket.IN_PROGRESS);

        return proposalMapper.toDto(updatedProposal);
    }

    @Transactional
    @Override
    public ProposalDto reject(int proposalId, Users user) {
        validateAuthenticatedUser(user);
        Proposal proposal = findProposal(proposalId);
        Ticket ticket = findTicket(proposal.getTicket().getId());

        validateTicketOwner(ticket, user);
        validatePendingProposal(proposal);

        return proposalMapper.toDto(
                proposalDao.updateStatus(proposal, StatusProposal.REJECTED)
        );
    }

    private Ticket findTicket(int ticketId) {
        try {
            return ticketDao.findById(ticketId)
                    .orElseThrow(() -> new InvalidRequestException("Ticket não encontrado."));
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar ticket da proposta.", e);
        }
    }

    private Proposal findProposal(int proposalId) {
        return proposalDao.findById(proposalId)
                .orElseThrow(() -> new InvalidRequestException("Proposta não encontrada."));
    }

    private void validateAuthenticatedUser(Users user) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário autenticado é obrigatório.");
        }
    }

    private void validateTicketOwner(Ticket ticket, Users user) {
        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedUserException("Apenas o criador do ticket pode alterar propostas.");
        }
    }

    private void validatePendingProposal(Proposal proposal) {
        if (proposal.getStatus() != StatusProposal.PENDING) {
            throw new InvalidRequestException("Apenas propostas pendentes podem ser alteradas.");
        }
    }
}
