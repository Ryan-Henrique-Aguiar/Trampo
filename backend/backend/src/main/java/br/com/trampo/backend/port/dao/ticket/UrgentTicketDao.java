package br.com.trampo.backend.port.dao.ticket;

import br.com.trampo.backend.domain.ticket.UrgentTicket;
import br.com.trampo.backend.domain.enums.StatusTicket;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public interface UrgentTicketDao {

    UrgentTicket save(UrgentTicket urgentTicket) throws SQLException;
    List<UrgentTicket> findByUserId(int userId, List<StatusTicket> statuses, int page, int size) throws SQLException;
    List<UrgentTicket> findByProviderId(int providerId, List<StatusTicket> statuses, int page, int size) throws SQLException;
    Optional<UrgentTicket> findById(int id);
    boolean updateStatus(int id, StatusTicket currentStatus, StatusTicket newStatus);
}
