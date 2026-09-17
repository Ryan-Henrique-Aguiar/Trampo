package br.com.trampo.backend.controller.review;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.review.CreateReviewDto;
import br.com.trampo.backend.dto.review.ReviewDto;
import br.com.trampo.backend.dto.review.ReviewStatusDto;
import br.com.trampo.backend.port.service.review.ReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/tickets/{ticketId}")
    public ResponseEntity<ReviewDto> create(
            @PathVariable int ticketId,
            @RequestBody CreateReviewDto dto,
            @AuthenticationPrincipal Users user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.create(ticketId, dto, user));
    }

    @GetMapping("/tickets/{ticketId}/status")
    public ResponseEntity<ReviewStatusDto> getStatus(
            @PathVariable int ticketId,
            @AuthenticationPrincipal Users user
    ) {
        return ResponseEntity.ok(reviewService.getStatus(ticketId, user));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<ReviewDto>> findByUserId(@PathVariable int userId) {
        return ResponseEntity.ok(reviewService.findByUserId(userId));
    }
}
