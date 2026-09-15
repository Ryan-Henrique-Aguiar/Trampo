package br.com.trampo.backend.controller.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.enums.StatusTicket;
import br.com.trampo.backend.dto.ticket.CreateUrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UpdateTicketStatusDto;
import br.com.trampo.backend.dto.common.PageDto;
import br.com.trampo.backend.port.service.ticket.UrgentTicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("api/v1/urgenttickets")
public class UrgentTicketController {

    @Autowired
    private final UrgentTicketService urgentTicketService;

    public UrgentTicketController(UrgentTicketService urgentTicketService) {
        this.urgentTicketService = urgentTicketService;
    }

    @PostMapping
    public ResponseEntity<UrgentTicketDto> createUrgentTicket(@AuthenticationPrincipal Users user, @RequestBody CreateUrgentTicketDto createUrgentTicketDto) throws SQLException {
        UrgentTicketDto response = urgentTicketService.createUrgentTicket(createUrgentTicketDto, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageDto<UrgentTicketDto>> findMyUrgentTickets(
            @AuthenticationPrincipal Users user,
            @RequestParam(required = false) List<StatusTicket> status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return ResponseEntity.ok(urgentTicketService.getMyUrgentTickets(user, status, page, size));
    }

    @GetMapping("/assigned")
    public ResponseEntity<PageDto<UrgentTicketDto>> findMyProvidedUrgentTickets(
            @AuthenticationPrincipal Users user,
            @RequestParam(required = false) List<StatusTicket> status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(urgentTicketService.getMyProvidedUrgentTickets(user, status, page, size));
    }

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<UrgentTicketDto> updateStatus(
            @PathVariable int ticketId,
            @RequestBody UpdateTicketStatusDto data,
            @AuthenticationPrincipal Users user
    ) {
        return ResponseEntity.ok(urgentTicketService.updateStatus(ticketId, data, user));
    }

}
