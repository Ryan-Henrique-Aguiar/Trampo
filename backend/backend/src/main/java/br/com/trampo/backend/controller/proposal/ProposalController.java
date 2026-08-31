package br.com.trampo.backend.controller.proposal;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.proposal.CreateProposalDto;
import br.com.trampo.backend.dto.proposal.ProposalDto;
import br.com.trampo.backend.port.service.proposal.ProposalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/v1/proposals")
public class ProposalController {

    private final ProposalService proposalService;

    public ProposalController(ProposalService proposalService) {
        this.proposalService = proposalService;
    }

    @PostMapping()
    public ResponseEntity<ProposalDto> create(
            @AuthenticationPrincipal Users user,
            @RequestBody CreateProposalDto dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(proposalService.create(dto, user));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<ProposalDto>> findByTicketId(
            @AuthenticationPrincipal Users user,
            @PathVariable int ticketId
    ) {
        return ResponseEntity.ok(proposalService.findByTicketId(ticketId, user));
    }

    @PatchMapping("/{proposalId}/accept")
    public ResponseEntity<ProposalDto> accept(
            @AuthenticationPrincipal Users user,
            @PathVariable int proposalId
    ) {
        return ResponseEntity.ok(proposalService.accept(proposalId, user));
    }

    @PatchMapping("/{proposalId}/reject")
    public ResponseEntity<ProposalDto> reject(
            @AuthenticationPrincipal Users user,
            @PathVariable int proposalId
    ) {
        return ResponseEntity.ok(proposalService.reject(proposalId, user));
    }
}
