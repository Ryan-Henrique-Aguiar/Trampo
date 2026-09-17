package br.com.trampo.backend.port.service.ticket;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.ticket.TicketImage;
import br.com.trampo.backend.dto.ticket.TicketImageResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TicketImageService {
    void uploadImages(
            Integer ticketId,
            List<MultipartFile> files,
            Users user
    );

    List<TicketImageResponse> findByTicketId(Integer ticketId);

    Resource getImage(Integer imageId);

    void deleteImage(Integer imageId, Users user);
}
