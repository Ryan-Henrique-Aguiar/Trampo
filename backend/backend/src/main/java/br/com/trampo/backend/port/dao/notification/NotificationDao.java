package br.com.trampo.backend.port.dao.notification;

import br.com.trampo.backend.domain.notification.Notification;

import java.util.List;

public interface NotificationDao {
    
    Notification save(Notification notification);

    List<Notification> findAllNotificationsByUserId(Integer userId);
}
