package br.com.trampo.backend.controller.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.port.service.ticket.TicketImageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("api/v1/image-tickets")
public class TicketImageController {

    private final TicketImageService ticketImageService;

    public TicketImageController(TicketImageService ticketImageService) {
        this.ticketImageService = ticketImageService;
    }

    @PostMapping("/{ticketId}/images")
    public ResponseEntity<Void> uploadImages(
            @PathVariable Integer ticketId,
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal Users authenticatedUser
    ) {
        ticketImageService.uploadImages(ticketId, files, authenticatedUser);

        return ResponseEntity.noContent().build();
    }
}
