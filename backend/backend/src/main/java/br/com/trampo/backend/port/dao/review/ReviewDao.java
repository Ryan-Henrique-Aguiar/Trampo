package br.com.trampo.backend.port.dao.review;

import br.com.trampo.backend.domain.Review;

import java.util.List;

public interface ReviewDao {
    Review save(Review review);

    boolean existsByTicketAndReviewer(int ticketId, int reviewerId);

    List<Review> findByReviewedUserId(int userId);

    void updateUserRating(int userId);
}
