package br.com.trampo.backend.controller.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.ticket.CreateTicketDto;
import br.com.trampo.backend.dto.ticket.TicketDto;
import br.com.trampo.backend.port.service.ticket.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }


    @PostMapping()
    public ResponseEntity<TicketDto> create(@RequestBody CreateTicketDto createTicketDto, @AuthenticationPrincipal Users user) {
        TicketDto response = ticketService.createTicket(createTicketDto, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping()
    public ResponseEntity<List<TicketDto>> findMyTickets(
            @AuthenticationPrincipal Users user
    ) {
        return ResponseEntity.ok(ticketService.getMyTickets(user));
    }

    @GetMapping("/available")
    public ResponseEntity<List<TicketDto>> findAvailableTicekts(
            @AuthenticationPrincipal Users user,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice
            ){
        return ResponseEntity.ok(ticketService.getAvailableTickets(user, categoryId, minPrice, maxPrice));
    }

}
