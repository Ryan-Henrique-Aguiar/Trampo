package br.com.trampo.backend.controller.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.TicketCreateResponseDto;
import br.com.trampo.backend.port.service.ticket.TicketService;
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
@RequestMapping("api/v1/ticket")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }


    @PostMapping("/create")
    public ResponseEntity<TicketCreateResponseDto> create(@RequestBody CreateTicketDto createTicketDto, @AuthenticationPrincipal Users user) {
        TicketCreateResponseDto response = ticketService.createTicket(createTicketDto, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

}
