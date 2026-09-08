package br.com.trampo.backend.controller.notification;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.domain.notification.Notification;
import br.com.trampo.backend.dto.notification.ResponseNotificationDto;
import br.com.trampo.backend.port.service.notification.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/notification")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping()
    public ResponseEntity<ResponseNotificationDto> getNotifications(@AuthenticationPrincipal Users user) {
        ResponseNotificationDto responseNotificationDto = null;
        return ResponseEntity.status(HttpStatus.OK).body(responseNotificationDto);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<ResponseNotificationDto>> getUnreadNotifications(
            @AuthenticationPrincipal Users loggedUser) {

        List<Notification> unreadNotifications = notificationService.getUnreadByUserId(loggedUser);

        List<ResponseNotificationDto> responseList = unreadNotifications.stream()
                .map(notif -> new ResponseNotificationDto(
                        notif.getId(),
                        notif.getMessage(),
                        notif.getCreatedAt(),
                        notif.getTicket().getId()
                ))
                .toList();

        return ResponseEntity.ok(responseList);
    }

    // Marca a notificação como lida
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Integer id,
            @AuthenticationPrincipal Users loggedUser) {

        // (Fazendo o cast para int caso o seu getId() retorne um long)
        notificationService.markAsRead(id, (int) loggedUser.getId());

        // Retorna 204 No Content (Sucesso, sem corpo na resposta)
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal Users loggedUser){
        notificationService.markAllAsRead((int) loggedUser.getId());
        return ResponseEntity.noContent().build();
    }


}
