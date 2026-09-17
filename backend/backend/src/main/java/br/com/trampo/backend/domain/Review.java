package br.com.trampo.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    private Integer id;
    private Integer score;
    private String comment;
    private Integer ticketId;
    private Integer reviewerId;
    private Integer reviewedUserId;
    private LocalDateTime createdAt;
}
