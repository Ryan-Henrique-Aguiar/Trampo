package br.com.trampo.backend.port.service.notification;


import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.notification.Notification;
import br.com.trampo.backend.dto.notification.CreateNotificationDto;

import java.sql.SQLException;
import java.util.List;

public interface NotificationService {

    Notification create(String message, Integer ticketId, Users user);

    List<Notification> getUnreadByUserId(Users user);

    void markAsRead(Integer notificationId, Integer userId);

    void markAllAsRead(Integer userId);

}
