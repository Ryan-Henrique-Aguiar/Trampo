package br.com.trampo.backend.implementation.service.notification;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.notification.Notification;
import br.com.trampo.backend.domain.ticket.Ticket;
import br.com.trampo.backend.dto.notification.CreateNotificationDto;
import br.com.trampo.backend.port.dao.notification.NotificationDao;
import br.com.trampo.backend.port.dao.ticket.TicketDao;
import br.com.trampo.backend.port.service.notification.NotificationService;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationDao notificationDao;
    private final TicketDao ticketDao;


    public NotificationServiceImpl(NotificationDao notificationDao, TicketDao ticketDao) {
        this.notificationDao = notificationDao;
        this.ticketDao = ticketDao;
    }

    @Override
    public Notification create(String message, Integer ticketId, Users user) {
        Ticket ticket = null;
        try {
            ticket = ticketDao.findById(ticketId)
                    .orElseThrow(() -> new RuntimeException("Ticket não encontrado ao criar notificação"));
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTicket(ticket);

        notification.setUser(user);
        notification.setIsRead(false);

        return notificationDao.save(notification);
    }

    @Override
    public List<Notification> getUnreadByUserId(Users user) {
        // Usa o (int) cast assumindo que seu Users.getId() retorne Long
        return notificationDao.findAllNotificationsByUserId((int) user.getId());
    }

    @Override
    public void markAsRead(Integer notificationId, Integer userId) {
        Notification notification = notificationDao.findById(notificationId);

        if (notification == null) {
            throw new RuntimeException("Notificação não encontrada.");
        }

        // Trava de segurança para impedir que um usuário leia a notificação de outro
        if (notification.getUser().getId() != userId.intValue()) {
            throw new RuntimeException("Acesso negado: esta notificação pertence a outro usuário.");
        }

        notificationDao.markAsRead(notification);
    }

    @Override
    public void markAllAsRead(Integer userId){
        notificationDao.markAllAsRead(userId);
    }
}
