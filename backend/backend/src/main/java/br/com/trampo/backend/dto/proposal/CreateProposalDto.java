package br.com.trampo.backend.dto.proposal;

import java.math.BigDecimal;

public record CreateProposalDto(
        BigDecimal priceRange,
        Integer ticketId
) {
}
