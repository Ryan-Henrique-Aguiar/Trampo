package br.com.trampo.backend.port.service.review;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.review.CreateReviewDto;
import br.com.trampo.backend.dto.review.ReviewDto;
import br.com.trampo.backend.dto.review.ReviewStatusDto;

import java.util.List;

public interface ReviewService {
    ReviewDto create(int ticketId, CreateReviewDto dto, Users user);

    ReviewStatusDto getStatus(int ticketId, Users user);

    List<ReviewDto> findByUserId(int userId);
}
