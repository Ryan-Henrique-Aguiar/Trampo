package br.com.trampo.backend.implementation.service.review;

import br.com.trampo.backend.domain.Review;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusProposal;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.domain.ticket.Proposal;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.dto.review.CreateReviewDto;
import br.com.trampo.backend.dto.review.ReviewDto;
import br.com.trampo.backend.dto.review.ReviewStatusDto;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;
import br.com.trampo.backend.port.dao.proposal.ProposalDao;
import br.com.trampo.backend.port.dao.review.ReviewDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.service.review.ReviewService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewDao reviewDao;
    private final TicketDao ticketDao;
    private final ProposalDao proposalDao;

    public ReviewServiceImpl(ReviewDao reviewDao, TicketDao ticketDao, ProposalDao proposalDao) {
        this.reviewDao = reviewDao;
        this.ticketDao = ticketDao;
        this.proposalDao = proposalDao;
    }

    @Transactional
    @Override
    public ReviewDto create(int ticketId, CreateReviewDto dto, Users user) {
        validateUser(user);
        validateReview(dto);

        Ticket ticket = findTicket(ticketId);
        Users reviewedUser = findOtherUser(ticket, user);

        if (ticket.getStatus() != StatusTicket.COMPLETED) {
            throw new InvalidRequestException("O serviço precisa estar concluído para ser avaliado.");
        }
        if (reviewDao.existsByTicketAndReviewer(ticketId, user.getId())) {
            throw new InvalidRequestException("Você já avaliou este serviço.");
        }

        Review review = new Review(
                null,
                dto.score(),
                dto.comment() == null ? null : dto.comment().trim(),
                ticketId,
                user.getId(),
                reviewedUser.getId(),
                null
        );

        Review savedReview = reviewDao.save(review);
        reviewDao.updateUserRating(reviewedUser.getId());
        return toDto(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewStatusDto getStatus(int ticketId, Users user) {
        validateUser(user);
        Ticket ticket = findTicket(ticketId);
        findOtherUser(ticket, user);

        boolean alreadyReviewed = reviewDao.existsByTicketAndReviewer(ticketId, user.getId());
        boolean canReview = ticket.getStatus() == StatusTicket.COMPLETED && !alreadyReviewed;
        return new ReviewStatusDto(canReview, alreadyReviewed);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> findByUserId(int userId) {
        return reviewDao.findByReviewedUserId(userId).stream()
                .map(this::toDto)
                .toList();
    }

    private Users findOtherUser(Ticket ticket, Users user) {
        Proposal acceptedProposal = proposalDao.findByTicketId(ticket.getId()).stream()
                .filter(proposal -> proposal.getStatus() == StatusProposal.ACCEPTED)
                .findFirst()
                .orElseThrow(() -> new InvalidRequestException("O serviço não possui uma proposta aceita."));

        if (ticket.getUser().getId().equals(user.getId())) {
            return acceptedProposal.getProfessional();
        }
        if (acceptedProposal.getProfessional().getId().equals(user.getId())) {
            return ticket.getUser();
        }
        throw new UnauthorizedUserException("Usuário não participou deste serviço.");
    }

    private Ticket findTicket(int ticketId) {
        try {
            return ticketDao.findById(ticketId)
                    .orElseThrow(() -> new InvalidRequestException("Ticket não encontrado."));
        } catch (SQLException e) {
            throw new InvalidRequestException("Não foi possível buscar o ticket.");
        }
    }

    private void validateUser(Users user) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado.");
        }
    }

    private void validateReview(CreateReviewDto dto) {
        if (dto == null || dto.score() == null || dto.score() < 1 || dto.score() > 5) {
            throw new InvalidRequestException("A nota deve estar entre 1 e 5.");
        }
        if (dto.comment() != null && dto.comment().trim().length() > 500) {
            throw new InvalidRequestException("O comentário deve ter no máximo 500 caracteres.");
        }
    }

    private ReviewDto toDto(Review review) {
        return new ReviewDto(
                review.getId(),
                review.getScore(),
                review.getComment(),
                review.getTicketId(),
                review.getReviewedUserId(),
                review.getCreatedAt()
        );
    }
}
