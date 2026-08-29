package br.com.trampo.backend.controller.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.ticket.CreateUrgentTicketDto;
import br.com.trampo.backend.dto.ticket.UrgentTicketDto;
import br.com.trampo.backend.port.service.ticket.UrgentTicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;

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

}
