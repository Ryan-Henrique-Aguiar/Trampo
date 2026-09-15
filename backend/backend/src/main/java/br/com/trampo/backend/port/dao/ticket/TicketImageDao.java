package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.ticket.TicketImage;

import java.util.List;
import java.util.Optional;

public interface TicketImageDao {
    
    void save(TicketImage image);

    List<TicketImage> findByTicketId(Integer ticketId);

    Optional<TicketImage> findById(Integer imageId);

    void deleteById(Integer imageId);

    void deleteByTicketId(Integer ticketId);
}
