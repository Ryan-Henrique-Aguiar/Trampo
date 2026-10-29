package br.com.trampo.backend.implementation.service.proposal;

import br.com.trampo.backend.domain.Category;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusProposal;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.ticket.Proposal;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.dto.common.PageDto;
import br.com.trampo.backend.dto.proposal.CreateProposalDto;
import br.com.trampo.backend.dto.proposal.MyProposalDto;
import br.com.trampo.backend.dto.proposal.ProposalDto;
import br.com.trampo.backend.dto.ticket.TicketDto;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;
import br.com.trampo.backend.mapper.proposal.ProposalMapper;
import br.com.trampo.backend.mapper.ticket.TicketMapper;
import br.com.trampo.backend.port.dao.proposal.ProposalDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.service.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProposalServiceImplTest {

    @Mock
    private ProposalDao proposalDao;

    @Mock
    private TicketDao ticketDao;

    @Mock
    private ProposalMapper proposalMapper;

    @Mock
    private TicketMapper ticketMapper;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ProposalServiceImpl service;

    private Users createUser(Integer id, boolean provider) {
        Users user = new Users();
        user.setId(id);
        user.setName("Usuario " + id);
        user.setProvider(provider);
        return user;
    }

    private Ticket createTicket(Integer id, Users owner, StatusTicket status) {
        Ticket ticket = new Ticket();
        ticket.setId(id);
        ticket.setTitle("Troca de Disjuntor");
        ticket.setPriceMax(BigDecimal.valueOf(500));
        ticket.setStatus(status);
        ticket.setUser(owner);
        ticket.setCategory(new Category());
        return ticket;
    }

    private Proposal createProposal(Integer id, Users professional, Ticket ticket, StatusProposal status) {
        Proposal proposal = new Proposal(BigDecimal.valueOf(300), professional, ticket);
        proposal.setId(id);
        proposal.setStatus(status);
        return proposal;
    }

    private ProposalDto createProposalDto(Proposal proposal) {
        return new ProposalDto(
                proposal.getId(),
                proposal.getPriceRange(),
                proposal.getStatus(),
                proposal.getProfessional().getId(),
                proposal.getProfessional().getName(),
                proposal.getProfessional().getPhone(),
                proposal.getProfessional().getRating(),
                proposal.getTicket().getId()
        );
    }

    private TicketDto createTicketDto(Ticket ticket) {
        return new TicketDto(
                ticket.getId(), null, ticket.getTitle(), null, null,
                ticket.getPriceMax(), null, ticket.getStatus(),
                ticket.getUser().getId(), ticket.getUser().getName(), null,
                null, 0, null, List.of(), List.of(), List.of()
        );
    }

    @Test
    void createProposalWithSuccess() throws SQLException {
        Users owner = createUser(2, false);
        Users provider = createUser(1, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);
        CreateProposalDto dto = new CreateProposalDto(BigDecimal.valueOf(300), 10);

        Proposal savedProposal = createProposal(5, provider, ticket, StatusProposal.PENDING);
        ProposalDto expected = createProposalDto(savedProposal);

        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));
        when(proposalDao.canProfessionalPropose(10, 1)).thenReturn(true);
        when(proposalDao.existsByTicketIdAndProfessionalId(10, 1)).thenReturn(false);
        when(proposalDao.save(any(Proposal.class))).thenReturn(savedProposal);
        when(proposalMapper.toDto(savedProposal)).thenReturn(expected);

        ProposalDto result = service.create(dto, provider);

        assertEquals(expected, result);

        verify(proposalDao).save(any(Proposal.class));
        verify(ticketDao).incrementProposalsCount(10);
        verify(notificationService).create(
                "O prestador Usuario 1 enviou uma proposta para o serviço Troca de Disjuntor",
                10,
                owner
        );
    }

    @Test
    void createProposalThrowsWhenUserIsNotProvider() {
        Users client = createUser(1, false);
        CreateProposalDto dto = new CreateProposalDto(BigDecimal.valueOf(300), 10);

        UnauthorizedUserException exception = assertThrows(
                UnauthorizedUserException.class,
                () -> service.create(dto, client)
        );

        assertEquals("Apenas prestadores podem enviar propostas.", exception.getMessage());
        verify(proposalDao, never()).save(any(Proposal.class));
    }

    @Test
    void createProposalThrowsWhenPriceIsAboveTicketMax() throws SQLException {
        Users owner = createUser(2, false);
        Users provider = createUser(1, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);
        CreateProposalDto dto = new CreateProposalDto(BigDecimal.valueOf(501), 10);

        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> service.create(dto, provider)
        );

        assertEquals(
                "O valor da proposta não pode ultrapassar o orçamento máximo do ticket.",
                exception.getMessage()
        );
        verify(proposalDao, never()).save(any(Proposal.class));
    }

    @Test
    void createProposalThrowsWhenProfessionalAlreadyProposed() throws SQLException {
        Users owner = createUser(2, false);
        Users provider = createUser(1, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);
        CreateProposalDto dto = new CreateProposalDto(BigDecimal.valueOf(300), 10);

        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));
        when(proposalDao.canProfessionalPropose(10, 1)).thenReturn(true);
        when(proposalDao.existsByTicketIdAndProfessionalId(10, 1)).thenReturn(true);

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> service.create(dto, provider)
        );

        assertEquals("Prestador já enviou uma proposta para este ticket.", exception.getMessage());
        verify(proposalDao, never()).save(any(Proposal.class));
        verify(ticketDao, never()).incrementProposalsCount(10);
    }

    @Test
    void findByTicketIdReturnsAllProposalsForTicketOwner() throws SQLException {
        Users owner = createUser(2, false);
        Users providerA = createUser(1, true);
        Users providerB = createUser(3, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);

        Proposal proposalA = createProposal(1, providerA, ticket, StatusProposal.PENDING);
        Proposal proposalB = createProposal(2, providerB, ticket, StatusProposal.PENDING);
        ProposalDto dtoA = createProposalDto(proposalA);
        ProposalDto dtoB = createProposalDto(proposalB);

        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));
        when(proposalDao.findByTicketId(10)).thenReturn(List.of(proposalA, proposalB));
        when(proposalMapper.toDto(proposalA)).thenReturn(dtoA);
        when(proposalMapper.toDto(proposalB)).thenReturn(dtoB);

        List<ProposalDto> result = service.findByTicketId(10, owner);

        assertEquals(List.of(dtoA, dtoB), result);
        verify(proposalDao).findByTicketId(10);
    }

    @Test
    void findByTicketIdReturnsOnlyOwnProposalsForProvider() throws SQLException {
        Users owner = createUser(2, false);
        Users provider = createUser(1, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);

        Proposal proposal = createProposal(1, provider, ticket, StatusProposal.PENDING);
        ProposalDto dto = createProposalDto(proposal);

        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));
        when(proposalDao.findByTicketIdAndProfessionalId(10, 1)).thenReturn(List.of(proposal));
        when(proposalMapper.toDto(proposal)).thenReturn(dto);

        List<ProposalDto> result = service.findByTicketId(10, provider);

        assertEquals(List.of(dto), result);
        verify(proposalDao).findByTicketIdAndProfessionalId(10, 1);
        verify(proposalDao, never()).findByTicketId(10);
    }

    @Test
    void findMyProposalsReturnsPageWithNext() throws SQLException {
        Users owner = createUser(2, false);
        Users provider = createUser(1, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);

        Proposal proposal1 = createProposal(1, provider, ticket, StatusProposal.PENDING);
        Proposal proposal2 = createProposal(2, provider, ticket, StatusProposal.PENDING);
        Proposal proposal3 = createProposal(3, provider, ticket, StatusProposal.PENDING);

        TicketDto ticketDto = createTicketDto(ticket);
        List<StatusProposal> statuses = List.of(StatusProposal.PENDING);

        when(proposalDao.findByProfessionalId(1, statuses, 0, 2))
                .thenReturn(List.of(proposal1, proposal2, proposal3));
        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));
        when(proposalMapper.toDto(proposal1)).thenReturn(createProposalDto(proposal1));
        when(proposalMapper.toDto(proposal2)).thenReturn(createProposalDto(proposal2));
        when(ticketMapper.toDto(ticket)).thenReturn(ticketDto);

        PageDto<MyProposalDto> result = service.findMyProposals(provider, statuses, 0, 2);

        assertEquals(2, result.content().size());
        assertTrue(result.hasNext());
        verify(proposalMapper, never()).toDto(proposal3);
    }

    @Test
    void acceptProposalWithSuccess() throws SQLException {
        Users owner = createUser(2, false);
        Users provider = createUser(1, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);
        Proposal proposal = createProposal(5, provider, ticket, StatusProposal.PENDING);

        Proposal acceptedProposal = createProposal(5, provider, ticket, StatusProposal.ACCEPTED);
        ProposalDto expected = createProposalDto(acceptedProposal);

        when(proposalDao.findById(5)).thenReturn(Optional.of(proposal));
        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));
        when(proposalDao.updateStatus(proposal, StatusProposal.ACCEPTED)).thenReturn(acceptedProposal);
        when(proposalMapper.toDto(acceptedProposal)).thenReturn(expected);

        ProposalDto result = service.accept(5, owner);

        assertEquals(expected, result);
        assertEquals(StatusProposal.ACCEPTED, result.status());

        verify(proposalDao).updateStatus(proposal, StatusProposal.ACCEPTED);
        verify(proposalDao).rejectOtherPending(10, 5);
        verify(ticketDao).updateStatus(10, StatusTicket.IN_PROGRESS);
    }

    @Test
    void acceptProposalThrowsWhenUserIsNotTicketOwner() throws SQLException {
        Users owner = createUser(2, false);
        Users stranger = createUser(9, false);
        Users provider = createUser(1, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);
        Proposal proposal = createProposal(5, provider, ticket, StatusProposal.PENDING);

        when(proposalDao.findById(5)).thenReturn(Optional.of(proposal));
        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));

        UnauthorizedUserException exception = assertThrows(
                UnauthorizedUserException.class,
                () -> service.accept(5, stranger)
        );

        assertEquals("Apenas o criador do ticket pode alterar propostas.", exception.getMessage());
        verify(proposalDao, never()).updateStatus(any(Proposal.class), any(StatusProposal.class));
    }

    @Test
    void rejectProposalWithSuccess() throws SQLException {
        Users owner = createUser(2, false);
        Users provider = createUser(1, true);
        Ticket ticket = createTicket(10, owner, StatusTicket.OPEN);
        Proposal proposal = createProposal(5, provider, ticket, StatusProposal.PENDING);

        Proposal rejectedProposal = createProposal(5, provider, ticket, StatusProposal.REJECTED);
        ProposalDto expected = createProposalDto(rejectedProposal);

        when(proposalDao.findById(5)).thenReturn(Optional.of(proposal));
        when(ticketDao.findById(10)).thenReturn(Optional.of(ticket));
        when(proposalDao.updateStatus(proposal, StatusProposal.REJECTED)).thenReturn(rejectedProposal);
        when(proposalMapper.toDto(rejectedProposal)).thenReturn(expected);

        ProposalDto result = service.reject(5, owner);

        assertEquals(expected, result);
        assertEquals(StatusProposal.REJECTED, result.status());

        verify(proposalDao).updateStatus(proposal, StatusProposal.REJECTED);
        verify(ticketDao, never()).updateStatus(10, StatusTicket.IN_PROGRESS);
    }
}

