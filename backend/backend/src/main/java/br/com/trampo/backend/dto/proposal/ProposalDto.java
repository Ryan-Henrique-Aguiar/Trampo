package br.com.trampo.backend.dto.proposal;

import br.com.trampo.backend.domain.enums.StatusProposal;

import java.math.BigDecimal;

public record ProposalDto(
        Integer id,
        BigDecimal priceRange,
        StatusProposal status,
        Integer professionalId,
        String professionalName,
        String professionalPhone,
        Integer ticketId
) {
}
